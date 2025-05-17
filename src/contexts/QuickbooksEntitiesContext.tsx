import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { toast } from "@/components/ui/use-toast";
import { entityGroups, Entity as EntityType } from "@/components/EntitySelection/EntityGroups";

// Define the types for our context
export type EntityRecord = any; // This is a generic type for any QuickBooks entity record

interface EntityState {
  records: EntityRecord[];
  filteredRecords: EntityRecord[];
  isLoading: boolean;
  error: string | null;
}

interface DeleteProgress {
  total: number;
  current: number;
  success: number;
  failed: number;
  details: Array<{
    id: string;
    status: string;
    error?: string;
  }>;
}

interface QuickbooksEntitiesContextType {
  // Entity selection state
  selectedEntity: string | null;
  setSelectedEntity: (entity: string | null) => void;
  selectedDateRange: DateRange | undefined;
  setSelectedDateRange: (dateRange: DateRange | undefined) => void;
  
  // Entity data state
  entityState: Record<string, EntityState>;
  
  // Entity operations
  fetchEntities: (entityType?: string) => Promise<void>;
  filterEntities: (searchTerm: string, entityType?: string) => void;
  deleteEntity: (entityId: string, entityType?: string) => Promise<boolean>;
  deleteSelectedEntities: (entityIds: string[], entityType?: string) => Promise<void>;
  
  // Multi-select functionality
  selectedEntityIds: string[];
  setSelectedEntityIds: (ids: string[]) => void;
  toggleEntitySelection: (id: string) => void;
  selectAllEntities: (select: boolean, entityType?: string) => void;
  
  // Delete progress tracking
  deleteProgress: DeleteProgress;
  isDeleting: boolean;
  
  // Available entity options
  entityOptions: Array<{ value: string; label: string }>;
  
  // Helper functions
  getNestedValue: (obj: any, path: string) => any;
}

// Create the context
const QuickbooksEntitiesContext = createContext<QuickbooksEntitiesContextType | undefined>(undefined);

// Create a provider component
export const QuickbooksEntitiesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { getAccessToken } = useQuickbooks();
  
  // Entity selection state
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  
  // Entity data state - using a record to store state for multiple entity types
  const [entityState, setEntityState] = useState<Record<string, EntityState>>({});
  
  // Multi-select functionality
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  
  // Delete progress tracking
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<DeleteProgress>({
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    details: [],
  });
  
  // Helper function to map entity IDs from EntityGroups to QuickBooks API entity types
  const mapEntityIdToQuickbooksType = (entityId: string): string => {
    const mapping: Record<string, string> = {
      'customers': 'Customer',
      'suppliers': 'Vendor',
      'employees': 'Employee',
      'products': 'Item',
      'chart_of_accounts': 'Account',
      'departments': 'Department',
      'classes': 'Class',
      'invoices': 'Invoice',
      'estimates': 'Estimate',
      'credit_memos': 'CreditMemo',
      'sales_receipts': 'SalesReceipt',
      'received_payments': 'Payment',
      'refund_receipts': 'RefundReceipt',
      'purchase_orders': 'PurchaseOrder',
      'expenses': 'Purchase',
      'bills': 'Bill',
      'vendor_credits': 'VendorCredit',
      'bill_payments': 'BillPayment',
      'credit_card_credits': 'CreditCardCredit',
      'checks': 'Check',
      'time_tracking': 'TimeActivity',
      'bank_deposits': 'Deposit',
      'transfers': 'Transfer',
      'journal_entries': 'JournalEntry',
    };
    
    return mapping[entityId] || entityId;
  };
  
  // Map entityGroups to entityOptions for dropdowns
  const entityOptions = React.useMemo(() => {
    return entityGroups.flatMap(group => 
      group.entities.map(entity => ({
        value: mapEntityIdToQuickbooksType(entity.id),
        label: entity.name
      }))
    );
  }, []);

  // Initialize context with default entity when first loaded
  useEffect(() => {
    if (user && entityOptions.length > 0 && !selectedEntity) {
      // Set a default entity (e.g., Customer)
      const defaultEntity = "Customer";
      console.log("Initializing QuickbooksEntitiesContext with default entity:", defaultEntity);
      setSelectedEntity(defaultEntity);
    }
  }, [user, entityOptions, selectedEntity]);
  
  // Reset selected entity IDs when entity type changes
  useEffect(() => {
    setSelectedEntityIds([]);
  }, [selectedEntity]);
  
  // Function to fetch entities from QuickBooks
  const fetchEntities = useCallback(async (entityType?: string) => {
    const typeToFetch = entityType || selectedEntity;
    if (!typeToFetch || !user?.id) return;
    
    // Update entity state to show loading
    setEntityState(prev => ({
      ...prev,
      [typeToFetch]: {
        ...(prev[typeToFetch] || {}),
        isLoading: true,
        error: null,
      } as EntityState
    }));
    
    try {
      // Build query with date filter if date range is selected
      let query = null;
      if (selectedDateRange?.from && selectedDateRange?.to) {
        const fromDate = format(selectedDateRange.from, "yyyy-MM-dd");
        const toDate = format(selectedDateRange.to, "yyyy-MM-dd");
        
        // Different entities may have different date fields
        const dateField = typeToFetch === "Invoice" || typeToFetch === "Bill" 
          ? "TxnDate" 
          : "MetaData.CreateTime";
        
        query = `SELECT * FROM ${typeToFetch} WHERE ${dateField} >= '${fromDate}' AND ${dateField} <= '${toDate}' MAXRESULTS 1000`;
      }
      
      console.log(`Calling quickbooks-entities edge function to fetch ${typeToFetch} entities`);
      
      // Call our edge function to fetch entities
      const { data, error } = await supabase.functions.invoke("quickbooks-entities", {
        body: {
          operation: "fetch",
          entityType: typeToFetch,
          userId: user.id,
          query: query
        }
      });
      
      if (error) {
        throw new Error(`Error invoking function: ${error.message}`);
      }
      
      if (data.error) {
        throw new Error(`Error from function: ${data.error}`);
      }
      
      // Extract the entities from the response
      const fetchedEntities = data.data?.QueryResponse?.[typeToFetch] || [];
      console.log(`Fetched ${fetchedEntities.length} ${typeToFetch} entities`);
      
      // Update entity state with fetched data
      setEntityState(prev => ({
        ...prev,
        [typeToFetch]: {
          records: fetchedEntities,
          filteredRecords: fetchedEntities,
          isLoading: false,
          error: null
        }
      }));
      
      // Show success message
      if (fetchedEntities.length > 0) {
        toast({
          title: "Data Loaded",
          description: `Successfully loaded ${fetchedEntities.length} ${typeToFetch} records`,
        });
      } else {
        toast({
          title: "No Records Found",
          description: `No ${typeToFetch} records match your criteria`,
        });
      }
    } catch (error: any) {
      console.error(`Error fetching ${typeToFetch} entities:`, error);
      
      // Update entity state with error
      setEntityState(prev => ({
        ...prev,
        [typeToFetch]: {
          ...(prev[typeToFetch] || {}),
          isLoading: false,
          error: error.message
        } as EntityState
      }));
      
      toast({
        title: "Error",
        description: `Failed to fetch ${typeToFetch}: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [selectedEntity, selectedDateRange, user?.id]);
  
  // Function to filter entities based on search term
  const filterEntities = useCallback((searchTerm: string, entityType?: string) => {
    const typeToFilter = entityType || selectedEntity;
    if (!typeToFilter) return;
    
    const currentState = entityState[typeToFilter];
    if (!currentState || !currentState.records) return;
    
    const term = searchTerm.toLowerCase();
    const filtered = currentState.records.filter((record) => {
      // Generic search across common fields
      return (
        (record.DisplayName && record.DisplayName.toLowerCase().includes(term)) ||
        (record.Name && record.Name.toLowerCase().includes(term)) ||
        (record.DocNumber && record.DocNumber.toLowerCase().includes(term)) ||
        (record.Id && record.Id.toLowerCase().includes(term)) ||
        JSON.stringify(record).toLowerCase().includes(term)
      );
    });
    
    setEntityState(prev => ({
      ...prev,
      [typeToFilter]: {
        ...prev[typeToFilter],
        filteredRecords: filtered
      }
    }));
  }, [entityState, selectedEntity]);
  
  // Function to delete a single entity
  const deleteEntity = useCallback(async (entityId: string, entityType?: string): Promise<boolean> => {
    const typeToDelete = entityType || selectedEntity;
    if (!typeToDelete || !user?.id) return false;
    
    try {
      console.log(`Attempting to delete ${typeToDelete} with ID ${entityId}`);
      
      // Call our edge function to delete the entity
      const { data, error } = await supabase.functions.invoke("quickbooks-entities", {
        body: {
          operation: "delete",
          entityType: typeToDelete,
          userId: user.id,
          id: entityId
        }
      });
      
      if (error) {
        throw new Error(`Error invoking function: ${error.message}`);
      }
      
      if (data.error) {
        throw new Error(`Error from function: ${data.error}`);
      }
      
      // Update entity state to remove the deleted entity
      setEntityState(prev => {
        const currentState = prev[typeToDelete];
        if (!currentState) return prev;
        
        return {
          ...prev,
          [typeToDelete]: {
            ...currentState,
            records: currentState.records.filter(record => record.Id !== entityId),
            filteredRecords: currentState.filteredRecords.filter(record => record.Id !== entityId)
          }
        };
      });
      
      // Remove from selected entity IDs if it was selected
      setSelectedEntityIds(prev => prev.filter(id => id !== entityId));
      
      toast({
        title: "Entity Deleted",
        description: `Successfully deleted ${typeToDelete} with ID ${entityId}`,
      });
      
      return true;
    } catch (error: any) {
      console.error(`Error deleting ${typeToDelete}:`, error);
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [selectedEntity, user?.id]);
  
  // Function to delete multiple entities
  const deleteSelectedEntities = useCallback(async (entityIds: string[], entityType?: string) => {
    const typeToDelete = entityType || selectedEntity;
    if (!typeToDelete || entityIds.length === 0) return;
    
    setIsDeleting(true);
    setDeleteProgress({
      total: entityIds.length,
      current: 0,
      success: 0,
      failed: 0,
      details: []
    });
    
    try {
      for (let i = 0; i < entityIds.length; i++) {
        const id = entityIds[i];
        try {
          const success = await deleteEntity(id, typeToDelete);
          
          if (success) {
            setDeleteProgress(prev => ({
              ...prev,
              current: i + 1,
              success: prev.success + 1,
              details: [...prev.details, { id, status: "success" }]
            }));
          } else {
            setDeleteProgress(prev => ({
              ...prev,
              current: i + 1,
              failed: prev.failed + 1,
              details: [...prev.details, { 
                id, 
                status: "error", 
                error: "Failed to delete" 
              }]
            }));
          }
        } catch (error: any) {
          setDeleteProgress(prev => ({
            ...prev,
            current: i + 1,
            failed: prev.failed + 1,
            details: [...prev.details, { 
              id, 
              status: "error", 
              error: error.message 
            }]
          }));
        }
      }
      
      // Refresh the entities after bulk deletion
      await fetchEntities(typeToDelete);
      
    } catch (error: any) {
      console.error("Error in bulk deletion:", error);
      toast({
        title: "Bulk Deletion Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteEntity, fetchEntities, selectedEntity]);
  
  // Function to toggle selection of an entity
  const toggleEntitySelection = useCallback((id: string) => {
    setSelectedEntityIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(existingId => existingId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);
  
  // Function to select/deselect all entities
  const selectAllEntities = useCallback((select: boolean, entityType?: string) => {
    const typeToSelect = entityType || selectedEntity;
    if (!typeToSelect) return;
    
    const currentState = entityState[typeToSelect];
    if (!currentState || !currentState.filteredRecords) return;
    
    if (select) {
      const allIds = currentState.filteredRecords.map(record => record.Id);
      setSelectedEntityIds(allIds);
    } else {
      setSelectedEntityIds([]);
    }
  }, [entityState, selectedEntity]);
  
  // Helper function to safely get nested property values
  const getNestedValue = useCallback((obj: any, path: string) => {
    if (!obj) return "N/A";
    
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      // Handle array notation like Line[0]
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.split('[')[0];
        const index = parseInt(key.split('[')[1].split(']')[0]);
        
        if (!value[arrayKey] || !value[arrayKey][index]) {
          return "N/A";
        }
        
        value = value[arrayKey][index];
      } else if (value[key] === undefined || value[key] === null) {
        return "N/A";
      } else {
        value = value[key];
      }
    }
    
    // Format certain types of values
    if (typeof value === 'boolean') {
      return value ? "Yes" : "No";
    }
    
    return value.toString();
  }, []);
  
  // Effect to fetch records when entity and date range change
  useEffect(() => {
    if (selectedEntity) {
      fetchEntities();
    }
  }, [selectedEntity, selectedDateRange, fetchEntities]);
  
  const contextValue: QuickbooksEntitiesContextType = {
    selectedEntity,
    setSelectedEntity,
    selectedDateRange,
    setSelectedDateRange,
    entityState,
    fetchEntities,
    filterEntities,
    deleteEntity,
    deleteSelectedEntities,
    selectedEntityIds,
    setSelectedEntityIds,
    toggleEntitySelection,
    selectAllEntities,
    deleteProgress,
    isDeleting,
    entityOptions,
    getNestedValue
  };
  
  return (
    <QuickbooksEntitiesContext.Provider value={contextValue}>
      {children}
    </QuickbooksEntitiesContext.Provider>
  );
};

// Custom hook to use the context
export const useQuickbooksEntities = () => {
  const context = useContext(QuickbooksEntitiesContext);
  if (context === undefined) {
    throw new Error("useQuickbooksEntities must be used within a QuickbooksEntitiesProvider");
  }
  return context;
};

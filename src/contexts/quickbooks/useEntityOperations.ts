
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export interface EntityState {
  records: any[];
  filteredRecords: any[];
  isLoading: boolean;
  error: string | null;
}

export interface DeleteProgress {
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

export const useEntityOperations = (
  userId: string | undefined, 
  selectedEntity: string | null,
  selectedDateRange: { from?: Date; to?: Date } | undefined,
  entityState: Record<string, EntityState>,
  setEntityState: React.Dispatch<React.SetStateAction<Record<string, EntityState>>>
) => {
  // Delete progress tracking
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<DeleteProgress>({
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    details: [],
  });

  // Function to fetch entities from QuickBooks
  const fetchEntities = useCallback(async (entityType?: string) => {
    const typeToFetch = entityType || selectedEntity;
    if (!typeToFetch || !userId) return;
    
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
        let dateField;
        switch(typeToFetch) {
          case "Invoice":
          case "Bill":
          case "CreditMemo":
          case "Estimate":
          case "SalesReceipt":
          case "Payment":
          case "RefundReceipt":
          case "PurchaseOrder":
          case "VendorCredit":
          case "Deposit":
          case "Transfer":
          case "JournalEntry":
            dateField = "TxnDate";
            break;
          case "Customer":
          case "Vendor":
          case "Item":
          case "Account":
          case "Employee":
          case "Department":
          case "Class":
            dateField = "MetaData.CreateTime";
            break;
          default:
            dateField = "MetaData.CreateTime";
        }
        
        // For special entity types that are actually Purchase entity with filters
        if (typeToFetch === "Check") {
          query = `SELECT * FROM Purchase WHERE TxnDate >= '${fromDate}' AND TxnDate <= '${toDate}' AND PaymentType = 'Check' MAXRESULTS 1000`;
        } else {
          query = `SELECT * FROM ${typeToFetch} WHERE ${dateField} >= '${fromDate}' AND ${dateField} <= '${toDate}' MAXRESULTS 1000`;
        }
      } else {
        // For special entity types that are actually Purchase entity with filters
        if (typeToFetch === "Check") {
          query = `SELECT * FROM Purchase WHERE PaymentType = 'Check' MAXRESULTS 1000`;
        }
      }
      
      console.log(`Calling quickbooks-entities edge function to fetch ${typeToFetch} entities with query: ${query || 'default'}`);
      
      // Call our edge function to fetch entities
      const { data, error } = await supabase.functions.invoke("quickbooks-entities", {
        body: {
          operation: "fetch",
          entityType: typeToFetch,
          userId: userId,
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
      let fetchedEntities = [];
      
      // Handle special cases for entities that are actually filtered Purchases
      if (typeToFetch === "Check") {
        fetchedEntities = data.data?.QueryResponse?.Purchase || [];
      } else {
        fetchedEntities = data.data?.QueryResponse?.[typeToFetch] || [];
      }
      
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
  }, [selectedEntity, selectedDateRange, userId, setEntityState]);
  
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
  }, [entityState, selectedEntity, setEntityState]);
  
  // Function to delete a single entity
  const deleteEntity = useCallback(async (entityId: string, entityType?: string): Promise<boolean> => {
    const typeToDelete = entityType || selectedEntity;
    if (!typeToDelete || !userId) return false;
    
    try {
      console.log(`Attempting to delete ${typeToDelete} with ID ${entityId}`);
      
      // Call our edge function to delete the entity
      const { data, error } = await supabase.functions.invoke("quickbooks-entities", {
        body: {
          operation: "delete",
          entityType: typeToDelete,
          userId: userId,
          id: entityId
        }
      });
      
      if (error) {
        throw new Error(`Error invoking function: ${error.message}`);
      }
      
      if (data.error) {
        throw new Error(`Error from function: ${data.error}`);
      }
      
      // Show success message
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
  }, [selectedEntity, userId]);
  
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

  return {
    fetchEntities,
    filterEntities,
    deleteEntity,
    deleteSelectedEntities,
    isDeleting,
    deleteProgress
  };
};

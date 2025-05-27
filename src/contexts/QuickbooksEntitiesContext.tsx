
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { toast } from "@/components/ui/use-toast";
import { EntityState, QuickbooksEntitiesContextType, DateRange, DeleteProgress, EntityOption } from "./quickbooks/types";
import { getEntityOptions } from "./quickbooks/entityMapping";
import { useEntityOperations } from "./quickbooks/useEntityOperations";
import { useEntitySelection } from "./quickbooks/useEntitySelection";
import { getNestedValue } from "./quickbooks/entityUtils";
import { logError } from "@/utils/errorLogger";

// Create the context
const QuickbooksEntitiesContext = createContext<QuickbooksEntitiesContextType | undefined>(undefined);

// Create a provider component
export const QuickbooksEntitiesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { getAccessToken, isConnected } = useQuickbooks();
  
  // Entity data state - using a record to store state for multiple entity types
  const [entityState, setEntityState] = useState<Record<string, EntityState>>({});
  
  // Entity selection hooks
  const {
    selectedEntity,
    setSelectedEntity,
    selectedDateRange,
    setSelectedDateRange,
    selectedEntityIds,
    setSelectedEntityIds,
    toggleEntitySelection,
    selectAllEntities: baseSelectAllEntities
  } = useEntitySelection();
  
  // Entity operation hooks
  const {
    fetchEntities,
    filterEntities,
    deleteEntity,
    deleteSelectedEntities: baseDeleteSelectedEntities,
    isDeleting,
    deleteProgress
  } = useEntityOperations(
    user?.id,
    selectedEntity,
    selectedDateRange,
    entityState,
    setEntityState
  );
  
  // Generate entity options for dropdowns - flatten the groups into a single array
  const entityOptions = React.useMemo(() => {
    const groups = getEntityOptions();
    const flatOptions: EntityOption[] = [];
    
    groups.forEach(group => {
      group.entities.forEach(entity => {
        flatOptions.push(entity);
      });
    });
    
    return flatOptions;
  }, []);

  // Reset selected entity IDs when entity type changes
  useEffect(() => {
    setSelectedEntityIds([]);
  }, [selectedEntity, setSelectedEntityIds]);
  
  // Do not initialize with default entity and do not fetch entities automatically
  // This addresses Issue #1 and Issue #2 by not loading entities automatically on login
  
  // Wrapper for selectAllEntities that uses the current entity's filtered records
  const selectAllEntitiesWrapper = (select: boolean, entities?: any[]) => {
    if (entities) {
      baseSelectAllEntities(select, entities);
      return;
    }
    
    const typeToSelect = selectedEntity;
    if (!typeToSelect) return;
    
    const currentState = entityState[typeToSelect];
    if (!currentState || !currentState.filteredRecords) return;
    
    baseSelectAllEntities(select, currentState.filteredRecords);
  };
  
  // Wrapper for deleteSelectedEntities to match the expected signature
  const deleteSelectedEntitiesWrapper = async (entityIds?: string[]): Promise<{ success: number; failed: number }> => {
    const idsToDelete = entityIds || selectedEntityIds;
    if (!idsToDelete.length || !selectedEntity) {
      return { success: 0, failed: 0 };
    }
    
    await baseDeleteSelectedEntities(idsToDelete);
    
    return {
      success: deleteProgress.success,
      failed: deleteProgress.failed
    };
  };
  
  const contextValue: QuickbooksEntitiesContextType = {
    selectedEntity,
    setSelectedEntity,
    selectedDateRange,
    setSelectedDateRange,
    entityState,
    fetchEntities,
    filterEntities,
    deleteEntity,
    deleteSelectedEntities: deleteSelectedEntitiesWrapper,
    selectedEntityIds,
    setSelectedEntityIds,
    toggleEntitySelection,
    selectAllEntities: selectAllEntitiesWrapper,
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

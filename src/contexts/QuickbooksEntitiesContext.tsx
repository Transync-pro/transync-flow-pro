
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { toast } from "@/components/ui/use-toast";
import { EntityState, QuickbooksEntitiesContextType } from "./quickbooks/types";
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
    deleteSelectedEntities,
    isDeleting,
    deleteProgress
  } = useEntityOperations(
    user?.id,
    selectedEntity,
    selectedDateRange,
    entityState,
    setEntityState
  );
  
  // Generate entity options for dropdowns
  const entityOptions = React.useMemo(() => getEntityOptions(), []);

  // Reset selected entity IDs when entity type changes
  useEffect(() => {
    setSelectedEntityIds([]);
  }, [selectedEntity, setSelectedEntityIds]);
  
  // Do not initialize with default entity and do not fetch entities automatically
  // This addresses Issue #1 and Issue #2 by not loading entities automatically on login
  
  // Wrapper for selectAllEntities that uses the current entity's filtered records
  const selectAllEntitiesWrapper = (select: boolean, entityType?: string) => {
    const typeToSelect = entityType || selectedEntity;
    if (!typeToSelect) return;
    
    const currentState = entityState[typeToSelect];
    if (!currentState || !currentState.filteredRecords) return;
    
    baseSelectAllEntities(select, currentState.filteredRecords);
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
    deleteSelectedEntities,
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

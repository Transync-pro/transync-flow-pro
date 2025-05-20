
import { useCallback } from "react";
import { EntityState, DateRange, DeleteProgress } from "./types";
import { useFetchEntities } from "./hooks/useFetchEntities";
import { useDeleteEntities } from "./hooks/useDeleteEntities";

// Main hook that combines all the entity operation capabilities
export const useEntityOperations = (
  userId: string | undefined, 
  selectedEntity: string | null,
  selectedDateRange: DateRange,
  entityState: Record<string, EntityState>,
  setEntityState: React.Dispatch<React.SetStateAction<Record<string, EntityState>>>
) => {
  // Use the separated hooks
  const { fetchEntities, filterEntities } = useFetchEntities(
    userId,
    selectedEntity,
    selectedDateRange,
    entityState,
    setEntityState
  );
  
  const { deleteEntity, deleteSelectedEntities, isDeleting, deleteProgress } = useDeleteEntities(
    userId,
    selectedEntity,
    fetchEntities
  );

  return {
    fetchEntities,
    filterEntities,
    deleteEntity,
    deleteSelectedEntities,
    isDeleting,
    deleteProgress
  };
};

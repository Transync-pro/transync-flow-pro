
import { useState, useCallback } from "react";
import { DateRange } from "react-day-picker";

export const useEntitySelection = () => {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  
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
  const selectAllEntities = useCallback((select: boolean, records: any[]) => {
    if (select) {
      const allIds = records.map(record => record.Id);
      setSelectedEntityIds(allIds);
    } else {
      setSelectedEntityIds([]);
    }
  }, []);

  return {
    selectedEntity,
    setSelectedEntity,
    selectedDateRange,
    setSelectedDateRange,
    selectedEntityIds,
    setSelectedEntityIds,
    toggleEntitySelection,
    selectAllEntities
  };
};

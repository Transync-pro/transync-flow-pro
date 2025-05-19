
import { useState } from 'react';
import { DateRange } from './types';

export const useEntitySelection = () => {
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({ from: null, to: null });
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);

  const toggleEntitySelection = (id: string) => {
    setSelectedEntityIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(entityId => entityId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAllEntities = (select: boolean, entities?: any[]) => {
    if (!entities) {
      setSelectedEntityIds([]);
      return;
    }
    
    if (select) {
      const ids = entities
        .filter(entity => entity.Id)
        .map(entity => entity.Id);
      setSelectedEntityIds(ids);
    } else {
      setSelectedEntityIds([]);
    }
  };

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

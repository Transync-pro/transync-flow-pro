
import { useState, useEffect } from 'react';
import { getEntityColumns, formatDisplayName } from "@/contexts/quickbooks/entityMapping";

export const useExportFields = (selectedEntity: string | null, entityState: any) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset selected fields when entity changes
  useEffect(() => {
    setSelectedFields([]);
  }, [selectedEntity]);

  // Get available fields for the current entity
  const getAvailableFields = (): string[] => {
    if (!selectedEntity) return [];
    
    // Use the predefined entity columns from our mapping
    const columnConfigs = getEntityColumns(selectedEntity);
    return columnConfigs.map(config => config.field);
  };
  
  // Filter fields based on search
  const getFilteredFields = (): string[] => {
    const fields = getAvailableFields();
    if (!searchQuery) return fields;
    
    return fields.filter(field => 
      formatDisplayName(field).toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Handle field selection
  const toggleFieldSelection = (field: string) => {
    setSelectedFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  // Handle select all fields
  const handleSelectAllFields = (select: boolean) => {
    if (select) {
      setSelectedFields(getAvailableFields());
    } else {
      setSelectedFields([]);
    }
  };

  return {
    selectedFields,
    setSelectedFields,
    searchQuery,
    setSearchQuery,
    getAvailableFields,
    getFilteredFields,
    toggleFieldSelection,
    handleSelectAllFields
  };
};

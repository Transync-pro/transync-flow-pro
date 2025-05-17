
// Helper function to safely get nested property values
export const getNestedValue = (obj: any, path: string) => {
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
};

// Update entity state after deletions
export const updateEntityStateAfterDelete = (
  entityState: Record<string, any>,
  entityType: string,
  deletedId: string
) => {
  const currentState = entityState[entityType];
  if (!currentState) return entityState;

  return {
    ...entityState,
    [entityType]: {
      ...currentState,
      records: currentState.records.filter((record: any) => record.Id !== deletedId),
      filteredRecords: currentState.filteredRecords.filter((record: any) => record.Id !== deletedId)
    }
  };
};

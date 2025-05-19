
// Utils for CSV export
export const convertToCSV = (records: any[], fields: string[]): string => {
  if (!records || !Array.isArray(records) || records.length === 0) {
    return fields.join(',') + '\n'; // Return only headers if no data
  }
  
  // Add headers row
  let csv = fields.join(',') + '\n';
  
  // Add data rows
  records.forEach(item => {
    const row = fields.map(field => {
      // Handle nested fields with dot notation (e.g., "CustomerRef.name")
      const value = field.includes('.')
        ? field.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : '', item)
        : item[field] !== undefined ? item[field] : '';
        
      // Escape commas and quotes
      const escapedValue = typeof value === 'string' 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
        
      return escapedValue !== undefined ? escapedValue : '';
    }).join(',');
    
    csv += row + '\n';
  });
  
  return csv;
};

export const exportUtils = {
  convertToCSV
};

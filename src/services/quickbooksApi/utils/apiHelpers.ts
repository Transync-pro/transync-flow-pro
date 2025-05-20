
import { supabase } from "@/integrations/supabase/client";

// QuickBooks API base URL (for sandbox or production)
export const API_BASE_URL = "https://sandbox-quickbooks.api.intuit.com";

// Get the current user's QuickBooks connection
export const getQBConnection = async () => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;
  
  const { data, error } = await supabase
    .from('quickbooks_connections')
    .select('*')
    .eq('user_id', userData.user.id)
    .single();
  
  if (error || !data) return null;
  return data;
};

// Function to prepare API headers with authentication
export const getHeaders = (accessToken: string) => {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

// Function to convert QuickBooks data to CSV format
export const convertToCSV = (data: any[], fields: string[]) => {
  // Add headers row
  let csv = fields.join(',') + '\n';
  
  // Add data rows
  data.forEach(item => {
    const row = fields.map(field => {
      // Handle nested fields with dot notation (e.g., "CustomerRef.name")
      const value = field.includes('.')
        ? field.split('.').reduce((obj, key) => obj && obj[key] ? obj[key] : '', item)
        : item[field] || '';
        
      // Escape commas and quotes
      const escapedValue = typeof value === 'string' 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
        
      return escapedValue;
    }).join(',');
    
    csv += row + '\n';
  });
  
  return csv;
};

// Function to convert nested QuickBooks data for display in UI
export const flattenQuickbooksData = (data: any) => {
  const flattened: Record<string, any> = {};
  
  const flattenObject = (obj: any, prefix = '') => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], `${prefix}${key}.`);
      } else if (Array.isArray(obj[key])) {
        // For arrays, just count the number of items
        flattened[`${prefix}${key}`] = `[${obj[key].length} items]`;
      } else {
        flattened[`${prefix}${key}`] = obj[key];
      }
    }
  };
  
  flattenObject(data);
  return flattened;
};


import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Re-export from connections.ts
export { getQBConnection, updateConnectionTokens, needsTokenRefresh } from './quickbooksApi/connections';

// QuickBooks API base URL for sandbox environment
const API_BASE_URL = "https://sandbox-quickbooks.api.intuit.com";

// Function to log operations in Supabase
export const logOperation = async (options: {
  operationType: 'import' | 'export' | 'delete';
  entityType: string;
  recordId: string | null;
  status: 'success' | 'error' | 'pending' | 'partial';
  details?: any;
}) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      throw new Error("User not authenticated");
    }
    
    await supabase.from("operation_logs").insert({
      user_id: user.user.id,
      operation_type: options.operationType,
      entity_type: options.entityType,
      record_id: options.recordId,
      status: options.status,
      details: options.details
    });
  } catch (error) {
    console.error("Error logging operation:", error);
  }
};

// Function to prepare API headers with authentication
const getHeaders = (accessToken: string) => {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

// Function to query QuickBooks data
export const queryQuickbooksData = async (
  accessToken: string,
  realmId: string,
  entity: string,
  fields: string[] = ['*'],
  conditions?: string,
  maxResults: number = 1000
) => {
  try {
    const headers = await getHeaders(accessToken);
    let query = `SELECT ${fields.join(', ')} FROM ${entity}`;
    
    if (conditions) {
      query += ` WHERE ${conditions}`;
    }
    
    query += ` MAXRESULTS ${maxResults}`;
    
    const response = await fetch(`${API_BASE_URL}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.Fault?.Error?.[0]?.Message || "Error fetching data from QuickBooks");
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error querying QuickBooks data:", error);
    throw error;
  }
};

// Function to create an entity in QuickBooks
export const createQuickbooksEntity = async (
  accessToken: string,
  realmId: string,
  entity: string,
  payload: any
) => {
  try {
    const headers = await getHeaders(accessToken);
    
    const response = await fetch(`${API_BASE_URL}/v3/company/${realmId}/${entity.toLowerCase()}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.Fault?.Error?.[0]?.Message || `Error creating ${entity}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error creating ${entity}:`, error);
    throw error;
  }
};

// Function to update an entity in QuickBooks
export const updateQuickbooksEntity = async (
  accessToken: string,
  realmId: string,
  entity: string,
  entityId: string,
  payload: any
) => {
  try {
    const headers = await getHeaders(accessToken);
    
    const response = await fetch(`${API_BASE_URL}/v3/company/${realmId}/${entity.toLowerCase()}`, {
      method: 'POST', // QuickBooks API uses POST for updates with sparse=true
      headers,
      body: JSON.stringify({
        ...payload,
        Id: entityId,
        sparse: true
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.Fault?.Error?.[0]?.Message || `Error updating ${entity}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error updating ${entity}:`, error);
    throw error;
  }
};

// Function to delete (deactivate) an entity in QuickBooks
export const deleteQuickbooksEntity = async (
  accessToken: string,
  realmId: string,
  entity: string,
  entityId: string
) => {
  try {
    // Most QuickBooks entities use Active=false to "delete" them
    return await updateQuickbooksEntity(accessToken, realmId, entity, entityId, {
      Active: false
    });
  } catch (error) {
    console.error(`Error deleting ${entity}:`, error);
    throw error;
  }
};

// Function to get entity schema/fields
export const getEntitySchema = (entity: string) => {
  const schemas: Record<string, any> = {
    Customer: {
      required: ['DisplayName'],
      fields: ['DisplayName', 'GivenName', 'FamilyName', 'CompanyName', 'PrimaryEmailAddr', 'PrimaryPhone', 'BillAddr']
    },
    Invoice: {
      required: ['CustomerRef', 'Line'],
      fields: ['CustomerRef', 'Line', 'TxnDate', 'DueDate', 'TotalAmt', 'PrivateNote']
    },
    Item: {
      required: ['Name', 'Type'],
      fields: ['Name', 'Description', 'Active', 'Type', 'UnitPrice', 'PurchaseCost', 'IncomeAccountRef', 'ExpenseAccountRef']
    },
    Bill: {
      required: ['VendorRef'],
      fields: ['VendorRef', 'Line', 'TxnDate', 'DueDate', 'TotalAmt']
    }
  };
  
  return schemas[entity] || { required: [], fields: [] };
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

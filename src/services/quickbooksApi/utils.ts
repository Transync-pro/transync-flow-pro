
import { QuickbooksSchema } from "./types";

// Function to get entity schema/fields
export const getEntitySchema = (entity: string): QuickbooksSchema => {
  const schemas: Record<string, QuickbooksSchema> = {
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

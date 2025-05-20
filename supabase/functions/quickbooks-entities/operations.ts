import { getQBApiBaseUrl } from './config.ts';
import { supabase } from './connection.ts';

// Valid operation types that match the database constraint
export type ValidOperationType = 'fetch' | 'export' | 'import' | 'delete';

// Map API operations to valid database operation types
export const mapOperationType = (apiOperation: string): ValidOperationType => {
  // Normalize to lowercase for case-insensitive comparison
  const operation = apiOperation.toLowerCase();
  
  // Direct mapping for already valid types
  if (['fetch', 'export', 'import', 'delete'].includes(operation)) {
    return operation as ValidOperationType;
  }
  
  // Fetch operations
  if (['get', 'read', 'query', 'list', 'find'].includes(operation)) {
    return 'fetch';
  }
  
  // Delete operations
  if (['remove', 'destroy', 'trash'].includes(operation)) {
    return 'delete';
  }
  
  // Import operations (create/update)
  if (['create', 'update', 'put', 'post', 'save', 'upsert'].includes(operation)) {
    return 'import';
  }
  
  // Export operations
  if (['download', 'extract'].includes(operation)) {
    return 'export';
  }
  
  // Default to fetch for unknown operations
  console.warn(`Unknown operation type "${apiOperation}" - defaulting to "fetch"`);
  return 'fetch';
};

// Log operations for auditing purposes
export const logOperation = async (
  userId: string,
  operationType: string,  // Accept any string but map it to valid types
  entityType: string,
  status: 'success' | 'error',
  details: any = {},
  recordId: string | null = null
) => {
  try {
    // Map the operation type to a valid database operation type
    const validOperationType = mapOperationType(operationType);
    
    // Execute the insert with the validated operation type
    const { error } = await supabase.from('operation_logs').insert({
      user_id: userId,
      operation_type: validOperationType,  // Use the mapped valid operation type
      entity_type: entityType,
      record_id: recordId || details.id || null,
      status,
      details
    });
    
    if (error) {
      console.error('Error logging operation:', error);
    }
  } catch (error) {
    console.error('Error logging operation:', error);
  }
};

// Fetch entities from QuickBooks API
export const fetchEntities = async (
  accessToken: string, 
  realmId: string, 
  entityType: string,
  query?: string
) => {
  try {
    const apiUrl = `${getQBApiBaseUrl()}/v3/company/${realmId}/query`;
    
    // Handle special entity types that are actually Purchases with filters
    let queryString = query;
    if (!queryString) {
      if (entityType === "Check") {
        queryString = `SELECT * FROM Purchase WHERE PaymentType = 'Check' MAXRESULTS 1000`;
      } else {
        queryString = `SELECT * FROM ${entityType} MAXRESULTS 1000`;
      }
    } else {
      // Adjust query for special entity types
      if (entityType === "Check" && !queryString.includes("PaymentType = 'Check'")) {
        queryString = queryString.replace("FROM Purchase", "FROM Purchase WHERE PaymentType = 'Check'");
      }
    }
    
    console.log(`Fetching ${entityType} with query: ${queryString}`);
    
    const response = await fetch(`${apiUrl}?query=${encodeURIComponent(queryString)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching ${entityType}:`, errorText);
      throw new Error(`Failed to fetch ${entityType}: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in fetchEntities (${entityType}):`, error);
    throw error;
  }
};

// Create a record for a specific entity type
export const createEntity = async (
  accessToken: string,
  realmId: string,
  entityType: string,
  entityData: any
) => {
  try {
    const apiUrl = `${getQBApiBaseUrl()}/v3/company/${realmId}/${entityType.toLowerCase()}`;
    
    console.log(`Creating ${entityType} with data:`, entityData);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(entityData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error creating ${entityType}:`, errorText);
      throw new Error(`Failed to create ${entityType}: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in createEntity (${entityType}):`, error);
    throw error;
  }
};

// Update a record for a specific entity type
export const updateEntity = async (
  accessToken: string,
  realmId: string,
  entityType: string,
  entityId: string,
  entityData: any,
  syncToken: string
) => {
  try {
    // For special entity types, use the Purchase endpoint
    const actualEntityType = entityType === "Check" || entityType === "CreditCardCredit" ? "purchase" : entityType.toLowerCase();
    
    const apiUrl = `${getQBApiBaseUrl()}/v3/company/${realmId}/${actualEntityType}`;
    
    console.log(`Updating ${entityType} with ID ${entityId}`);
    
    // Make sure we include the required fields for updates
    const updatedData = {
      ...entityData,
      Id: entityId,
      SyncToken: syncToken,
      sparse: true
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error updating ${entityType}:`, errorText);
      throw new Error(`Failed to update ${entityType}: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in updateEntity (${entityType}):`, error);
    throw error;
  }
};

// Delete a record for a specific entity type
export const deleteEntity = async (
  accessToken: string,
  realmId: string,
  entityType: string,
  entityId: string
) => {
  try {
    // First, get the entity to retrieve its SyncToken
    let query;
    if (entityType === "Check") {
      query = `SELECT * FROM Purchase WHERE Id = '${entityId}' AND PaymentType = 'Check'`;
    } else if (entityType === "CreditCardCredit") {
      query = `SELECT * FROM Purchase WHERE Id = '${entityId}' AND PaymentType = 'CreditCard' AND TotalAmt < 0`;
    } else {
      query = `SELECT * FROM ${entityType} WHERE Id = '${entityId}'`;
    }
    
    const entityData = await fetchEntities(
      accessToken, 
      realmId, 
      entityType === "Check" || entityType === "CreditCardCredit" ? "Purchase" : entityType,
      query
    );
    
    const actualEntityType = entityType === "Check" || entityType === "CreditCardCredit" ? "Purchase" : entityType;
    
    if (!entityData.QueryResponse || !entityData.QueryResponse[actualEntityType] || entityData.QueryResponse[actualEntityType].length === 0) {
      throw new Error(`Entity ${entityType} with ID ${entityId} not found`);
    }
    
    const entity = entityData.QueryResponse[actualEntityType][0];
    const syncToken = entity.SyncToken;
    
    // Different entities have different deletion methods
    let payload;
    let endpoint;
    
    // Handle different entity types specifically
    if (entityType === 'Invoice') {
      // For invoices, we'll use update to mark as cancelled instead of void
      // This avoids inventory date validation issues
      endpoint = `${getQBApiBaseUrl()}/v3/company/${realmId}/invoice`;
      payload = {
        Id: entityId,
        SyncToken: syncToken,
        sparse: true,
        // Set relevant fields that would effectively "disable" the invoice
        DocNumber: `CANCELLED-${entity.DocNumber || entityId}`,
        PrivateNote: `CANCELLED: ${entity.PrivateNote || ''} [Auto-cancelled ${new Date().toISOString()}]`
      };
    } else if (['Customer', 'Vendor', 'Employee', 'Item'].includes(entityType)) {
      // For these entity types, we set Active=false to "delete" them
      endpoint = `${getQBApiBaseUrl()}/v3/company/${realmId}/${entityType.toLowerCase()}`;
      payload = {
        Id: entityId,
        SyncToken: syncToken,
        Active: false,
        sparse: true
      };
    } else if (entityType === "Check" || entityType === "CreditCardCredit") {
      // For checks and credit card credits, use Purchase endpoint with special handling
      endpoint = `${getQBApiBaseUrl()}/v3/company/${realmId}/purchase`;
      payload = {
        Id: entityId,
        SyncToken: syncToken,
        // Set relevant fields to mark as inactive or cancelled
        DocNumber: `CANCELLED-${entity.DocNumber || entityId}`,
        PrivateNote: `CANCELLED: ${entity.PrivateNote || ''} [Auto-cancelled ${new Date().toISOString()}]`,
        sparse: true
      };
    } else if (entityType === "Bill" || entityType === "VendorCredit") {
      // Special handling for bills and vendor credits
      endpoint = `${getQBApiBaseUrl()}/v3/company/${realmId}/${entityType.toLowerCase()}`;
      payload = {
        Id: entityId,
        SyncToken: syncToken,
        sparse: true,
        // Mark as private note to indicate cancellation
        PrivateNote: `CANCELLED: ${entity.PrivateNote || ''} [Auto-cancelled ${new Date().toISOString()}]`
      };
    } else {
      // Default approach - try to set Active=false
      try {
        endpoint = `${getQBApiBaseUrl()}/v3/company/${realmId}/${entityType.toLowerCase()}`;
        
        // Default deletion approach
        payload = {
          Id: entityId,
          SyncToken: syncToken,
          sparse: true
        };
        
        // Add Active=false for entities that support it (most do)
        // This is the most common way to "delete" in QuickBooks
        payload.Active = false;
        
        console.log(`Attempting generic deletion approach for ${entityType}`);
      } catch (error) {
        throw new Error(`Deletion not implemented for entity type: ${entityType}`);
      }
    }
    
    console.log(`Deleting ${entityType} with ID ${entityId} using payload:`, payload);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error deleting ${entityType}:`, errorText);
      
      // Special handling for inventory date validation errors
      if (errorText.includes("Transaction date is prior to start date for inventory item")) {
        throw new Error(`Cannot delete this ${entityType} because it contains inventory items with dates that conflict with inventory start dates. Please contact your QuickBooks administrator.`);
      } else {
        throw new Error(`Failed to delete ${entityType}: ${response.status} ${response.statusText}`);
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in deleteEntity (${entityType}):`, error);
    throw error;
  }
};

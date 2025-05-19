
import { getQBApiBaseUrl } from './config.ts';
import { supabase } from './connection.ts';

// Log operations for auditing purposes
export const logOperation = async (
  userId: string,
  operationType: 'fetch' | 'create' | 'update' | 'delete',
  entityType: string,
  status: 'success' | 'error',
  details: any = {}
) => {
  try {
    await supabase.from('operation_logs').insert({
      user_id: userId,
      operation_type: operationType,
      entity_type: entityType,
      record_id: details.id || null,
      status,
      details
    });
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
    const actualEntityType = entityType === "Check" ? "purchase" : entityType.toLowerCase();
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

// Improved delete entity function to handle different entity types
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
    } else {
      query = `SELECT * FROM ${entityType} WHERE Id = '${entityId}'`;
    }
    
    const entityData = await fetchEntities(accessToken, realmId, entityType === "Check" ? "Purchase" : entityType, query);
    
    const actualEntityType = entityType === "Check" ? "Purchase" : entityType;
    
    if (!entityData.QueryResponse || !entityData.QueryResponse[actualEntityType] || 
        entityData.QueryResponse[actualEntityType].length === 0) {
      throw new Error(`Entity ${entityType} with ID ${entityId} not found`);
    }
    
    const entity = entityData.QueryResponse[actualEntityType][0];
    const syncToken = entity.SyncToken;
    
    // Different entities have different deletion methods
    let payload;
    let endpoint;
    
    // Handle different entity types specifically
    if (entityType === 'Invoice') {
      // For invoices, we need to void them instead of deleting
      endpoint = `${getQBApiBaseUrl()}/v3/company/${realmId}/invoice?operation=void`;
      payload = {
        Id: entityId,
        SyncToken: syncToken
      };
    } 
    else if (['Customer', 'Vendor', 'Employee', 'Item'].includes(entityType)) {
      // For these entity types, we set Active=false to "delete" them
      endpoint = `${getQBApiBaseUrl()}/v3/company/${realmId}/${entityType.toLowerCase()}`;
      payload = {
        Id: entityId,
        SyncToken: syncToken,
        Active: false,
        sparse: true
      };
    }
    else if (entityType === "Check") {
      // For checks, use Purchase endpoint
      endpoint = `${getQBApiBaseUrl()}/v3/company/${realmId}/purchase`;
      payload = {
        Id: entityId,
        SyncToken: syncToken,
        Active: false,
        sparse: true
      };
    }
    else {
      // Default approach - most entities don't support deletion directly
      throw new Error(`Deletion not implemented for entity type: ${entityType}`);
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
      throw new Error(`Failed to delete ${entityType}: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in deleteEntity (${entityType}):`, error);
    throw error;
  }
};

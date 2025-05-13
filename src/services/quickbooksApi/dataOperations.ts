
import { API_BASE_URL, getHeaders, logOperation } from "./apiClient";
import { QuickbooksEntity, QuickbooksQueryParams } from "./types";

// Function to query QuickBooks data
export const queryQuickbooksData = async (
  accessToken: string,
  realmId: string,
  { entity, fields = ['*'], conditions, maxResults = 1000 }: QuickbooksQueryParams
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
  payload: QuickbooksEntity
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
    
    // Log successful operation
    await logOperation({
      operationType: 'import',
      entityType: entity,
      recordId: data[entity]?.Id || null,
      status: 'success',
      details: { action: 'create', entity: data[entity] }
    });
    
    return data;
  } catch (error) {
    console.error(`Error creating ${entity}:`, error);
    
    // Log failed operation
    await logOperation({
      operationType: 'import',
      entityType: entity,
      recordId: null,
      status: 'error',
      details: { action: 'create', error: error.message }
    });
    
    throw error;
  }
};

// Function to update an entity in QuickBooks
export const updateQuickbooksEntity = async (
  accessToken: string,
  realmId: string,
  entity: string,
  entityId: string,
  payload: QuickbooksEntity
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
    
    // Log successful operation
    await logOperation({
      operationType: 'import',
      entityType: entity,
      recordId: entityId,
      status: 'success',
      details: { action: 'update', entity: data[entity] }
    });
    
    return data;
  } catch (error) {
    console.error(`Error updating ${entity}:`, error);
    
    // Log failed operation
    await logOperation({
      operationType: 'import',
      entityType: entity,
      recordId: entityId,
      status: 'error',
      details: { action: 'update', error: error.message }
    });
    
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
    const response = await updateQuickbooksEntity(accessToken, realmId, entity, entityId, {
      Active: false
    });
    
    // Log successful operation
    await logOperation({
      operationType: 'delete',
      entityType: entity,
      recordId: entityId,
      status: 'success',
      details: { action: 'delete', entity: response[entity] }
    });
    
    return response;
  } catch (error) {
    console.error(`Error deleting ${entity}:`, error);
    
    // Log failed operation
    await logOperation({
      operationType: 'delete',
      entityType: entity,
      recordId: entityId,
      status: 'error',
      details: { action: 'delete', error: error.message }
    });
    
    throw error;
  }
};


import { logOperation } from "@/utils/operationLogger";
import { API_BASE_URL, getHeaders } from "../utils/apiHelpers";

// Function to update an entity in QuickBooks
export const updateQuickbooksEntity = async (
  accessToken: string,
  realmId: string,
  entity: string,
  entityId: string,
  payload: any
) => {
  try {
    const headers = getHeaders(accessToken);
    
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
    
    // Log the operation with correct type
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
    
    // Log error
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

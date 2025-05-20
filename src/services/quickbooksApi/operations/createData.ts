
import { logOperation } from "@/utils/operationLogger";
import { API_BASE_URL, getHeaders } from "../utils/apiHelpers";

// Function to create an entity in QuickBooks
export const createQuickbooksEntity = async (
  accessToken: string,
  realmId: string,
  entity: string,
  payload: any
) => {
  try {
    const headers = getHeaders(accessToken);
    
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
    
    // Log the operation with correct type
    await logOperation({
      operationType: 'import',
      entityType: entity,
      recordId: data[entity]?.Id,
      status: 'success',
      details: { action: 'create', entity: data[entity] }
    });
    
    return data;
  } catch (error) {
    console.error(`Error creating ${entity}:`, error);
    
    // Log error
    await logOperation({
      operationType: 'import',
      entityType: entity,
      status: 'error',
      details: { action: 'create', error: error.message }
    });
    
    throw error;
  }
};

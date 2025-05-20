
import { logOperation } from "@/utils/operationLogger";
import { API_BASE_URL, getHeaders } from "../utils/apiHelpers";

// Function to delete (deactivate) an entity in QuickBooks
export const deleteQuickbooksEntity = async (
  accessToken: string,
  realmId: string,
  entity: string,
  entityId: string
) => {
  try {
    // Most QuickBooks entities use Active=false to "delete" them
    const updatePayload = {
      Id: entityId,
      Active: false,
      sparse: true
    };
    
    const headers = getHeaders(accessToken);
    
    const response = await fetch(`${API_BASE_URL}/v3/company/${realmId}/${entity.toLowerCase()}`, {
      method: 'POST', // QuickBooks API uses POST for updates with sparse=true
      headers,
      body: JSON.stringify(updatePayload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.Fault?.Error?.[0]?.Message || `Error deleting ${entity}`);
    }
    
    const data = await response.json();
    
    // Log successful operation with correct type
    await logOperation({
      operationType: 'delete',
      entityType: entity,
      recordId: entityId,
      status: 'success',
      details: { action: 'delete', entity: data[entity] }
    });
    
    return data;
  } catch (error) {
    console.error(`Error deleting ${entity}:`, error);
    
    // Log failed operation with correct type
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

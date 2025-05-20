
import { logOperation } from "@/utils/operationLogger";
import { API_BASE_URL, getHeaders } from "../utils/apiHelpers";

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
    const headers = getHeaders(accessToken);
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
    
    // Log the operation with correct type
    await logOperation({
      operationType: 'fetch',
      entityType: entity,
      status: 'success',
      details: { 
        query,
        count: data?.QueryResponse?.[entity]?.length || 0
      }
    });
    
    return data;
  } catch (error) {
    console.error("Error querying QuickBooks data:", error);
    
    // Log error
    await logOperation({
      operationType: 'fetch',
      entityType: entity,
      status: 'error',
      details: { error: error.message }
    });
    
    throw error;
  }
};

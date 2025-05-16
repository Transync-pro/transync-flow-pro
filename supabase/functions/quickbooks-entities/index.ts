
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const QUICKBOOKS_ENVIRONMENT = Deno.env.get('QUICKBOOKS_ENVIRONMENT') || 'sandbox';

// Use the admin client to bypass RLS policies
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get the appropriate QuickBooks API base URL
const getQBApiBaseUrl = () => {
  return QUICKBOOKS_ENVIRONMENT === 'production' 
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';
};

// Get user's QuickBooks connection details
const getQBConnection = async (userId: string) => {
  const { data, error } = await supabase
    .from('quickbooks_connections')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching QuickBooks connection:', error);
    return null;
  }
  
  return data;
};

// Check if token needs refresh
const checkAndRefreshToken = async (userId: string) => {
  try {
    const connection = await getQBConnection(userId);
    if (!connection) {
      throw new Error('No QuickBooks connection found');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const expiresAt = new Date(connection.expires_at);
    const now = new Date();
    
    if ((expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000) {
      console.log('Access token expired or about to expire, refreshing...');
      
      // Call the quickbooks-auth function to refresh the token
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: {
          path: 'refresh',
          userId,
          refreshToken: connection.refresh_token
        }
      });
      
      if (error || data.error) {
        throw new Error(error?.message || data?.error || 'Failed to refresh token');
      }
      
      // Get the updated connection
      return await getQBConnection(userId);
    }
    
    return connection;
  } catch (error) {
    console.error('Error checking/refreshing token:', error);
    throw error;
  }
};

// Fetch entities from QuickBooks API
const fetchEntities = async (
  accessToken: string, 
  realmId: string, 
  entityType: string,
  query?: string
) => {
  try {
    const apiUrl = `${getQBApiBaseUrl()}/v3/company/${realmId}/query`;
    const queryString = query || `SELECT * FROM ${entityType} MAXRESULTS 1000`;
    
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

// Delete entity from QuickBooks API
const deleteEntity = async (
  accessToken: string,
  realmId: string,
  entityType: string,
  entityId: string
) => {
  try {
    // Most QuickBooks API entities are "deleted" by setting Active=false
    const apiUrl = `${getQBApiBaseUrl()}/v3/company/${realmId}/${entityType.toLowerCase()}`;
    
    console.log(`Deleting ${entityType} with ID ${entityId}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        Id: entityId,
        SyncToken: "0", // This may need to be fetched first for the actual entity
        Active: false,
        sparse: true
      })
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

// Create a record for a specific entity type
const createEntity = async (
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
const updateEntity = async (
  accessToken: string,
  realmId: string,
  entityType: string,
  entityId: string,
  entityData: any,
  syncToken: string
) => {
  try {
    const apiUrl = `${getQBApiBaseUrl()}/v3/company/${realmId}/${entityType.toLowerCase()}`;
    
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

// Log the operation for auditing purposes
const logOperation = async (
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

// Main handler function
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { operation, entityType, userId, ...params } = await req.json();
    
    console.log(`Handling ${operation} operation for ${entityType}`, params);
    
    if (!userId) {
      throw new Error('Missing required parameter: userId');
    }

    if (!entityType) {
      throw new Error('Missing required parameter: entityType');
    }

    // Get and refresh token if needed
    const connection = await checkAndRefreshToken(userId);
    
    if (!connection) {
      throw new Error('No QuickBooks connection found');
    }

    let result;
    
    switch (operation) {
      case 'fetch':
        result = await fetchEntities(
          connection.access_token,
          connection.realm_id,
          entityType,
          params.query
        );
        
        await logOperation(userId, 'fetch', entityType, 'success', {
          count: result.QueryResponse?.[entityType]?.length || 0
        });
        break;
        
      case 'create':
        if (!params.data) {
          throw new Error('Missing required parameter: data');
        }
        
        result = await createEntity(
          connection.access_token,
          connection.realm_id,
          entityType,
          params.data
        );
        
        await logOperation(userId, 'create', entityType, 'success', {
          id: result[entityType]?.Id,
          data: result
        });
        break;
        
      case 'update':
        if (!params.id || !params.data || !params.syncToken) {
          throw new Error('Missing required parameters for update: id, data, or syncToken');
        }
        
        result = await updateEntity(
          connection.access_token,
          connection.realm_id,
          entityType,
          params.id,
          params.data,
          params.syncToken
        );
        
        await logOperation(userId, 'update', entityType, 'success', {
          id: params.id,
          data: result
        });
        break;
        
      case 'delete':
        if (!params.id) {
          throw new Error('Missing required parameter: id');
        }
        
        result = await deleteEntity(
          connection.access_token,
          connection.realm_id,
          entityType,
          params.id
        );
        
        await logOperation(userId, 'delete', entityType, 'success', {
          id: params.id
        });
        break;
        
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('Error in QuickBooks entities function:', error);
    
    // Try to log the error if we have a userId
    try {
      const { userId, entityType, operation } = await req.json();
      if (userId && entityType && operation) {
        await logOperation(userId, operation, entityType, 'error', {
          error: error.message || 'Unknown error'
        });
      }
    } catch (e) {
      console.error('Failed to log error:', e);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

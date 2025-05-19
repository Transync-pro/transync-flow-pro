import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { getQBConnection, checkAndRefreshToken } from "./auth.ts";
import { fetchEntities, createEntity, updateEntity, deleteEntity } from "./operations.ts";
import { logOperation } from "./operations.ts";
import { corsHeaders } from "./config.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Use the admin client to bypass RLS policies
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    // Clone the request to use it multiple times if needed
    const clonedReq = req.clone();
    const reqBody = await clonedReq.json();
    const { operation, entityType, userId, ...params } = reqBody;
    
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
    // For special entity types, we need to map them to the actual API entity types
    const actualEntityType = entityType === "Check" || entityType === "CreditCardCredit" ? "Purchase" : entityType;
    
    switch (operation) {
      case 'fetch':
        result = await fetchEntities(
          connection.access_token,
          connection.realm_id,
          entityType,
          params.query
        );
        
        // For special entity types, modify the response to make it look like it came from the expected entity
        if (entityType === "Check" || entityType === "CreditCardCredit") {
          // Map Credit Card Credits and Checks to their respective structures
          // but keep the original Purchase data structure
          await logOperation(userId, 'fetch', entityType, 'success', {
            count: result.QueryResponse?.Purchase?.length || 0
          });
          
          // Return the result with the proper entity name
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: {
                ...result,
                QueryResponse: {
                  ...result.QueryResponse,
                  // Add the entity type key with the Purchase data
                  [entityType]: result.QueryResponse?.Purchase || []
                }
              } 
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        } else {
          await logOperation(userId, 'fetch', entityType, 'success', {
            count: result.QueryResponse?.[entityType]?.length || 0
          });
        }
        break;
        
      case 'create':
        if (!params.data) {
          throw new Error('Missing required parameter: data');
        }
        
        result = await createEntity(
          connection.access_token,
          connection.realm_id,
          actualEntityType,
          params.data
        );
        
        await logOperation(userId, 'create', entityType, 'success', {
          id: result[actualEntityType]?.Id,
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
          actualEntityType,
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
      const clonedReq = req.clone();
      const { userId, entityType, operation } = await clonedReq.json();
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

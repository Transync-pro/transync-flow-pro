
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';
import { checkAndRefreshToken } from './connection.ts';
import { handleEntityOperation } from './handlers/entityOperations.ts';
import { mapOperationType } from "./operations.ts";

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

    // Process the operation
    const result = await handleEntityOperation(
      operation,
      entityType,
      userId,
      connection,
      params
    );

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
      const { userId, operation, entityType } = await req.json();
      if (userId && operation && entityType) {
        // Map operation to valid operation_type 
        const logOperationType = mapOperationType(operation);
        
        // Import and use logOperation from operations.ts
        const { logOperation } = await import('./operations.ts');
        
        await logOperation(
          userId, 
          logOperationType,
          entityType, 
          'error', 
          { error: error.message }
        );
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

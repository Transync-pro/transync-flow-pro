
import { getQBApiBaseUrl } from '../config.ts';
import { fetchEntities, createEntity, updateEntity, deleteEntity } from '../operations.ts';
import { supabase } from '../connection.ts';

// Map operation types to handlers
export const handleEntityOperation = async (
  operation: string,
  entityType: string,
  userId: string,
  connection: any,
  params: any
) => {
  let result;
  
  // For special entity types, we need to map them to the actual API entity types
  const actualEntityType = entityType === "Check" || entityType === "CreditCardCredit" ? "Purchase" : entityType;
  
  // Log the operation for auditing purposes
  const logOperation = async (
    operationType: string,
    status: 'success' | 'error',
    details: any = {},
    recordId: string | null = null
  ) => {
    try {
      // Import the mapOperationType function to ensure valid operation type
      const { mapOperationType } = await import('../operations.ts');
      
      // Use the mapping function to ensure we get a valid type
      const validType = mapOperationType(operationType);
      
      // Log with the validated operation type
      await supabase.from('operation_logs').insert({
        user_id: userId,
        operation_type: validType,
        entity_type: entityType,
        record_id: recordId || details.id || null,
        status,
        details
      });
    } catch (error) {
      console.error('Error logging operation:', error);
    }
  };
  
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
        // Log the operation
        await logOperation('fetch', 'success', {
          count: result.QueryResponse?.Purchase?.length || 0
        });
        
        // Modify the response to include the entity type
        return {
          ...result,
          QueryResponse: {
            ...result.QueryResponse,
            // Add the entity type key with the Purchase data
            [entityType]: result.QueryResponse?.Purchase || []
          }
        };
      } else {
        await logOperation('fetch', entityType, 'success', {
          count: result.QueryResponse?.[entityType]?.length || 0
        });
        return result;
      }
      
    case 'create':
      try {
        result = await createEntity(
          connection.access_token,
          connection.realm_id,
          actualEntityType,
          params.data
        );
        await logOperation('import', 'success', {
          id: result[entityType]?.Id,
          name: result[entityType]?.Name || result[entityType]?.DisplayName
        }, result[entityType]?.Id);
        return result;
      } catch (error: any) {
        await logOperation('import', 'error', {
          error: error.message
        });
        throw error;
      }
      
    case 'update':
      try {
        result = await updateEntity(
          connection.access_token,
          connection.realm_id,
          actualEntityType,
          params.id,
          params.data,
          params.syncToken
        );
        await logOperation('import', 'success', {
          id: result[entityType]?.Id,
          name: result[entityType]?.Name || result[entityType]?.DisplayName
        }, result[entityType]?.Id);
        return result;
      } catch (error: any) {
        await logOperation('import', 'error', {
          error: error.message
        }, params.id);
        throw error;
      }
      
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
      
      await logOperation('delete', 'success', {
        id: params.id
      }, params.id);
      return result;
      
    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
};

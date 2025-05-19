import { supabase } from "@/integrations/supabase/client";
import { OperationType } from "@/services/quickbooksApi/types";

/**
 * Log user operations to the operation_logs table in Supabase
 */
export const logOperation = async ({
  operationType,
  entityType,
  recordId = null,
  status,
  details = {}
}: {
  operationType: OperationType;
  entityType: string;
  recordId?: string | null;
  status: 'success' | 'error' | 'pending' | 'partial';
  details?: any;
}): Promise<void> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user) {
      console.warn("Cannot log operation: User not authenticated");
      return;
    }
    
    // Validate operation type to match database constraint
    if (!['export', 'import', 'delete', 'fetch'].includes(operationType)) {
      console.error(`Invalid operation type: ${operationType}. Must be one of: export, import, delete, fetch`);
      // Default to 'fetch' if invalid
      operationType = 'fetch';
    }
    
    const { error } = await supabase.from("operation_logs").insert({
      user_id: user.user.id,
      operation_type: operationType,
      entity_type: entityType,
      record_id: recordId,
      status,
      details
    });
    
    if (error) {
      console.error("Error logging operation:", error);
    } else {
      console.log(`Operation logged: ${operationType} ${entityType} - ${status}`);
    }
  } catch (error) {
    console.error("Failed to log operation:", error);
  }
};

/**
 * Retrieve operation logs for the current user
 */
export const getOperationLogs = async (
  options: {
    limit?: number;
    operationType?: OperationType;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) {
    return { data: null, error: new Error("User not authenticated") };
  }
  
  let query = supabase
    .from("operation_logs")
    .select("*")
    .eq("user_id", user.user.id)
    .order("created_at", { ascending: false });
  
  if (options.operationType) {
    query = query.eq("operation_type", options.operationType);
  }
  
  if (options.entityType) {
    query = query.eq("entity_type", options.entityType);
  }
  
  if (options.startDate) {
    query = query.gte("created_at", options.startDate.toISOString());
  }
  
  if (options.endDate) {
    query = query.lte("created_at", options.endDate.toISOString());
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  return await query;
};

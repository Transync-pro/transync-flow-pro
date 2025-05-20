
import { supabase } from "@/integrations/supabase/client";
import { OperationType, LogOperationParams } from "@/services/quickbooksApi/types";

/**
 * Log user operations to the operation_logs table in Supabase
 */
export const logOperation = async ({
  operationType,
  entityType,
  recordId = null,
  status,
  details = {}
}: LogOperationParams): Promise<void> => {
  try {
    console.log(`Logging operation: ${operationType} - ${entityType} - ${status}`);
    
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user) {
      console.warn("Cannot log operation: User not authenticated");
      return;
    }
    
    // Use the strict type guard function to ensure valid operation type
    const validOperationType = validateOperationType(operationType);
    
    // Add timestamp if not already present in details
    if (!details.timestamp) {
      details.timestamp = new Date().toISOString();
    }
    
    const { error } = await supabase.from("operation_logs").insert({
      user_id: user.user.id,
      operation_type: validOperationType,
      entity_type: entityType,
      record_id: recordId,
      status,
      details
    });
    
    if (error) {
      console.error("Error logging operation:", error);
    } else {
      console.log(`Operation logged successfully: ${validOperationType} ${entityType} - ${status}`);
    }
  } catch (error) {
    console.error("Failed to log operation:", error);
  }
};

/**
 * Strict validator to ensure operation type matches database constraint
 * Always returns a valid value that matches the database constraint
 */
export const validateOperationType = (type: string): OperationType => {
  const validTypes: OperationType[] = ['import', 'export', 'delete', 'fetch'];
  
  // Cast to lowercase to handle case variations
  const normalizedType = type.toLowerCase();
  
  // Check if the normalized type is valid
  if (validTypes.includes(normalizedType as OperationType)) {
    return normalizedType as OperationType;
  }
  
  // Map common API operation names to valid types
  if (['create', 'update', 'put', 'post', 'save', 'upsert'].includes(normalizedType)) {
    return 'import';
  }
  
  if (['get', 'read', 'query', 'list', 'find'].includes(normalizedType)) {
    return 'fetch';
  }
  
  if (['remove', 'destroy', 'trash'].includes(normalizedType)) {
    return 'delete';
  }
  
  if (['download', 'extract'].includes(normalizedType)) {
    return 'export';
  }
  
  console.warn(`Invalid operation type: "${type}". Defaulting to "fetch"`);
  return 'fetch'; // Default to fetch for unknown operations
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

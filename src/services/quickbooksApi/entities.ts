
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { entityOperations } from "./entityOperations";
import { QB_ENTITIES } from "./entityTypes";
import { exportUtils } from "./exportUtils";

// Re-export the QB entity constants
export { QB_ENTITIES } from "./entityTypes";
export { convertToCSV } from "./exportUtils";

// Generic type for QuickBooks entity operation responses
type QBEntityResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Fetch QuickBooks entities
export const fetchQuickbooksEntities = async <T = any>(
  entityType: string,
  customQuery?: string
): Promise<QBEntityResponse<T>> => {
  return entityOperations.fetchEntities(entityType, customQuery);
};

// Create a new QuickBooks entity
export const createQuickbooksEntity = async <T = any>(
  entityType: string,
  entityData: any
): Promise<QBEntityResponse<T>> => {
  return entityOperations.createEntity(entityType, entityData);
};

// Update an existing QuickBooks entity
export const updateQuickbooksEntity = async <T = any>(
  entityType: string,
  entityId: string,
  entityData: any,
  syncToken: string
): Promise<QBEntityResponse<T>> => {
  return entityOperations.updateEntity(entityType, entityId, entityData, syncToken);
};

// Delete a QuickBooks entity
export const deleteQuickbooksEntity = async <T = any>(
  entityType: string,
  entityId: string
): Promise<QBEntityResponse<T>> => {
  return entityOperations.deleteEntity(entityType, entityId);
};

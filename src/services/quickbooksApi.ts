
// Main index file - brings everything together
import { API_BASE_URL, getQBConnection, getHeaders, convertToCSV, flattenQuickbooksData } from "./quickbooksApi/utils/apiHelpers";
import { queryQuickbooksData } from "./quickbooksApi/operations/queryData";
import { createQuickbooksEntity as create } from "./quickbooksApi/operations/createData";
import { updateQuickbooksEntity as update } from "./quickbooksApi/operations/updateData";
import { deleteQuickbooksEntity as deleteEntity } from "./quickbooksApi/operations/deleteData";
import { getEntitySchema } from "./quickbooksApi/schemas";
import { logOperation as logOperationUtil } from "@/utils/operationLogger";

// This function is renamed to avoid conflict with the imported logOperation
export const trackOperation = async (options: {
  operationType: 'import' | 'export' | 'delete' | 'fetch';
  entityType: string;
  recordId?: string | null;
  status: 'success' | 'error' | 'pending' | 'partial';
  details?: any;
}) => {
  // Use our centralized logger
  return logOperationUtil({
    operationType: options.operationType,
    entityType: options.entityType,
    recordId: options.recordId || null,
    status: options.status,
    details: options.details || {}
  });
};

// Export all the functions and constants
export {
  API_BASE_URL,
  getQBConnection,
  queryQuickbooksData,
  create as createQuickbooksEntity,
  update as updateQuickbooksEntity,
  deleteEntity as deleteQuickbooksEntity,
  getEntitySchema,
  convertToCSV,
  flattenQuickbooksData
};

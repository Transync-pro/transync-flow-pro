
// Types for QuickBooks API operations

export interface QuickbooksEntity {
  id?: string;
  [key: string]: any;
}

export interface QuickbooksQueryParams {
  entity: string;
  fields?: string[];
  conditions?: string;
  maxResults?: number;
}

export interface QuickbooksSchema {
  required: string[];
  fields: string[];
}

export type OperationType = 'import' | 'export' | 'delete';
export type OperationStatus = 'success' | 'error' | 'pending';

export interface LogOperationParams {
  operationType: OperationType;
  entityType: string;
  recordId: string | null;
  status: OperationStatus;
  details?: any;
}

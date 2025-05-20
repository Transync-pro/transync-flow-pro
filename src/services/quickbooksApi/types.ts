
export interface QBConnection {
  user_id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  x_refresh_token_expires_in: number;
  id_token: string;
  environment: string;
  company_name: string;
}

export interface QBEntity {
  name: string;
  value: string;
}

export type OperationType = 'import' | 'export' | 'delete' | 'fetch';

export type OperationStatus = 'success' | 'error' | 'pending' | 'partial';

export interface LogOperationParams {
  operationType: OperationType;
  entityType: string;
  recordId?: string | null;
  status: OperationStatus;
  details?: Record<string, any>;
}

export interface QuickbooksError {
  Fault: {
    Error: {
      code: string;
      Detail: string;
      Message: string;
    }[];
    type: string;
  };
  time: string;
}

// Add the missing types that were causing errors
export interface QuickbooksEntity {
  [key: string]: any;
  Active?: boolean;
  Id?: string;
  SyncToken?: string;
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

export interface QBEntityResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

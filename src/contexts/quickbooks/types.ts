export type ConnectionState = 
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface QuickbooksConnection {
  id: string;
  user_id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  token_type: string;
  x_refresh_token_expires_in: number;
  created_at: string;
  updated_at: string;
  company_name?: string;
  last_sync?: string;
}

export interface QuickbooksContextType {
  isConnected: boolean;
  isLoading: boolean;
  connection: QuickbooksConnection | null;
  realmId: string | null;
  companyName: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshToken: () => Promise<void>;
  getRealmId: () => Promise<string | null>;
  clearError: () => void;
  refreshConnection: (force?: boolean, silent?: boolean) => Promise<void>;
  checkConnection: (force?: boolean, silent?: boolean) => Promise<void>;
  // New state properties
  connectionState: ConnectionState;
  lastChecked: number | null;
  checkConnectionWithRetry: (attempt?: number) => Promise<boolean>;
}

// Date range interface for filtering
export interface DateRange {
  from: Date | null;
  to: Date | null;
}

// Delete progress tracking
export interface DeleteProgress {
  total: number;
  current: number;
  success: number;
  failed: number;
  details: Array<{
    id: string;
    status: string;
    error?: string;
  }>;
}

// Entity state for managing fetched data
export interface EntityState {
  records: any[];
  filteredRecords: any[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  lastUpdated: Date | null;
}

// Entity option for dropdowns
export interface EntityOption {
  value: string;
  label: string;
}

// Entity column configuration for tables
export interface EntityColumnConfig {
  field: string;
  header: string;
  accessor?: (obj: any) => any;
}

// Generic entity record type
export interface EntityRecord {
  Id: string;
  [key: string]: any;
}

// QuickBooks user identity
export interface QuickbooksUserIdentity {
  id: string;
  user_id: string;
  realm_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

// QuickBooks entities context type
export interface QuickbooksEntitiesContextType {
  selectedEntity: string | null;
  setSelectedEntity: (entity: string) => void;
  selectedDateRange: DateRange;
  setSelectedDateRange: (range: DateRange) => void;
  entityState: Record<string, EntityState>;
  fetchEntities: (entityType?: string) => Promise<void>;
  filterEntities: (searchTerm: string, entityType?: string) => void;
  deleteEntity: (entityType: string, entityId: string) => Promise<boolean>;
  deleteSelectedEntities: (entityIds?: string[]) => Promise<{ success: number; failed: number }>;
  selectedEntityIds: string[];
  setSelectedEntityIds: (ids: string[]) => void;
  toggleEntitySelection: (id: string) => void;
  selectAllEntities: (select: boolean, entities?: any[]) => void;
  deleteProgress: DeleteProgress;
  isDeleting: boolean;
  entityOptions: EntityOption[];
  getNestedValue: (obj: any, path: string) => any;
}


import { User } from "@supabase/supabase-js";

export interface QuickbooksConnection {
  id: string;
  user_id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  created_at: string;
  updated_at?: string;
  company_name?: string;
}

export interface QuickbooksContextType {
  isConnected: boolean;
  isLoading: boolean;
  realmId: string | null;
  companyName: string | null;
  connection: QuickbooksConnection | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getRealmId: () => Promise<string | null>;
  clearError: () => void;
  refreshConnection: () => Promise<void>;
}

// New type for QB user identity
export interface QuickbooksUserIdentity {
  id?: string;
  user_id: string;
  realm_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

// Extended QuickBooks context type with user identity
export interface QuickbooksUserContextType {
  userIdentity: QuickbooksUserIdentity | null;
  isLoading: boolean;
  error: string | null;
  refreshUserIdentity: () => Promise<void>;
}

// Entity types
export interface EntityState {
  isLoading: boolean;
  error: string | null;
  records: any[];
  filteredRecords: any[];
  totalCount: number;
  lastUpdated: Date | null;
}

export interface LogOperationParams {
  operationType: 'import' | 'export' | 'delete';
  entityType: string;
  recordId: string | null;
  status: 'success' | 'error' | 'pending' | 'partial';
  details?: any;
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface EntityOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface QuickbooksEntitiesContextType {
  selectedEntity: string;
  setSelectedEntity: (entity: string) => void;
  selectedDateRange: DateRange;
  setSelectedDateRange: (range: DateRange) => void;
  entityState: Record<string, EntityState>;
  fetchEntities: (entityType?: string) => Promise<void>;
  filterEntities: (entityType: string, searchTerm: string) => void;
  deleteEntity: (entityType: string, entityId: string) => Promise<boolean>;
  deleteSelectedEntities: () => Promise<{ success: number; failed: number }>;
  selectedEntityIds: string[];
  setSelectedEntityIds: (ids: string[]) => void;
  toggleEntitySelection: (id: string) => void;
  selectAllEntities: (select: boolean, entities?: any[]) => void;
  deleteProgress: number;
  isDeleting: boolean;
  entityOptions: EntityOption[];
  getNestedValue: (obj: any, path: string) => any;
}

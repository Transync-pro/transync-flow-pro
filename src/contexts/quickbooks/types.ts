
import { User } from "@supabase/supabase-js";

export interface QuickbooksConnection {
  id: string;
  user_id: string;
  realm_id: string;
  company_name: string | null;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
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
  refreshConnection: (force?: boolean, silent?: boolean) => Promise<void>;
  checkConnection: (force?: boolean, silent?: boolean) => Promise<void>;
}

export interface EntityRecord {
  Id: string;
  [key: string]: any;
}

export interface EntityMappingConfig {
  field: string;
  header: string;
  accessor?: (record: any) => any;
}

export interface EntityColumnConfig {
  field: string;
  header: string;
  accessor?: (record: any) => any;
}

export interface EntityGroup {
  id: string;
  label: string;
  entities: EntityOption[];
}

export interface EntityOption {
  label: string;
  value: string;
  description?: string;
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DeleteProgress {
  total: number;
  current: number;
  success: number;
  failed: number;
  details: Array<{id: string, status: string, error?: string}>;
}

export interface EntityState {
  records: any[];
  filteredRecords: any[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  lastUpdated: Date | null;
}

export interface QuickbooksEntitiesContextType {
  selectedEntity: string;
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
  entityOptions: EntityGroup[];
  getNestedValue: (obj: any, path: string) => any;
}

export interface QuickbooksUserIdentity {
  id: string;
  user_id: string;
  quickbooks_user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

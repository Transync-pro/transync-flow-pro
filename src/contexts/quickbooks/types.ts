import { DateRange } from "react-day-picker";
import { DeleteProgress } from "./useEntityOperations";
import { User } from "@supabase/supabase-js";

export interface EntityRecord {
  Id?: string;
  [key: string]: any;
}

export interface EntityState {
  records: EntityRecord[];
  filteredRecords: EntityRecord[];
  isLoading: boolean;
  error: string | null;
}

// Adding the missing EntityOption interface
export interface EntityOption {
  label: string;
  value: string;
  group?: string;
}

// Adding the missing EntityColumnConfig interface
export interface EntityColumnConfig {
  field: string;
  header: string;
  accessor?: (record: any) => any;
}

// Adding the missing QuickbooksConnection interface
export interface QuickbooksConnection {
  id: string;
  user_id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  company_name?: string | null;
  created_at?: string;
}

// Adding the missing QuickbooksContextType interface
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

export interface QuickbooksEntitiesContextType {
  // Entity selection state
  selectedEntity: string | null;
  setSelectedEntity: (entity: string | null) => void;
  selectedDateRange: DateRange | undefined;
  setSelectedDateRange: (dateRange: DateRange | undefined) => void;
  
  // Entity data state
  entityState: Record<string, EntityState>;
  
  // Entity operations
  fetchEntities: (entityType?: string) => Promise<void>;
  filterEntities: (searchTerm: string, entityType?: string) => void;
  deleteEntity: (entityId: string, entityType?: string) => Promise<boolean>;
  deleteSelectedEntities: (entityIds: string[], entityType?: string) => Promise<void>;
  
  // Multi-select functionality
  selectedEntityIds: string[];
  setSelectedEntityIds: (ids: string[]) => void;
  toggleEntitySelection: (id: string) => void;
  selectAllEntities: (select: boolean, entityType?: string) => void;
  
  // Delete progress tracking
  deleteProgress: DeleteProgress;
  isDeleting: boolean;
  
  // Available entity options
  entityOptions: Array<{ value: string; label: string }>;
  
  // Helper functions
  getNestedValue: (obj: any, path: string) => any;
}

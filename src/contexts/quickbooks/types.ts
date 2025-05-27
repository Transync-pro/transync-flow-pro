
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


export interface QuickbooksConnection {
  id: string;
  user_id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
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

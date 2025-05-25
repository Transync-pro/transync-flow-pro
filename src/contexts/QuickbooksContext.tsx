
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface QuickbooksConnection {
  id: string;
  user_id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  created_at: string;
  expires_at: string;
  company_name?: string;
}

interface QuickbooksContextType {
  isConnected: boolean;
  isLoading: boolean;
  realmId: string | null;
  companyName: string | null;
  connection: QuickbooksConnection | null;
  error: string | null;
  refreshConnection: () => Promise<void>;
  disconnect: () => Promise<void>;
  connect: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getRealmId: () => Promise<string | null>;
  clearError: () => void;
  checkConnection: () => Promise<void>;
}

const QuickbooksContext = createContext<QuickbooksContextType | null>(null);

export const useQuickbooks = () => {
  const context = useContext(QuickbooksContext);
  if (!context) {
    throw new Error('useQuickbooks must be used within a QuickbooksProvider');
  }
  return context;
};

export const QuickbooksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [realmId, setRealmId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [connection, setConnection] = useState<QuickbooksConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  console.log("QuickbooksProvider: Rendering with user:", user?.id);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshConnection = useCallback(async () => {
    if (!user) {
      console.log("QuickbooksProvider: No user, setting not connected");
      setIsConnected(false);
      setRealmId(null);
      setCompanyName(null);
      setConnection(null);
      setIsLoading(false);
      return;
    }

    try {
      console.log("QuickbooksProvider: Checking connection for user:", user.id);
      
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('QuickbooksProvider: Error fetching connection:', error);
        setError(error.message);
        setIsConnected(false);
        setRealmId(null);
        setCompanyName(null);
        setConnection(null);
      } else if (data) {
        console.log("QuickbooksProvider: Connection found:", data);
        const qbConnection = data as QuickbooksConnection;
        setConnection(qbConnection);
        setIsConnected(true);
        setRealmId(qbConnection.realm_id);
        setCompanyName(qbConnection.company_name || null);
        setError(null);
      } else {
        console.log("QuickbooksProvider: No connection found");
        setIsConnected(false);
        setRealmId(null);
        setCompanyName(null);
        setConnection(null);
      }
    } catch (error: any) {
      console.error('QuickbooksProvider: Exception while checking connection:', error);
      setError(error.message);
      setIsConnected(false);
      setRealmId(null);
      setCompanyName(null);
      setConnection(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const connect = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in before connecting to QuickBooks",
        variant: "destructive",
      });
      return;
    }

    try {
      sessionStorage.setItem("qb_connecting_user", user.id);
      const baseUrl = window.location.origin;
      const redirectUrl = `${baseUrl}/dashboard/quickbooks-callback`;
      
      console.log("Starting QuickBooks OAuth flow, redirecting to", redirectUrl);
      
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { 
          path: 'authorize',
          redirectUri: redirectUrl,
          userId: user.id 
        }
      });

      if (error) {
        console.error("Edge function invocation error:", error);
        throw error;
      }
      
      if (data.error) {
        console.error("Error from edge function:", data.error);
        throw new Error(data.error);
      }
      
      if (data && data.authUrl) {
        console.log("Received authorization URL, redirecting user...");
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error: any) {
      console.error("Error in connect flow:", error);
      setError(`Failed to initiate QuickBooks connection: ${error.message || "Unknown error"}`);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to QuickBooks",
        variant: "destructive",
      });
    }
  }, [user]);

  const disconnect = useCallback(async () => {
    if (!user) return;

    try {
      console.log("Attempting to disconnect QuickBooks for user:", user.id);
      
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { 
          path: 'revoke',
          userId: user.id
        }
      });
      
      if (error) {
        console.error("Error revoking QuickBooks tokens:", error);
        throw error;
      }
      
      if (data && data.error) {
        console.warn("Warning from revoke endpoint:", data.error);
      }
      
      console.log("QuickBooks disconnection process completed, refreshing connection status...");
      
      await refreshConnection();
      
      toast({
        title: "Disconnected",
        description: "QuickBooks account has been disconnected successfully",
      });
      
    } catch (error: any) {
      console.error("Error in disconnect flow:", error);
      setError(`Failed to disconnect from QuickBooks: ${error.message || "Unknown error"}`);
      toast({
        title: "Disconnect Error",
        description: error.message || "Failed to disconnect from QuickBooks",
        variant: "destructive",
      });
    }
  }, [user, refreshConnection]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!connection) return null;
    return connection.access_token;
  }, [connection]);

  const getRealmId = useCallback(async (): Promise<string | null> => {
    return realmId;
  }, [realmId]);

  const checkConnection = useCallback(async () => {
    await refreshConnection();
  }, [refreshConnection]);

  useEffect(() => {
    console.log("QuickbooksProvider: useEffect triggered, user:", user?.id);
    refreshConnection();
  }, [refreshConnection]);

  // Log state changes
  useEffect(() => {
    console.log("QuickBooks context state:", {
      isConnected,
      isLoading,
      realmId: realmId || "null",
      companyName,
      error
    });
  }, [isConnected, isLoading, realmId, companyName, error]);

  const value = {
    isConnected,
    isLoading,
    realmId,
    companyName,
    connection,
    error,
    refreshConnection,
    disconnect,
    connect,
    getAccessToken,
    getRealmId,
    clearError,
    checkConnection,
  };

  return (
    <QuickbooksContext.Provider value={value}>
      {children}
    </QuickbooksContext.Provider>
  );
};

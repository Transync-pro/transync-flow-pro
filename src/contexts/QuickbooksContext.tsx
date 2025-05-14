
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getRealmId: () => Promise<string | null>;
}

const QuickbooksContext = createContext<QuickbooksContextType | null>(null);

export const useQuickbooks = () => {
  const context = useContext(QuickbooksContext);
  if (!context) {
    throw new Error("useQuickbooks must be used within a QuickbooksProvider");
  }
  return context;
};

interface QuickbooksProviderProps {
  children: ReactNode;
}

export const QuickbooksProvider: React.FC<QuickbooksProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [realmId, setRealmId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [connection, setConnection] = useState<QuickbooksConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkConnectionStatus();
    } else {
      resetConnectionState();
      setIsLoading(false);
    }
  }, [user]);
  
  const checkConnectionStatus = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Query the QuickBooks connections table for this user
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setConnection(data as QuickbooksConnection);
        setIsConnected(true);
        setRealmId(data.realm_id);
        setCompanyName(data.company_name || null);
        
        // Check if token needs refreshing (if expires in less than 5 minutes)
        const expiresAt = new Date(data.expires_at);
        const now = new Date();
        if ((expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000) {
          await refreshToken(data.refresh_token);
        }
      } else {
        resetConnectionState();
      }
    } catch (error) {
      console.error("Error checking QuickBooks connection:", error);
      resetConnectionState();
      setError("Failed to check QuickBooks connection status");
    } finally {
      setIsLoading(false);
    }
  };

  const resetConnectionState = () => {
    setIsConnected(false);
    setRealmId(null);
    setCompanyName(null);
    setConnection(null);
  };

  // Refresh the access token
  const refreshToken = async (refreshToken: string) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { 
          path: 'refresh',
          userId: user.id,
          refreshToken
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      // Update our local state with the new tokens
      await checkConnectionStatus();
      
      return data.accessToken;
    } catch (error) {
      console.error("Error refreshing QuickBooks token:", error);
      return null;
    }
  };

  // Start OAuth flow to connect to QuickBooks
  const connect = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in before connecting to QuickBooks",
        variant: "destructive",
      });
      return;
    }

    try {
      // Determine the appropriate redirect URL
      const redirectUrl = `${window.location.origin}/dashboard/quickbooks-callback`;
      
      // Call the edge function to get authorization URL
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { 
          path: 'authorize',
          redirectUri: redirectUrl,
          userId: user.id 
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      if (data && data.authUrl) {
        // Redirect user to QuickBooks authorization page
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error) {
      console.error("Error connecting to QuickBooks:", error);
      setError(error.message || "Failed to initiate QuickBooks connection");
      toast({
        title: "Connection Failed",
        description: "Failed to initiate QuickBooks connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Disconnect from QuickBooks
  const disconnect = async () => {
    if (!user) return;

    try {
      // Call the edge function to revoke the token
      const { error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { 
          path: 'revoke',
          userId: user.id
        }
      });
      
      if (error) throw error;
      
      // Reset local state
      resetConnectionState();
      
      toast({
        title: "Disconnected",
        description: "QuickBooks account has been disconnected successfully",
      });
      
    } catch (error) {
      console.error("Error disconnecting from QuickBooks:", error);
      setError(error.message || "Failed to disconnect from QuickBooks");
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect from QuickBooks. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get access token for API calls
  const getAccessToken = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      // If we have a connection with a valid token, use it
      if (connection) {
        // Check if token needs refreshing
        const expiresAt = new Date(connection.expires_at);
        const now = new Date();
        
        if ((expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000) {
          // Token is expired or about to expire, refresh it
          return await refreshToken(connection.refresh_token);
        }
        
        // Token is still valid
        return connection.access_token;
      }
      
      return null;
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  };

  // Get realm ID for API calls
  const getRealmId = async (): Promise<string | null> => {
    return realmId;
  };

  const value: QuickbooksContextType = {
    isConnected,
    isLoading,
    realmId,
    companyName,
    connection,
    error,
    connect,
    disconnect,
    getAccessToken,
    getRealmId,
  };

  return (
    <QuickbooksContext.Provider value={value}>
      {children}
    </QuickbooksContext.Provider>
  );
};

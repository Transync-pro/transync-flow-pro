
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getQBConnection } from "@/services/quickbooksApi";

interface QuickbooksContextType {
  isConnected: boolean;
  isLoading: boolean;
  realmId: string | null;
  companyName: string | null;
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
    try {
      const connection = await getQBConnection();
      
      if (connection) {
        setIsConnected(true);
        setRealmId(connection.realm_id);
        setCompanyName(connection.company_name || null);
      } else {
        resetConnectionState();
      }
    } catch (error) {
      console.error("Error checking QuickBooks connection:", error);
      resetConnectionState();
      toast({
        title: "Connection Error",
        description: "Failed to check QuickBooks connection status.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetConnectionState = () => {
    setIsConnected(false);
    setRealmId(null);
    setCompanyName(null);
  };

  // Start OAuth flow to connect to QuickBooks
  const connect = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in before connecting to QuickBooks.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the current URL for the redirect
      const redirectUrl = `${window.location.origin}/dashboard/quickbooks-callback`;
      
      // Call the edge function to start OAuth flow
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { 
          action: 'authorize',
          redirectUri: redirectUrl,
          userId: user.id 
        }
      });

      if (error) throw error;
      
      if (data && data.authUrl) {
        // Redirect to QuickBooks authorization page
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error) {
      console.error("Error connecting to QuickBooks:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to initiate QuickBooks connection.",
        variant: "destructive",
      });
    }
  };

  // Disconnect from QuickBooks
  const disconnect = async () => {
    if (!user) return;

    try {
      // Get access token for revocation
      const token = await getAccessToken();
      
      if (!token) {
        throw new Error("No access token available");
      }
      
      // Call our edge function to revoke the token with Intuit
      const { error: revokeError } = await supabase.functions.invoke('quickbooks-auth', {
        body: { 
          action: 'revoke',
          token 
        }
      });
      
      if (revokeError) {
        console.warn("Error revoking token:", revokeError);
        // Continue with disconnection even if revocation fails
      }
      
      // Delete the connection from our database
      const { error: deleteError } = await supabase
        .from('quickbooks_connections')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) throw deleteError;
      
      // Reset local state
      resetConnectionState();
      
      toast({
        title: "Disconnected",
        description: "QuickBooks account has been disconnected successfully.",
      });
      
    } catch (error) {
      console.error("Error disconnecting from QuickBooks:", error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect from QuickBooks.",
        variant: "destructive",
      });
    }
  };

  // Get access token for API calls
  const getAccessToken = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const connection = await getQBConnection();
      return connection?.access_token || null;
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

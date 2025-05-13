import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getQBConnection, QBConnection } from "@/services/quickbooksApi";

interface QuickbooksContextType {
  isConnected: boolean;
  isLoading: boolean;
  realmId: string | null;
  companyName: string | null;
  connection: QBConnection | null;
  error: string | null;
  connectToQuickbooks: () => Promise<void>;
  disconnectQuickbooks: () => Promise<void>;
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
  const [connection, setConnection] = useState<QBConnection | null>(null);
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
      const connection = await getQBConnection();
      
      if (connection) {
        setConnection(connection);
        setIsConnected(true);
        setRealmId(connection.realm_id);
        setCompanyName(connection.company_name || null);
      } else {
        resetConnectionState();
      }
    } catch (error) {
      console.error("Error checking QuickBooks connection:", error);
      resetConnectionState();
      setError("Failed to check QuickBooks connection status.");
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
    setConnection(null);
  };

  // Start OAuth flow to connect to QuickBooks
  const connectToQuickbooks = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in before connecting to QuickBooks.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    try {
      // DIRECT URL APPROACH (Temporarily bypass edge function for testing)
      const redirectUrl = `${window.location.origin}/dashboard/quickbooks-callback`;
      console.log("Starting QuickBooks connection with redirect URL:", redirectUrl);
      
      // Create a state value for user identification in the callback
      const state = user.id;
      
      // Get client ID from environment
      const clientId = import.meta.env.VITE_QUICKBOOKS_CLIENT_ID;
      
      if (!clientId) {
        throw new Error('QuickBooks Client ID not configured');
      }
      
      // Construct auth URL directly
      const authUrl = `https://appcenter.intuit.com/connect/oauth2` +
        `?client_id=${clientId}` +
        `&response_type=code` +
        `&scope=com.intuit.quickbooks.accounting openid` +
        `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
        `&state=${encodeURIComponent(state)}`;
      
      console.log("Generated QuickBooks auth URL:", authUrl);
      
      // Redirect to QuickBooks
      window.location.href = authUrl;
      
      /* EDGE FUNCTION APPROACH (Uncomment when edge function is fixed)
      const requestBody = { 
        action: 'authorize',
        redirectUri: redirectUrl
      };
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quickbooks-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.auth.getSession()?.access_token}`
          },
          body: JSON.stringify(requestBody)
        }
      );
      
      if (!response.ok) {
        console.error("Error response:", await response.text());
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Response data:", data);
      
      if (data && data.authUrl) {
        console.log("Received authorization URL:", data.authUrl);
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
      */
    } catch (error) {
      console.error("Error connecting to QuickBooks:", error);
      setError("Failed to initiate QuickBooks connection.");
      toast({
        title: "Connection Failed",
        description: "Failed to initiate QuickBooks connection.",
        variant: "destructive",
      });
    }
  };

  // Disconnect from QuickBooks
  const disconnectQuickbooks = async () => {
    if (!user) return;

    setError(null);
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
      setError("Failed to disconnect from QuickBooks.");
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
    connection,
    error,
    connectToQuickbooks,
    disconnectQuickbooks,
    getAccessToken,
    getRealmId,
  };

  return (
    <QuickbooksContext.Provider value={value}>
      {children}
    </QuickbooksContext.Provider>
  );
};
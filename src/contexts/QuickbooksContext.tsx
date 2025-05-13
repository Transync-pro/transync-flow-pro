
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface QuickbooksConnection {
  id: string;
  realm_id: string;
  connected: boolean;
  expires_at: string;
}

interface QuickbooksContextType {
  connection: QuickbooksConnection | null;
  isLoading: boolean;
  error: string | null;
  connectToQuickbooks: () => Promise<void>;
  disconnectQuickbooks: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getRealmId: () => string | null;
  isConnected: boolean;
}

const QuickbooksContext = createContext<QuickbooksContextType | null>(null);

export const useQuickbooks = () => {
  const context = useContext(QuickbooksContext);
  if (!context) {
    throw new Error("useQuickbooks must be used within a QuickbooksProvider");
  }
  return context;
};

export const QuickbooksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connection, setConnection] = useState<QuickbooksConnection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user session
  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user;
  };

  // Load connection status
  const loadConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("quickbooks_connections")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No connection found, this is normal for new users
          setConnection(null);
        } else {
          console.error("Error fetching QuickBooks connection:", error);
          setError("Failed to load QuickBooks connection status");
        }
      } else {
        setConnection({
          id: data.id,
          realm_id: data.realm_id,
          connected: true,
          expires_at: data.expires_at,
        });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    loadConnectionStatus();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadConnectionStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Connect to QuickBooks
  const connectToQuickbooks = async () => {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to connect to QuickBooks",
          variant: "destructive",
        });
        return;
      }
      
      // Get the authorization URL from our edge function
      const response = await supabase.functions.invoke("quickbooks-auth", {
        body: {
          path: "authorize",
          searchParams: {
            user_id: user.id,
          },
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to start QuickBooks authorization");
      }
      
      // Redirect to QuickBooks authorization page
      window.location.href = response.data.url;
    } catch (err) {
      console.error("Error connecting to QuickBooks:", err);
      setError("Failed to connect to QuickBooks");
      toast({
        title: "Connection Failed",
        description: "Unable to connect to QuickBooks. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Disconnect from QuickBooks
  const disconnectQuickbooks = async () => {
    try {
      const user = await getCurrentUser();
      
      if (!user || !connection) {
        return;
      }
      
      const { error } = await supabase
        .from("quickbooks_connections")
        .delete()
        .eq("user_id", user.id);
      
      if (error) {
        throw error;
      }
      
      setConnection(null);
      toast({
        title: "Disconnected",
        description: "Your QuickBooks connection has been removed.",
      });
    } catch (err) {
      console.error("Error disconnecting from QuickBooks:", err);
      toast({
        title: "Error",
        description: "Failed to disconnect from QuickBooks. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get access token (with automatic refresh if needed)
  const getAccessToken = async (): Promise<string | null> => {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        setError("User not authenticated");
        return null;
      }
      
      // Call our edge function to handle token refresh if needed
      const response = await supabase.functions.invoke("quickbooks-auth", {
        body: {
          path: "refresh",
          userId: user.id,
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to get access token");
      }
      
      return response.data.access_token;
    } catch (err) {
      console.error("Error getting access token:", err);
      setError("Failed to get access token");
      return null;
    }
  };

  // Get realm ID
  const getRealmId = (): string | null => {
    if (!connection) {
      return null;
    }
    return connection.realm_id;
  };

  // Value to be provided to consumers
  const value = {
    connection,
    isLoading,
    error,
    connectToQuickbooks,
    disconnectQuickbooks,
    getAccessToken,
    getRealmId,
    isConnected: !!connection?.connected,
  };

  return (
    <QuickbooksContext.Provider value={value}>
      {children}
    </QuickbooksContext.Provider>
  );
};

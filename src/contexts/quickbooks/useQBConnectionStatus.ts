
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QuickbooksConnection } from "./types";
import { User } from "@supabase/supabase-js";

export const useQBConnectionStatus = (user: User | null) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [realmId, setRealmId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [connection, setConnection] = useState<QuickbooksConnection | null>(null);

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
      // Query the QuickBooks connections table for this user
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error("Error checking QuickBooks connection:", error);
        resetConnectionState();
        return;
      }
      
      if (data) {
        // Ensure we cast the data to our expected type with optional company_name
        const connection = data as QuickbooksConnection;
        setConnection(connection);
        setIsConnected(true);
        setRealmId(connection.realm_id);
        // Handle potentially missing company_name safely
        setCompanyName(connection.company_name || null);
      } else {
        resetConnectionState();
      }
    } catch (error) {
      console.error("Error checking QuickBooks connection:", error);
      resetConnectionState();
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

  const refreshConnection = () => {
    return checkConnectionStatus();
  };

  return {
    isConnected,
    isLoading,
    connection,
    realmId,
    companyName,
    refreshConnection
  };
};


import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { QuickbooksConnection } from "./types";
import { checkQBConnectionExists, getQBConnection } from "@/services/quickbooksApi/connections";

export const useQBConnectionStatus = (user: User | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connection, setConnection] = useState<QuickbooksConnection | null>(null);
  const [realmId, setRealmId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);

  const refreshConnection = useCallback(async (force = false, silent = false): Promise<void> => {
    if (!user) {
      setIsConnected(false);
      setConnection(null);
      setRealmId(null);
      setCompanyName(null);
      setIsLoading(false);
      return;
    }

    if (!silent) setIsLoading(true);

    try {
      const hasConnection = await checkQBConnectionExists(user.id);
      
      if (hasConnection) {
        const connectionData = await getQBConnection(user.id);
        setConnection(connectionData);
        setRealmId(connectionData?.realm_id || null);
        setCompanyName(connectionData?.company_name || null);
        setIsConnected(true);
      } else {
        setConnection(null);
        setRealmId(null);
        setCompanyName(null);
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
      setConnection(null);
      setRealmId(null);
      setCompanyName(null);
      setIsConnected(false);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshConnection();
  }, [refreshConnection]);

  return {
    isConnected,
    isLoading,
    connection,
    realmId,
    companyName,
    refreshConnection
  };
};

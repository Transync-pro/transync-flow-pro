
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QuickbooksConnection } from "./types";
import { User } from "@supabase/supabase-js";
import { logError } from "@/utils/errorLogger";

export const useQBConnectionStatus = (user: User | null) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [realmId, setRealmId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [connection, setConnection] = useState<QuickbooksConnection | null>(null);
  const checkInProgress = useRef<boolean>(false);
  const lastCheckTime = useRef<number>(0);
  const MIN_CHECK_INTERVAL = 5000; // 5 seconds

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
    
    // Prevent concurrent checks and throttle frequent checks
    if (checkInProgress.current) return;
    
    const now = Date.now();
    if (now - lastCheckTime.current < MIN_CHECK_INTERVAL) {
      return;
    }
    
    checkInProgress.current = true;
    setIsLoading(true);
    lastCheckTime.current = now;
    
    try {
      // Query the QuickBooks connections table for this user
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406 errors
      
      if (error && error.code !== 'PGRST116') {
        logError("Error checking QuickBooks connection", {
          source: "useQBConnectionStatus",
          context: { error, userId: user.id }
        });
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
    } catch (error: any) {
      logError("Error checking QuickBooks connection", {
        source: "useQBConnectionStatus",
        context: { error }
      });
      resetConnectionState();
    } finally {
      setIsLoading(false);
      checkInProgress.current = false;
    }
  };

  const resetConnectionState = () => {
    setIsConnected(false);
    setRealmId(null);
    setCompanyName(null);
    setConnection(null);
  };

  const refreshConnection = async () => {
    await checkConnectionStatus();
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

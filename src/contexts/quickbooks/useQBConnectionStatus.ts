
import { useState, useEffect, useRef, useCallback } from "react";
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

  // Check connection status
  const checkConnectionStatus = useCallback(async () => {
    if (!user) {
      resetConnectionState();
      setIsLoading(false);
      return;
    }
    
    // Prevent concurrent checks
    if (checkInProgress.current) return;
    
    // Don't check too frequently
    const now = Date.now();
    const throttleTime = 2000; // 2 seconds
    if (now - lastCheckTime.current < throttleTime) {
      return;
    }
    
    checkInProgress.current = true;
    setIsLoading(true);
    lastCheckTime.current = now;
    
    try {
      console.log('Checking QuickBooks connection for user:', user.id);
      
      // Query the QuickBooks connections table
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking QuickBooks connection:", error);
        resetConnectionState();
        return;
      }
      
      if (data) {
        // Connection found
        const qbConnection = data as QuickbooksConnection;
        setConnection(qbConnection);
        setIsConnected(true);
        setRealmId(qbConnection.realm_id);
        setCompanyName(qbConnection.company_name || null);
        console.log('QuickBooks connection found:', { 
          realmId: qbConnection.realm_id,
          companyName: qbConnection.company_name
        });
      } else {
        // No connection found
        console.log('No QuickBooks connection found for user:', user.id);
        resetConnectionState();
      }
    } catch (error: any) {
      console.error("Error checking QuickBooks connection:", error);
      logError("Error checking QuickBooks connection", {
        source: "useQBConnectionStatus",
        context: { error }
      });
      
      resetConnectionState();
    } finally {
      setIsLoading(false);
      checkInProgress.current = false;
    }
  }, [user]);

  // Reset connection state
  const resetConnectionState = useCallback(() => {
    setIsConnected(false);
    setRealmId(null);
    setCompanyName(null);
    setConnection(null);
  }, []);

  // Check connection on mount and when user changes
  useEffect(() => {
    checkConnectionStatus();
  }, [user, checkConnectionStatus]);

  // Public refresh method
  const refreshConnection = useCallback(async () => {
    // Reset throttling to ensure immediate check
    lastCheckTime.current = 0;
    await checkConnectionStatus();
  }, [checkConnectionStatus]);

  return {
    isConnected,
    isLoading,
    connection,
    realmId,
    companyName,
    refreshConnection
  };
};


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
  const failedChecks = useRef<number>(0);
  const MAX_FAILED_CHECKS = 3;
  const MIN_CHECK_INTERVAL = 5000; // 5 seconds
  const BACKOFF_TIME = 30000; // 30 seconds

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
      // Check if we already have a connection in state
      if (connection && isConnected) {
        checkInProgress.current = false;
        setIsLoading(false);
        return;
      }
      
      // Query the QuickBooks connections table for this user
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406 errors
      
      // PGRST116 is expected when no rows are returned
      if (error && error.code !== 'PGRST116') {
        console.log("Error checking QuickBooks connection:", error);
        
        // Increment failed check counter
        failedChecks.current += 1;
        
        if (failedChecks.current >= MAX_FAILED_CHECKS) {
          // After multiple failures, back off for a longer period
          lastCheckTime.current = now + BACKOFF_TIME;
          console.log(`Backing off connection checks for ${BACKOFF_TIME/1000} seconds after multiple failures`);
        }
        
        // Only reset connection if we've had multiple failures
        if (failedChecks.current >= MAX_FAILED_CHECKS) {
          resetConnectionState();
        }
        return;
      }
      
      // Reset failed checks counter on success
      failedChecks.current = 0;
      
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
      console.error("Error checking QuickBooks connection:", error);
      logError("Error checking QuickBooks connection", {
        source: "useQBConnectionStatus",
        context: { error }
      });
      
      // Increment failed check counter
      failedChecks.current += 1;
      
      // Only reset connection if we've had multiple failures
      if (failedChecks.current >= MAX_FAILED_CHECKS) {
        resetConnectionState();
      }
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
    // Reset the failed checks counter to ensure we try again
    failedChecks.current = 0;
    // Reset the last check time to ensure we check immediately
    lastCheckTime.current = 0;
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

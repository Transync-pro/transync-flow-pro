
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QuickbooksConnection } from "./types";
import { User } from "@supabase/supabase-js";
import { logError } from "@/utils/errorLogger";
import { checkQBConnectionExists, clearConnectionCache } from "@/services/quickbooksApi/connections";

export const useQBConnectionStatus = (user: User | null) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [realmId, setRealmId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [connection, setConnection] = useState<QuickbooksConnection | null>(null);
  const checkInProgress = useRef<boolean>(false);
  const lastCheckTime = useRef<number>(0);
  const maxConsecutiveChecks = useRef<number>(0);
  const connectionCheckAttempts = useRef<number>(0);

  // Reset connection state
  const resetConnectionState = useCallback(() => {
    setIsConnected(false);
    setRealmId(null);
    setCompanyName(null);
    setConnection(null);
  }, []);

  // Check connection status directly - no caching
  // Silent parameter prevents UI updates during background checks
  const checkConnectionStatus = useCallback(async (force = false, silent = false) => {
    if (!user) {
      resetConnectionState();
      setIsLoading(false);
      return;
    }
    
    // Prevent concurrent checks
    if (checkInProgress.current) return;
    
    // Circuit breaker to prevent excessive checks, but allow more attempts for forced checks
    maxConsecutiveChecks.current += 1;
    if (!force && maxConsecutiveChecks.current > 5) {
      console.log('Circuit breaker triggered: too many consecutive connection checks');
      setIsLoading(false);
      return;
    }
    
    // Don't check too frequently unless forced
    const now = Date.now();
    const throttleTime = force ? 0 : 5000; // 5 seconds throttle unless forced
    if (!force && now - lastCheckTime.current < throttleTime) {
      return;
    }
    
    checkInProgress.current = true;
    // Only update loading state if not in silent mode
    if (!silent) {
      setIsLoading(true);
    }
    lastCheckTime.current = now;
    
    // If we're doing a forced check, clear session storage
    if (force) {
      clearConnectionCache(user.id);
      connectionCheckAttempts.current += 1;
      console.log(`Forced connection check #${connectionCheckAttempts.current} for user ${user.id}`);
    }
    
    try {
      // Always check connection existence directly
      const exists = await checkQBConnectionExists(user.id);
      
      // If existence check indicates no connection, update state right away
      if (!exists) {
        console.log('Quick check found no QuickBooks connection');
        resetConnectionState();
        setIsLoading(false);
        checkInProgress.current = false;
        return;
      }
      
      // Always do a full DB query for complete connection data
      console.log(`Fetching complete QB connection data for user ${user.id}`);
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking QuickBooks connection:", error);
        resetConnectionState();
        checkInProgress.current = false;
        return;
      }
      
      if (data) {
        const qbConnection = data as QuickbooksConnection;
        setConnection(qbConnection);
        setIsConnected(true);
        setRealmId(qbConnection.realm_id);
        setCompanyName(qbConnection.company_name || null);
        
        // Reset the circuit breaker since we've found a connection
        maxConsecutiveChecks.current = 0;
        
        // Log connection details on forced checks
        if (force) {
          console.log('QuickBooks connection found:', { 
            realmId: qbConnection.realm_id,
            companyName: qbConnection.company_name
          });
        }
      } else {
          // No connection found
          if (force) {
            console.log('No QuickBooks connection found for user:', user.id);
          }
          resetConnectionState();
        }
    } catch (error: any) {
      console.error("Error checking QuickBooks connection:", error);
      logError("Error checking QuickBooks connection", {
        source: "useQBConnectionStatus",
        context: { error }
      });
      
      // Always reset connection state on error - no caching fallback
      resetConnectionState();
    } finally {
      // Only update loading state if not in silent mode
      if (!silent) {
        setIsLoading(false);
      }
      checkInProgress.current = false;
    }
  }, [user, resetConnectionState]);

  // Initial connection check on mount only
  useEffect(() => {
    // Check connection immediately on mount
    if (user) {
      checkConnectionStatus(false, true); // silent mode on initial load
    }
    
    // No interval-based checking - we only check on explicit actions
  }, [user, checkConnectionStatus]);

  // Public refresh method - force a check
  const refreshConnection = useCallback(async (force = true, silent = false) => {
    // Reset throttling and circuit breaker to ensure immediate check
    lastCheckTime.current = 0;
    maxConsecutiveChecks.current = 0;
    connectionCheckAttempts.current += 1;
    console.log(`Manual refresh connection requested #${connectionCheckAttempts.current}`, { force, silent });
    
    // Clear session storage
    if (force && user?.id) {
      clearConnectionCache(user.id);
    }
    
    // Track if we set loading to true so we can reset it
    const didSetLoading = !silent;
    
    // Reset state to ensure we show loading state
    if (didSetLoading) {
      setIsLoading(true);
    }
    
    // Perform the connection check
    try {
      await checkConnectionStatus(force, silent);
      return true;
    } catch (error) {
      console.error('Error during connection refresh:', error);
      return false;
    } finally {
      // Always reset loading state if we set it, regardless of silent mode
      if (didSetLoading) {
        console.log('Resetting loading state after refresh');
        setIsLoading(false);
      }
    }
  }, [checkConnectionStatus, user?.id]);

  return {
    isConnected,
    isLoading,
    connection,
    realmId,
    companyName,
    refreshConnection,
    checkConnection: checkConnectionStatus // Export for direct use in components
  };
};


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
  const cachedConnectedState = useRef<boolean | null>(null);
  const connectionCache = useRef<{
    userId: string | null;
    data: QuickbooksConnection | null;
    timestamp: number;
  }>({
    userId: null,
    data: null,
    timestamp: 0
  });

  // Reset connection state
  const resetConnectionState = useCallback(() => {
    setIsConnected(false);
    setRealmId(null);
    setCompanyName(null);
    setConnection(null);
    cachedConnectedState.current = false;
  }, []);

  // Check connection status with enhanced caching and throttling
  // Added silent parameter to prevent UI updates during background checks
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
    
    // If we're doing a forced check, clear the connection cache first
    if (force) {
      clearConnectionCache(user.id);
      connectionCache.current = {
        userId: null,
        data: null,
        timestamp: 0
      };
      connectionCheckAttempts.current += 1;
      console.log(`Forced connection check #${connectionCheckAttempts.current} for user ${user.id}`);
    }
    
    try {
      // Use the optimized existence check first
      const exists = await checkQBConnectionExists(user.id);
      
      // If existence check indicates no connection, update state right away
      if (!exists) {
        console.log('Quick check found no QuickBooks connection');
        resetConnectionState();
        setIsLoading(false);
        checkInProgress.current = false;
        return;
      }
      
      // If forced refresh or the cache is expired/empty, do a full DB query
      if (force || 
          connectionCache.current.userId !== user.id || 
          now - connectionCache.current.timestamp > 300000) { // 5 minute cache
        
        // Query the QuickBooks connections table
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
        
        // Update cache
        connectionCache.current = {
          userId: user.id,
          data: data || null,
          timestamp: now
        };
        
        if (data) {
          // Cache duration in milliseconds (30 minutes for normal operations)
          // We're extending this significantly since we're only checking on user actions
          const CACHE_DURATION = 30 * 60 * 1000;
          const qbConnection = data as QuickbooksConnection;
          setConnection(qbConnection);
          setIsConnected(true);
          cachedConnectedState.current = true;
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
      } else if (connectionCache.current.data) {
        // Use cached data if available and not expired
        const qbConnection = connectionCache.current.data;
        setConnection(qbConnection);
        setIsConnected(true);
        cachedConnectedState.current = true;
        setRealmId(qbConnection.realm_id);
        setCompanyName(qbConnection.company_name || null);
      }
    } catch (error: any) {
      console.error("Error checking QuickBooks connection:", error);
      logError("Error checking QuickBooks connection", {
        source: "useQBConnectionStatus",
        context: { error }
      });
      
      // Fallback to cached state if available
      if (cachedConnectedState.current !== null) {
        setIsConnected(cachedConnectedState.current);
      } else {
        resetConnectionState();
      }
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
    
    // Clear any cached connection data
    if (force) {
      if (user?.id) {
        clearConnectionCache(user.id);
      }
      connectionCache.current = {
        userId: null,
        data: null,
        timestamp: 0
      };
      
      // Reset state to ensure we show loading state
      if (!silent) {
        setIsLoading(true);
      }
    }
    
    // Perform the connection check
    try {
      await checkConnectionStatus(force, silent);
      return true;
    } catch (error) {
      console.error('Error during connection refresh:', error);
      return false;
    }
  }, [checkConnectionStatus, user?.id]);

  return {
    isConnected,
    isLoading,
    connection,
    realmId,
    companyName,
    refreshConnection: (silent = false) => checkConnectionStatus(true, silent),
    checkConnection: checkConnectionStatus // Export for direct use in components
  };
};

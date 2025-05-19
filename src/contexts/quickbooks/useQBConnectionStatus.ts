
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QuickbooksConnection } from "./types";
import { User } from "@supabase/supabase-js";
import { logError } from "@/utils/errorLogger";
import { checkQBConnectionExists } from "@/services/quickbooksApi/connections";

export const useQBConnectionStatus = (user: User | null) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [realmId, setRealmId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [connection, setConnection] = useState<QuickbooksConnection | null>(null);
  const checkInProgress = useRef<boolean>(false);
  const lastCheckTime = useRef<number>(0);
  const maxConsecutiveChecks = useRef<number>(0);
  const connectionCache = useRef<{
    userId: string | null;
    data: QuickbooksConnection | null;
    timestamp: number;
  }>({
    userId: null,
    data: null,
    timestamp: 0
  });

  // Check connection status with enhanced caching and throttling
  const checkConnectionStatus = useCallback(async (force = false) => {
    if (!user) {
      resetConnectionState();
      setIsLoading(false);
      return;
    }
    
    // Prevent concurrent checks
    if (checkInProgress.current) return;
    
    // Circuit breaker to prevent excessive checks
    maxConsecutiveChecks.current += 1;
    if (maxConsecutiveChecks.current > 5) {
      console.log('Circuit breaker triggered: too many consecutive connection checks');
      setIsLoading(false);
      return;
    }
    
    // Don't check too frequently unless forced
    const now = Date.now();
    const throttleTime = force ? 0 : 30000; // 30 seconds throttle unless forced
    if (now - lastCheckTime.current < throttleTime) {
      return;
    }
    
    // Use the optimized existence check first
    if (!force) {
      try {
        const exists = await checkQBConnectionExists(user.id);
        if (!exists) {
          resetConnectionState();
          setIsLoading(false);
          return;
        }
      } catch (error) {
        // If existence check fails, continue to full check
        console.error("Error in quick connection check:", error);
      }
    }
    
    // Check cache first (only if not forced)
    if (!force && 
        connectionCache.current.userId === user.id && 
        connectionCache.current.timestamp > now - 120000) { // Extended to 2 minute cache
      
      if (connectionCache.current.data) {
        // Use cached data
        const qbConnection = connectionCache.current.data;
        setConnection(qbConnection);
        setIsConnected(true);
        setRealmId(qbConnection.realm_id);
        setCompanyName(qbConnection.company_name || null);
        setIsLoading(false);
        return;
      } else if (connectionCache.current.data === null) {
        // We know there's no connection from cache
        resetConnectionState();
        setIsLoading(false);
        return;
      }
    }
    
    checkInProgress.current = true;
    setIsLoading(true);
    lastCheckTime.current = now;
    
    try {
      // More selective logging - only log on forced checks
      if (force) {
        console.log('Checking QuickBooks connection for user:', user.id);
      }
      
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
      
      // Update cache
      connectionCache.current = {
        userId: user.id,
        data: data || null,
        timestamp: now
      };
      
      if (data) {
        // Connection found
        const qbConnection = data as QuickbooksConnection;
        setConnection(qbConnection);
        setIsConnected(true);
        setRealmId(qbConnection.realm_id);
        setCompanyName(qbConnection.company_name || null);
        
        // Reset the circuit breaker since we've found a connection
        maxConsecutiveChecks.current = 0;
        
        // Only log on forced checks
        if (force) {
          console.log('QuickBooks connection found:', { 
            realmId: qbConnection.realm_id,
            companyName: qbConnection.company_name
          });
        }
      } else {
        // No connection found - only log on forced checks
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

  // Check connection on mount and when user changes - with reduced frequency
  useEffect(() => {
    // Reset circuit breaker when user changes
    maxConsecutiveChecks.current = 0;
    
    // Reset cache when user changes
    if (connectionCache.current.userId !== user?.id) {
      connectionCache.current = {
        userId: null,
        data: null,
        timestamp: 0
      };
    }
    
    // Check connection status immediately on mount
    checkConnectionStatus(false);
    
    // Clear throttling on unmount
    return () => {
      lastCheckTime.current = 0;
    };
  }, [user, checkConnectionStatus]);

  // Public refresh method - force a check
  const refreshConnection = useCallback(async () => {
    // Reset throttling and circuit breaker to ensure immediate check
    lastCheckTime.current = 0;
    maxConsecutiveChecks.current = 0;
    await checkConnectionStatus(true);
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


import { useState, useCallback, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { checkQBConnectionExists, clearConnectionCache } from '@/services/quickbooksApi/connections';
import { QuickbooksConnection } from './types';

export const useQBConnectionManager = (user: User | null) => {
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'>('idle');
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [connection, setConnection] = useState<QuickbooksConnection | null>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // Check connection with exponential backoff - updated signature to match expected usage
  const checkConnectionWithRetry = useCallback(async (attempt = 0, maxAttempts = 5): Promise<boolean> => {
    if (!user) return false;

    // Max attempts with exponential backoff
    if (attempt >= maxAttempts) {
      setConnectionState('error');
      return false;
    }

    setConnectionState('connecting');
    
    try {
      const exists = await checkQBConnectionExists(user.id);
      
      if (exists) {
        setConnectionState('connected');
        setLastChecked(Date.now());
        return true;
      } else if (attempt < maxAttempts - 1) { // If not final attempt
        // Exponential backoff: 1s, 2s, 4s, 8s
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise(resolve => {
          checkTimeoutRef.current = setTimeout(resolve, delay);
        });
        return checkConnectionWithRetry(attempt + 1, maxAttempts);
      } else {
        setConnectionState('disconnected');
        return false;
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionState('error');
      return false;
    }
  }, [user]);

  // Reset connection state when user changes
  useEffect(() => {
    // Reset state when user changes
    setConnectionState('idle');
    setLastChecked(null);
    setConnection(null);
    
    if (user) {
      checkConnectionWithRetry();
    }
    
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [user, checkConnectionWithRetry]);

  return {
    connectionState,
    lastChecked,
    connection,
    checkConnectionWithRetry
  };
};

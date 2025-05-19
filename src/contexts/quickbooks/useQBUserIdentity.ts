
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { QuickbooksUserIdentity } from './types';
import { logError } from '@/utils/errorLogger';

export const useQBUserIdentity = (user: User | null, isConnected: boolean) => {
  const [userIdentity, setUserIdentity] = useState<QuickbooksUserIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch user identity from the database
  const fetchUserIdentity = useCallback(async () => {
    if (!user || !isConnected) {
      setUserIdentity(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching QuickBooks user identity...');
      
      const { data, error } = await supabase
        .from('quickbooks_user_info')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setUserIdentity(data);
      console.log('QuickBooks user identity fetched:', data ? 'found' : 'not found');
    } catch (err: any) {
      const errorMessage = `Failed to fetch QuickBooks user identity: ${err.message}`;
      console.error(errorMessage);
      logError(errorMessage, { source: 'useQBUserIdentity' });
      setError(errorMessage);
      setUserIdentity(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, isConnected]);

  // Fetch user identity when dependencies change
  useEffect(() => {
    fetchUserIdentity();
  }, [fetchUserIdentity]);

  return {
    userIdentity,
    isLoading,
    error,
    refreshUserIdentity: fetchUserIdentity
  };
};

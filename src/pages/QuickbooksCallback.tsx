import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/environmentClient';
import { useAuth } from '@/contexts/AuthContext';
import { logError } from '@/utils/errorLogger';
import { ConnectionLoading } from '@/components/ConnectionLoading';
import { connectionStatusService } from '@/services/auth/ConnectionStatusService';

const QuickbooksCallback: React.FC = (): JSX.Element => {
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const hasProcessedCallback = useRef<boolean>(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (isAuthLoading || hasProcessedCallback.current || !user) return;
      
      hasProcessedCallback.current = true;
      
      try {
        // Get URL parameters
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const realmId = params.get('realmId');
        const state = params.get('state');
        const errorParam = params.get('error');

        if (errorParam) {
          throw new Error(`QuickBooks authorization error: ${errorParam}`);
        }

        if (!code || !realmId) {
          throw new Error('Missing required parameters');
        }

        // Verify state matches user ID for security
        if (state !== user.id) {
          throw new Error('Invalid state parameter');
        }

        // Clear any stale connection cache
        connectionStatusService.clearCache(user.id);
        
        // Exchange code for tokens
        const { data, error: exchangeError } = await supabase.functions.invoke('quickbooks-auth', {
          body: { 
            path: 'token',
            code,
            realmId,
            state,
            userId: user.id,
            redirectUri: window.location.origin + '/dashboard/quickbooks-callback'
          }
        });

        if (exchangeError || data?.error) {
          throw new Error(exchangeError?.message || data?.error || 'Token exchange failed');
        }

        // Get company name from response
        const companyName = data.companyName || 'Unknown Company';
        
        // Mark as connected immediately
        connectionStatusService.markAsConnected(user.id, companyName);
        
        // Send success message to opener window and close
        if (window.opener) {
          window.opener.postMessage({
            type: 'QB_AUTH_SUCCESS',
            companyName
          }, window.location.origin);
          window.close();
        } else {
          // Fallback if somehow not in popup
          window.location.href = '/dashboard';
        }
        
      } catch (err: any) {
        const errorMessage = err.message || 'Connection failed';
        
        logError('QuickBooks callback error', {
          source: 'QuickbooksCallback',
          error: errorMessage,
          userId: user.id
        });
        
        // Send error to opener and close
        if (window.opener) {
          window.opener.postMessage({
            type: 'QB_AUTH_ERROR',
            error: errorMessage
          }, window.location.origin);
          
          // Brief delay to show error
          setTimeout(() => window.close(), 1500);
        }
        
        setError(errorMessage);
      }
    };

    handleCallback();
  }, [isAuthLoading, location.search, user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <ConnectionLoading message={error || "Completing QuickBooks connection..."} />
    </div>
  );
};

export default QuickbooksCallback;

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
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');

        // Handle error from QuickBooks
        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        // Validate required parameters
        if (!code || !state) {
          throw new Error('Missing required parameters');
        }

        // Get stored state and PKCE verifier
        const storedState = sessionStorage.getItem('qb_connecting_user');
        const codeVerifier = sessionStorage.getItem('qb_code_verifier');

        // Validate state to prevent CSRF
        if (!storedState || state !== storedState) {
          throw new Error('Invalid state parameter');
        }

        if (!codeVerifier) {
          throw new Error('Missing code verifier');
        }

        // Exchange code for tokens using PKCE verifier
        const { data, error: exchangeError } = await supabase.functions.invoke('quickbooks-auth', {
          body: {
            path: 'token',
            code,
            redirectUri: window.location.origin + '/dashboard/quickbooks-callback',
            codeVerifier
          }
        });

        if (exchangeError || !data?.success) {
          throw new Error(exchangeError?.message || 'Failed to exchange code for tokens');
        }

        // Clear session storage
        sessionStorage.removeItem('qb_connecting_user');
        sessionStorage.removeItem('qb_code_verifier');

        // Notify parent window of success
        if (window.opener) {
          window.opener.postMessage({
            type: 'QB_AUTH_SUCCESS',
            companyName: data.companyName
          }, window.location.origin);
          window.close();
        }

      } catch (error: any) {
        const errorMessage = error.message || 'Connection failed';
        
        logError('QuickBooks callback error', {
          source: 'QuickbooksCallback',
          error: errorMessage,
          userId: user.id
        });
        
        // Notify parent window of error
        if (window.opener) {
          window.opener.postMessage({
            type: 'QB_AUTH_ERROR',
            error: errorMessage
          }, window.location.origin);
          window.close();
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

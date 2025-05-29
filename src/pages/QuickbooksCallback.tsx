import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/environmentClient';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { logError } from '@/utils/errorLogger';
import { useAuthFlow } from '@/services/auth/AuthFlowManager';
import { ConnectionLoading } from '@/components/ConnectionLoading';
import { connectionStatusService } from '@/services/auth/ConnectionStatusService';

const QuickbooksCallback: React.FC = (): JSX.Element => {
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>('');
  
  const location = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { handleAuthSuccess, handleAuthError } = useAuthFlow();
  
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

        // Clear any stale session data
        sessionStorage.removeItem('processed_qb_codes');
        
        // Get the current URL to use as a base for the redirect URI
        const baseUrl = window.location.origin;
        const redirectUrl = `${baseUrl}/dashboard/quickbooks-callback`;
        
        // Exchange code for tokens
        const { data, error: exchangeError } = await supabase.functions.invoke('quickbooks-auth', {
          body: { 
            path: 'token',
            code,
            realmId,
            state,
            userId: user.id,
            redirectUri: redirectUrl
          }
        });

        if (exchangeError || data?.error) {
          throw new Error(exchangeError?.message || data?.error || 'Token exchange failed');
        }

        const retrievedCompanyName = data.companyName || 'Unknown Company';
        setCompanyName(retrievedCompanyName);
        setSuccess(true);
        
        // Store connection info
        sessionStorage.setItem('qb_auth_success', 'true');
        sessionStorage.setItem('qb_connection_timestamp', Date.now().toString());
        sessionStorage.setItem('qb_connection_company', retrievedCompanyName);
        
        // Notify parent window of success and close popup
        if (window.opener) {
          window.opener.postMessage({
            type: 'QB_AUTH_SUCCESS',
            companyName: retrievedCompanyName
          }, window.location.origin);
          
          // Brief delay to ensure message is sent
          setTimeout(() => window.close(), 500);
        } else {
          // If not in popup, redirect to dashboard with success flag
          window.location.href = `/dashboard?connected=1&company=${encodeURIComponent(retrievedCompanyName)}`;
        }

      } catch (error: any) {
        const errorMessage = error.message || 'Connection failed';
        console.error('QuickBooks callback error:', error);
        setError(errorMessage);
        
        // Log error for debugging
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
          setTimeout(() => window.close(), 500);
        } else {
          // If not in popup, redirect to dashboard with error
          window.location.href = `/dashboard?error=${encodeURIComponent(errorMessage)}`;
        }
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [user, isAuthLoading, location.search]);

  // Show loading state while processing
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <ConnectionLoading message="Connecting to QuickBooks..." />
      </div>
    );
  }

  // Show success message
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Successfully Connected!</h2>
          <p className="text-gray-600">
            Connected to {companyName}. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            className="w-full"
            onClick={() => window.location.href = '/authenticate'}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <ConnectionLoading message="Processing connection..." />
    </div>
  );
};

export default QuickbooksCallback;

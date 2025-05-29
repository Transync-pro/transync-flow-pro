
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
        console.log('QuickbooksCallback: Processing OAuth callback');
        
        // Get URL parameters
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const realmId = params.get('realmId');
        const state = params.get('state');
        const errorParam = params.get('error');

        console.log('QuickbooksCallback: Parameters:', { 
          code: code ? 'present' : 'missing',
          realmId,
          state,
          error: errorParam
        });

        if (errorParam) {
          throw new Error(`QuickBooks authorization error: ${errorParam}`);
        }

        if (!code || !realmId) {
          throw new Error('Missing required parameters (code or realmId)');
        }

        // Clear any stale session data
        sessionStorage.removeItem('processed_qb_codes');
        
        console.log('QuickbooksCallback: Exchanging code for tokens');
        
        // Get the current URL to use as a base for the redirect URI
        const baseUrl = window.location.origin;
        const redirectUrl = `${baseUrl}/dashboard/quickbooks-callback`;
        
        // Call the edge function to exchange code for tokens using the "token" path
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

        if (exchangeError) {
          throw new Error(`Token exchange failed: ${exchangeError.message}`);
        }

        if (data.error) {
          throw new Error(`Token exchange failed: ${data.error}`);
        }

        console.log('QuickbooksCallback: Token exchange successful');
        
        // Get company name from response if available
        const retrievedCompanyName = data.companyName || 'Unknown Company';
        setCompanyName(retrievedCompanyName);
        
        // Show success state
        setSuccess(true);
        setIsProcessing(false);
        
        // Wait a moment to show success, then handle the auth success
        setTimeout(() => {
          console.log('QuickbooksCallback: Handling auth success');
          handleAuthSuccess(user.id, retrievedCompanyName);
        }, 1500);
        
      } catch (err: any) {
        console.error('QuickbooksCallback: Error processing callback:', err);
        
        logError('QuickBooks callback processing error', {
          source: 'QuickbooksCallback',
          stack: err instanceof Error ? err.stack : undefined,
          context: { 
            error: err.message,
            userId: user?.id,
            searchParams: location.search
          }
        });
        
        setError(err.message || 'An error occurred during QuickBooks connection');
        setIsProcessing(false);
        handleAuthError(err.message || 'Callback processing failed');
        
        toast({
          title: "Connection Failed",
          description: err.message || "Failed to connect to QuickBooks. Please try again.",
          variant: "destructive",
        });
      }
    };

    handleCallback();
  }, [isAuthLoading, location.search, user, handleAuthSuccess, handleAuthError]);

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

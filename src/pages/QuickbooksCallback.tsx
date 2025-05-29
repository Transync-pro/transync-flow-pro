
import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/environmentClient';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { logError } from '@/utils/errorLogger';
import { ConnectionLoading } from '@/components/ConnectionLoading';
import { connectionStatusService } from '@/services/auth/ConnectionStatusService';

const QuickbooksCallback: React.FC = (): JSX.Element => {
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>('');
  
  const location = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const hasProcessedCallback = useRef<boolean>(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (isAuthLoading || hasProcessedCallback.current || !user) return;
      
      hasProcessedCallback.current = true;
      
      try {
        console.log('QuickbooksCallback: Processing OAuth callback in popup mode');
        
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

        // Clear any stale connection cache
        connectionStatusService.clearCache(user.id);
        
        console.log('QuickbooksCallback: Exchanging code for tokens');
        
        // Get the current URL to use as a base for the redirect URI
        const baseUrl = window.location.origin;
        const redirectUrl = `${baseUrl}/dashboard/quickbooks-callback`;
        
        // Call the edge function to exchange code for tokens
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
        
        // Get company name from response
        const retrievedCompanyName = data.companyName || 'Unknown Company';
        setCompanyName(retrievedCompanyName);
        
        // Mark as connected in the connection service
        connectionStatusService.markAsConnected(user.id, retrievedCompanyName);
        
        // Show success state
        setSuccess(true);
        setIsProcessing(false);
        
        // Send success message to parent window
        if (window.opener) {
          console.log('QuickbooksCallback: Sending success message to parent window');
          window.opener.postMessage({
            type: 'QB_AUTH_SUCCESS',
            companyName: retrievedCompanyName
          }, window.location.origin);
          
          // Close popup after a short delay
          setTimeout(() => {
            window.close();
          }, 1500);
        } else {
          // Fallback if not in popup - redirect to dashboard
          console.log('QuickbooksCallback: Not in popup, redirecting to dashboard');
          window.location.href = '/dashboard';
        }
        
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
        
        // Send error message to parent window
        if (window.opener) {
          console.log('QuickbooksCallback: Sending error message to parent window');
          window.opener.postMessage({
            type: 'QB_AUTH_ERROR',
            error: err.message || 'Connection failed'
          }, window.location.origin);
          
          // Close popup after a short delay
          setTimeout(() => {
            window.close();
          }, 3000);
        }
      }
    };

    handleCallback();
  }, [isAuthLoading, location.search, user]);

  // Show success message briefly
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Successfully Connected!</h2>
          <p className="text-gray-600">
            Connected to {companyName}. This window will close automatically...
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
            onClick={() => window.close()}
          >
            Close Window
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state while processing (default)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <ConnectionLoading message="Connecting to QuickBooks..." />
    </div>
  );
};

export default QuickbooksCallback;

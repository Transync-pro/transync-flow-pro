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
        console.log('QuickbooksCallback: Processing OAuth callback');
        
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
          throw new Error('Missing required parameters (code or realmId)');
        }

        // Clear any stale connection cache
        connectionStatusService.clearCache(user.id);
        
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

        if (exchangeError || data?.error) {
          throw new Error(exchangeError?.message || data?.error || 'Token exchange failed');
        }

        // Get company name from response
        const retrievedCompanyName = data.companyName || 'Unknown Company';
        
        // Mark as connected in the connection service
        connectionStatusService.markAsConnected(user.id, retrievedCompanyName);
        
        // Send success message to opener window if it exists
        if (window.opener) {
          window.opener.postMessage({
            type: 'QB_AUTH_SUCCESS',
            companyName: retrievedCompanyName
          }, window.location.origin);
          
          // Close this window immediately
          window.close();
        } else {
          // If somehow opened in main window, redirect to dashboard
          window.location.href = '/dashboard';
        }
        
      } catch (err: any) {
        console.error('QuickbooksCallback: Error processing callback:', err);
        
        logError('QuickBooks callback processing error', {
          source: 'QuickbooksCallback',
          error: err.message,
          userId: user?.id
        });
        
        // Send error to opener window if it exists
        if (window.opener) {
          window.opener.postMessage({
            type: 'QB_AUTH_ERROR',
            error: err.message || 'Connection failed'
          }, window.location.origin);
          
          // Close after a short delay to show error
          setTimeout(() => window.close(), 2000);
        }
        
        setError(err.message || 'An error occurred during QuickBooks connection');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [isAuthLoading, location.search, user]);

  // Only show loading state - success/error states will be very brief
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <ConnectionLoading message="Completing QuickBooks connection..." />
      {error && (
        <div className="mt-4 text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default QuickbooksCallback;


import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/environmentClient';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useQuickbooks } from '@/contexts/QuickbooksContext';
import { logError } from '@/utils/errorLogger';
import { forceConnectionState } from '@/services/quickbooksApi/connections';
import { navigationController } from '@/services/navigation/NavigationController';
import { ConnectionLoading } from '@/components/ConnectionLoading';

interface QuickbooksCallbackProps {
  // Add any props if needed
}

const QuickbooksCallback: React.FC<QuickbooksCallbackProps> = (): JSX.Element => {
  // State management
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [processingComplete, setProcessingComplete] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { refreshConnection } = useQuickbooks();
  
  // Refs
  const hasProcessedCallback = useRef<boolean>(false);

  const redirectToDashboard = useCallback(async (options: { force?: boolean } = {}) => {
    // Skip if already navigating and not forcing
    if (isNavigating && !options.force) {
      console.log('Navigation already in progress, skipping');
      return;
    }
    
    console.log('Starting navigation to dashboard');
    setIsNavigating(true);
    
    try {
      // Clear the in-progress flags
      console.log('Clearing connection flags from session storage');
      sessionStorage.removeItem('qb_connecting_user');
      sessionStorage.removeItem('qb_connection_in_progress');
      
      try {
        // Force update the connection status
        console.log('Refreshing connection status...');
        await refreshConnection(true);
        console.log('Connection status refreshed successfully');
      } catch (refreshError) {
        console.warn('Could not refresh connection status, continuing with navigation', refreshError);
        // Continue with navigation even if refresh fails
      }
      
      // Add a small delay to ensure the dashboard is ready
      console.log('Waiting before navigation...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear any existing redirect flags
      sessionStorage.removeItem('qb_redirected_to_authenticate');
      
      // Still set basic flags for other components to use if needed
      sessionStorage.setItem('qb_connection_verified', 'true');
      sessionStorage.setItem('qb_connection_success', 'true');
      
      // Force the connection state to be true for this user for 10 seconds
      // This helps with database check overrides during the transition
      if (user?.id) {
        forceConnectionState(user.id, true, 10000); // 10 seconds of forced connected state
        console.log(`Forced connection state to true for user ${user.id} after successful authentication`);
      }
      
      console.log('Using NavigationController to handle auth success navigation');
      // Use the NavigationController to handle navigation after successful auth
      // This provides centralized navigation control with locking
      navigationController.handleAuthSuccess(user?.id || '', navigate);
      
    } catch (error) {
      console.error('Error during navigation:', error);
      // Still navigate to dashboard even if there's an error
      try {
        navigate('/dashboard', { 
          replace: true,
          state: { 
            error: 'connection_error',
            timestamp: Date.now()
          }
        });
      } catch (navError) {
        console.error('Failed to navigate to dashboard:', navError);
      }
    } finally {
      setIsNavigating(false);
    }
  }, [isNavigating, navigate, refreshConnection, user?.id]);

  // Check user session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsCheckingSession(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.warn('No active session found, redirecting to login');
          navigate('/login', { 
            state: { 
              from: location.pathname,
              error: 'session_expired'
            },
            replace: true 
          });
          return;
        }
      } catch (err: any) {
        logError("QuickBooks session check error", {
          source: "QuickbooksCallback",
          context: { error: err.message }
        });
        
        setError(`Session check failed: ${err.message || "Unknown error"}`);
        
        toast({
          title: "Session Error",
          description: "Unable to verify your session. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [navigate, location.pathname]);

  // Handle the OAuth callback from QuickBooks
  useEffect(() => {
    const handleCallback = async () => {
      if (isAuthLoading || hasProcessedCallback.current) return;
      
      // Mark as processed immediately to prevent duplicate processing
      hasProcessedCallback.current = true;
      
      try {
        // Clear any stale processed codes to ensure we don't skip token exchange
        sessionStorage.removeItem('processed_qb_codes');
        console.log('Cleared processed QB codes to ensure fresh token exchange');
        
        // Set connection in progress flags immediately
        sessionStorage.setItem('qb_connection_in_progress', 'true');
        sessionStorage.setItem('qb_connecting_user', user?.id || '');
        setIsProcessing(true);
        
        // Get URL parameters
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const realmId = params.get('realmId');
        const state = params.get('state'); // This contains the userId from our auth process
        const errorParam = params.get('error');

        // Log callback parameters for debugging
        console.log('Processing callback parameters:', { 
          code: code ? 'present' : 'missing',
          realmId,
          state
        });

        if (errorParam) {
          throw new Error('QuickBooks authorization error: ' + errorParam);
        }

        if (!code || !realmId) {
          console.warn('Missing required parameters for QuickBooks callback');
          setError('Missing required parameters');
          return;
        }

        // Exchange code for tokens
        const response = await fetch('/api/quickbooks/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, realmId, state }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to connect to QuickBooks');
        }
        
        await response.json();
        
        // Update connection status
        await refreshConnection(true);
        
        // Show success message
        setSuccess(true);
        setProcessingComplete(true);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          redirectToDashboard({ force: true });
        }, 1500);
        
      } catch (err: any) {
        console.error('Error in QuickBooks callback processing:', err);
        setError(err.message || 'An error occurred during QuickBooks connection');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [isAuthLoading, location.search, user?.id, refreshConnection, redirectToDashboard]);

  // Show loading state while checking session or processing
  if (isCheckingSession || isAuthLoading || isNavigating || isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <ConnectionLoading message="Connecting to QuickBooks..." />
      </div>
    );
  }

  // Show success message if processing is complete
  if (processingComplete && success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Connected to QuickBooks</h2>
          <p className="text-gray-600">You're being redirected to your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error message if there was an error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            className="w-full"
            onClick={() => window.location.href = '/dashboard/settings/integrations'}
          >
            Back to Integrations
          </Button>
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <ConnectionLoading message="Processing QuickBooks connection..." />
    </div>
  );
};

export default QuickbooksCallback;

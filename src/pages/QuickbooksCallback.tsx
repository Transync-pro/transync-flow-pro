import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/environmentClient";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { logError } from "@/utils/errorLogger";
import { clearConnectionCache, forceConnectionState } from "@/services/quickbooksApi/connections";
import { navigationController } from "@/services/navigation/NavigationController";
import { motion } from "framer-motion";
import { getCurrentDomain, addStagingPrefix } from "@/config/environment";

const QuickbooksCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [processingComplete, setProcessingComplete] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { refreshConnection } = useQuickbooks();
  
  // Ref to track if we've already processed this callback
  const hasProcessedCallback = useRef(false);

  const [isNavigating, setIsNavigating] = useState(false);

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
      
      // No need to call navigate directly - NavigationController handles it
      // This prevents competing navigation attempts from other components
      // timestamp: Date.now()
      
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
        console.error('Critical navigation error:', navError);
        // Last resort - redirect without state
        window.location.href = '/dashboard';
      }
    } finally {
      console.log('Navigation process completed');
      setIsNavigating(false);
    }
  }, [navigate, refreshConnection, isNavigating]);

  // Process the callback once auth is loaded
  useEffect(() => {
    // Skip if still loading auth or if we've already processed this callback
    if (isAuthLoading || hasProcessedCallback.current) return;
    
    // Mark as processed immediately to prevent duplicate processing
    hasProcessedCallback.current = true;
    
    // Clear any stale processed codes to ensure we don't skip token exchange
    sessionStorage.removeItem('processed_qb_codes');
    console.log('Cleared processed QB codes to ensure fresh token exchange');
    
    // Set connection in progress flags immediately
    sessionStorage.setItem('qb_connection_in_progress', 'true');
    sessionStorage.setItem('qb_connecting_user', user?.id || '');
    
    const processCallback = async () => {
      try {
        setIsProcessing(true);
        
        // Get URL parameters
        const params = new URLSearchParams(location.search);
        const code = params.get("code");
        const realmId = params.get("realmId");
        const state = params.get("state"); // This contains the userId from our auth process
        const errorParam = params.get("error");

        // Log callback parameters for debugging
        console.log("Processing callback parameters:", { 
          code: code ? "present" : "missing",
          realmId,
          state
        });

        if (errorParam) {
          throw new Error(`QuickBooks authorization error: ${errorParam}`);
        }

        if (!code || !realmId) {
          console.warn('Missing required parameters for QuickBooks callback');
          setError('Missing required parameters');
          return;
        }

        // Get current user
        const { data: currentSessionData } = await supabase.auth.getSession();
        const currentUser = currentSessionData?.session?.user || user;
        
        // Use stored ID from connection initiation as fallback
        const storedUserId = sessionStorage.getItem("qb_connecting_user");
        
        // Determine which user ID to use (prioritize state parameter)
        const userId = state || storedUserId || currentUser?.id;
        
        if (!userId) {
          throw new Error("Could not determine user ID for QuickBooks connection");
        }
        
        // Store the connecting user in session storage
        sessionStorage.setItem('qb_connecting_user', userId);
        
        setIsProcessing(true);
        
        console.log("Proceeding with token exchange:", { realmId, userId });
        
        // Use current domain for redirect URI - must exactly match what was used in the authorize step
        const currentDomain = getCurrentDomain();
        const redirectUri = `${currentDomain}${addStagingPrefix('/dashboard/quickbooks-callback')}`;
        
        // Log the exact parameters being sent to help with debugging
        console.log("Sending token exchange parameters:", {
          code: code ? "[REDACTED]" : "missing", // Don't log the actual code for security
          realmId,
          redirectUri,
          userId
        });
        
        // Check if we've already completed this exchange previously (defense against React StrictMode double invocation)
        const codeFingerprint = `${realmId}-${userId}`;
        const processedCodes = sessionStorage.getItem('processed_qb_codes') || '';
        
        if (processedCodes.includes(codeFingerprint)) {
          console.log("This code exchange was already processed, skipping to avoid duplicate processing");
          
          // CRITICAL: Set ALL THREE redirect flags IMMEDIATELY at the beginning
          // This ensures RouteGuard will see these flags even if it checks during our processing
          const currentTimestamp = Date.now();
          console.log(`Setting ALL critical auth flags with timestamp ${currentTimestamp}`);
          sessionStorage.setItem('qb_skip_auth_redirect', 'true');
          sessionStorage.setItem('qb_auth_success', 'true');
          sessionStorage.setItem('qb_connection_timestamp', currentTimestamp.toString());
          
          // Log the values we just set to verify
          console.log('VERIFICATION - Auth flags set:', {
            skip: sessionStorage.getItem('qb_skip_auth_redirect'),
            success: sessionStorage.getItem('qb_auth_success'),
            timestamp: sessionStorage.getItem('qb_connection_timestamp')
          });
          
          // Instead of calling clearConnectionCache which clears ALL QB flags including the ones we set,
          // selectively clear only the items we need to refresh
          console.log("Selectively clearing non-critical connection items (already processed path)");
          const itemsToClear = [
            'qb_connection_data',
            'qb_connection_success',
            'qb_connection_company',
            'qb_redirected_to_authenticate',
            'qb_connection_in_progress'
            // Don't clear processed_qb_codes here since we're using it to detect duplicate processing
            // IMPORTANT: Don't clear the critical flags we just set above!
          ];
          
          itemsToClear.forEach(key => sessionStorage.removeItem(key));

          toast({
            title: "Connected to QuickBooks",
            description: "Your account has been successfully connected to QuickBooks.",
          });
          
          // Ensure current session is still valid before redirecting
          const { data: finalSessionData } = await supabase.auth.getSession();
          
          if (!finalSessionData?.session) {
            console.log('Session lost during QuickBooks connection, attempting to restore');
            
            if (userId) {
              sessionStorage.setItem('qb_auth_success', 'true');
              sessionStorage.setItem('qb_connect_user', userId);
              navigate('/login', { state: { redirectAfter: '/dashboard' } });
              return;
            }
          }
          
          // Get redirect path from session storage or default to dashboard
          const redirectPath = sessionStorage.getItem('qb_redirect_after_connect') || '/dashboard';
          sessionStorage.removeItem('qb_redirect_after_connect');
          
          setProcessingComplete(true);
          await refreshConnection(true);
          
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 500);
          
          return;
        }
        
        let tokenExchangeData: any;
        
        try {
          // Exchange code for tokens - OAuth codes can only be used once and expire quickly
          const { data: exchangeData, error: invokeError } = await supabase.functions.invoke("quickbooks-auth", {
            body: {
              path: "token",
              code,
              realmId,
              redirectUri,
              userId
            },
          });

          if (invokeError) {
            console.error("Edge function error details:", invokeError);
            throw new Error(`Function error: ${invokeError.message}`);
          }
          
          if (exchangeData?.error) {
            console.error("QuickBooks API error details:", exchangeData.error);
            throw new Error(`QuickBooks API error: ${exchangeData.error}`);
          }
          
          if (!exchangeData) {
            throw new Error("No data returned from the token exchange");
          }
          
          tokenExchangeData = exchangeData;
          
          // Mark this code as processed to prevent duplicate exchanges
          const updatedProcessedCodes = processedCodes ? 
            `${processedCodes},${codeFingerprint}` : 
            codeFingerprint;
          sessionStorage.setItem('processed_qb_codes', updatedProcessedCodes);
          
          console.log("Token exchange successful");
        } catch (tokenError) {
          console.error("Token exchange error:", tokenError);
          
          // If we get a 400 error, it's likely that the code was already used or expired
          // In this case, we should redirect the user to try connecting again
          toast({
            title: "Connection Error",
            description: "There was a problem completing the QuickBooks connection. Please try again.",
            variant: "destructive"
          });
          
          // Wait a moment to show the toast before redirecting
          await new Promise(resolve => setTimeout(resolve, 1500));
          navigate('/dashboard', { replace: true });
          return;
        }

        // Check if tokenExchangeData is populated (implies success from the try/catch block above)
        if (tokenExchangeData && tokenExchangeData.success) {
          console.log("QuickBooks token exchange successful, proceeding to set flags and redirect.");
          
          // CRITICAL: Set ALL THREE redirect flags IMMEDIATELY at the beginning
          // This ensures RouteGuard will see these flags even if it checks during our processing
          const currentTimestamp = Date.now();
          console.log(`Setting ALL critical auth flags with timestamp ${currentTimestamp}`);
          sessionStorage.setItem('qb_skip_auth_redirect', 'true');
          sessionStorage.setItem('qb_auth_success', 'true');
          sessionStorage.setItem('qb_connection_timestamp', currentTimestamp.toString());
          
          // Log the values we just set to verify
          console.log('VERIFICATION - Auth flags set:', {
            skip: sessionStorage.getItem('qb_skip_auth_redirect'),
            success: sessionStorage.getItem('qb_auth_success'),
            timestamp: sessionStorage.getItem('qb_connection_timestamp')
          });
          
          // Instead of calling clearConnectionCache which clears ALL QB flags including the ones we set,
          // selectively clear only the items we need to refresh
          console.log("Selectively clearing non-critical connection items (new token exchange path)");
          const itemsToClear = [
            'qb_connection_data',
            'qb_connection_success',
            'qb_connection_company',
            'qb_redirected_to_authenticate',
            'qb_connection_in_progress',
            'processed_qb_codes'
            // IMPORTANT: Don't clear the critical flags we just set above!
          ];
          
          itemsToClear.forEach(key => sessionStorage.removeItem(key));

          // Store additional connection data (optional, but was previously there)
          const successTimestamp = Date.now(); // Can re-use the timestamp for consistency
          const connectionData = {
            success: true,
            timestamp: successTimestamp,
            companyName: tokenExchangeData.companyName || 'Unknown Company',
            realmId: tokenExchangeData.realmId
          };
          sessionStorage.setItem('qb_connection_data', JSON.stringify(connectionData));

          setSuccess(true); // Update component state

          // Show toast with company name and user identity info if available
          let toastMessage = `Your QuickBooks account (${tokenExchangeData.companyName || 'Unknown Company'}) has been connected!`;
          
          // Add user identity info to toast if available
          if (tokenExchangeData.userIdentity) {
            const identity = tokenExchangeData.userIdentity;
            if (identity.first_name && identity.last_name) {
              toastMessage += ` Connected user: ${identity.first_name} ${identity.last_name}`;
            }
          }
          
          toast({
            title: "QuickBooks Connected",
            description: toastMessage,
            duration: 2000 // Show for 2 seconds
          });

          // Update connection status in context
          try {
            await refreshConnection(true); // Force refresh
          } catch (refreshError) {
            console.error('Error refreshing connection:', refreshError);
          }
          
          // Clear any pending redirects to avoid loops
          sessionStorage.removeItem('qb_redirect_after_connect');
          
          // Mark processing as complete
          setProcessingComplete(true);
          
          // Use the redirect function
          await redirectToDashboard();
          
          // Clean up session storage after a delay
          setTimeout(() => {
            sessionStorage.removeItem('qb_connection_success');
          }, 5000);
        } else {
          // This case should ideally be caught by the tokenError catch block earlier
          // but as a fallback:
          console.error("Token exchange data not found or marked as not successful after try/catch block.");
          throw new Error("Token exchange failed or data was not processed correctly.");
        }
        
      } catch (err: any) {
        logError("QuickBooks callback error", {
          source: "QuickbooksCallback",
          context: { error: err.message }
        });
        
        setError(`Connection failed: ${err.message || "Unknown error"}`);
        
        toast({
          title: "Connection Failed",
          description: err.message || "Unable to connect to QuickBooks",
          variant: "destructive",
        });
        setIsProcessing(false);
      } finally {
        setIsCheckingSession(false);
      }
    };
    processCallback();
  }, [location, navigate, user, isAuthLoading, refreshConnection, redirectToDashboard]);

  // Show loading state while checking session
  if (isCheckingSession || isAuthLoading || isProcessing || isNavigating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div 
          className="text-center p-8 bg-white rounded-lg shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">
            {isProcessing ? "Completing QuickBooks connection..." : "Redirecting to dashboard..."}
          </h2>
          <p className="text-gray-600 mt-2">
            {isProcessing 
              ? "Please wait while we finalize your connection." 
              : "You'll be redirected in just a moment..."}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">QuickBooks Connection</h1>
        
        {isProcessing && !processingComplete ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            <p className="text-gray-600 text-center">
              Completing your QuickBooks connection...
            </p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => navigate("/authenticate")}
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your QuickBooks account has been connected successfully. You will be redirected to the dashboard.
              </AlertDescription>
            </Alert>
            <p className="text-center text-gray-500">
              If you are not redirected automatically, please click the button below.
            </p>
            <Button 
              onClick={() => navigate('/dashboard', { replace: true })}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickbooksCallback;


import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { logError } from "@/utils/errorLogger";
import { clearConnectionCache } from "@/services/quickbooksApi/connections";

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

  // Process the callback once auth is loaded
  useEffect(() => {
    // Skip if still loading auth or if we've already processed this callback
    if (isAuthLoading || hasProcessedCallback.current) return;
    
    // Mark as processed immediately to prevent duplicate processing
    hasProcessedCallback.current = true;
    
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

        if (!code) {
          throw new Error("Missing authorization code from QuickBooks");
        }

        if (!realmId) {
          throw new Error("Missing realm ID from QuickBooks");
        }
        
        // Get current user
        const { data: currentSessionData } = await supabase.auth.getSession();
        const currentUser = currentSessionData?.session?.user || user;
        
        // Use stored ID from connection initiation as fallback
        const storedUserId = sessionStorage.getItem("qb_connecting_user");
        
        if (!currentUser && !storedUserId) {
          throw new Error("Authentication required to complete this process");
        }

        // Determine which user ID to use (prioritize state parameter)
        const userId = state || storedUserId || currentUser?.id;
        
        if (!userId) {
          throw new Error("Could not determine user ID for QuickBooks connection");
        }
        
        console.log("Proceeding with token exchange:", { realmId, userId });
        
        // Use current origin for redirect URI - must exactly match what was used in the authorize step
        const redirectUri = window.location.origin + "/dashboard/quickbooks-callback";
        
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
          // Skip to success flow without re-exchanging the code
          clearConnectionCache();
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

        // Clean up session storage first
        sessionStorage.removeItem("qb_connecting_user");
        
        // Clear any existing connection cache to ensure fresh data
        clearConnectionCache(userId);
        
        // Store success in session storage immediately to prevent race conditions
        const successTimestamp = Date.now();
        sessionStorage.setItem('qb_connection_success', 'true');
        sessionStorage.setItem('qb_auth_successful', 'true');
        sessionStorage.setItem('qb_auth_timestamp', successTimestamp.toString());
        sessionStorage.setItem('qb_connection_company', tokenExchangeData.companyName || 'Unknown Company');
        
        // Mark as successful in state
        setSuccess(true);
        
        // Force update the connection status in the background
        refreshConnection(true).then(() => {
          console.log('Background connection refresh completed');
        }).catch(err => {
          console.error('Background refresh error:', err);
        });
        
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
        
        // Redirect immediately to dashboard
        navigate('/dashboard', { replace: true });
        
        // Clean up session storage after a delay
        setTimeout(() => {
          sessionStorage.removeItem('qb_connection_success');
        }, 5000);
        
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
  }, [location, navigate, user, isAuthLoading, refreshConnection]);

  // Show loading state while checking session
  if (isCheckingSession || isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">
            Verifying your session...
          </p>
        </div>
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

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { logError } from "@/utils/errorLogger";

const QuickbooksCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { refreshConnection } = useQuickbooks();

  // Process the callback once auth is loaded and we're not in a retry loop
  useEffect(() => {
    if (isAuthLoading) return;
    
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
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user || user;
        
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
        
        // Use current origin for redirect URI
        const redirectUri = window.location.origin + "/dashboard/quickbooks-callback";

        // Exchange code for tokens
        const { data, error: invokeError } = await supabase.functions.invoke("quickbooks-auth", {
          body: {
            path: "token",
            code,
            realmId,
            redirectUri,
            userId
          },
        });

        if (invokeError) {
          throw new Error(`Function error: ${invokeError.message}`);
        }
        
        if (data?.error) {
          throw new Error(`QuickBooks API error: ${data.error}`);
        }

        // Clean up session storage
        sessionStorage.removeItem("qb_connecting_user");

        // Update connection status in context
        await refreshConnection();
        
        // Mark as successful and show toast
        setSuccess(true);
        toast({
          title: "QuickBooks Connected",
          description: `Your QuickBooks account (${data.companyName || 'Unknown Company'}) has been connected successfully!`,
        });

        // Give UI time to update before redirecting
        setTimeout(() => {
          // Always redirect to dashboard after successful connection
          navigate("/dashboard", { replace: true });
        }, 1500);
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
      } finally {
        setIsProcessing(false);
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
          <p className="text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">QuickBooks Connection</h1>
        
        {isProcessing ? (
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
                onClick={() => navigate("/connect-quickbooks")}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickbooksCallback;

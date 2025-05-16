
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const QuickbooksCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Store the callback params in sessionStorage to preserve them across potential auth state changes
    const storeCallbackParams = () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const realmId = params.get("realmId");
      const state = params.get("state");
      const errorParam = params.get("error");
      
      if (code && realmId) {
        console.log("Storing OAuth params in session storage");
        sessionStorage.setItem("qb_callback_code", code);
        sessionStorage.setItem("qb_callback_realmId", realmId);
        if (state) sessionStorage.setItem("qb_callback_state", state);
        if (errorParam) sessionStorage.setItem("qb_callback_error", errorParam);
      }
    };
    
    storeCallbackParams();
  }, [location]);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get params - either from URL or from sessionStorage (if we had to wait for auth)
        let code = new URLSearchParams(location.search).get("code") || 
                  sessionStorage.getItem("qb_callback_code");
        let realmId = new URLSearchParams(location.search).get("realmId") || 
                     sessionStorage.getItem("qb_callback_realmId");
        let state = new URLSearchParams(location.search).get("state") || 
                   sessionStorage.getItem("qb_callback_state");
        let errorParam = new URLSearchParams(location.search).get("error") || 
                        sessionStorage.getItem("qb_callback_error");

        console.log("Processing callback with parameters:", { 
          code: code ? "exists" : "missing", 
          realmId, 
          state, 
          error: errorParam 
        });

        if (errorParam) {
          throw new Error(`Authorization error: ${errorParam}`);
        }

        if (!code) {
          throw new Error("Missing authorization code from QuickBooks");
        }

        if (!realmId) {
          throw new Error("Missing realm ID from QuickBooks");
        }

        if (!user) {
          // If no user, wait for authentication
          setWaitingForAuth(true);
          setIsProcessing(false);
          console.log("No user - waiting for authentication...");
          return;
        }

        const userId = state || user.id;
        console.log("Processing callback with code, realmId, and userId", { code: "exists", realmId, userId });

        // Call our edge function to exchange the code for tokens
        const { data, error: invokeError } = await supabase.functions.invoke("quickbooks-auth", {
          body: {
            path: "token",
            code,
            realmId,
            redirectUri: window.location.origin + "/dashboard/quickbooks-callback",
            userId
          },
        });

        if (invokeError) {
          console.error("Edge function error:", invokeError);
          throw new Error(invokeError?.message || "Failed to complete QuickBooks authentication");
        }

        if (data?.error) {
          console.error("Data error from edge function:", data.error);
          throw new Error(data.error);
        }

        // Clear the stored callback params now that we've processed them
        sessionStorage.removeItem("qb_callback_code");
        sessionStorage.removeItem("qb_callback_realmId");
        sessionStorage.removeItem("qb_callback_state");
        sessionStorage.removeItem("qb_callback_error");

        setSuccess(true);
        toast({
          title: "Connection Successful",
          description: `Your QuickBooks account (${data.companyName || 'Unknown Company'}) has been connected successfully!`,
        });

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } catch (err: any) {
        console.error("Error processing callback:", err);
        setError(`Failed to complete QuickBooks connection: ${err.message || "Unknown error"}`);
        toast({
          title: "Connection Failed",
          description: "Unable to connect to QuickBooks. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    // Only process if we have a user or if we're coming back from waiting for auth
    if (user || waitingForAuth) {
      handleCallback();
    } else {
      // If no user, wait briefly then check again
      const timer = setTimeout(() => {
        if (user) {
          handleCallback();
        } else {
          setError("Authentication required");
          setIsProcessing(false);
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [location, navigate, user, waitingForAuth]);

  // Handle manual login if needed
  const handleLogin = () => {
    navigate("/login?returnTo=" + encodeURIComponent(window.location.pathname + window.location.search));
  };

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
        ) : waitingForAuth ? (
          <div className="space-y-4">
            <Alert variant="default" className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-700">Authentication Required</AlertTitle>
              <AlertDescription className="text-yellow-700">
                You need to be logged in to complete the QuickBooks connection.
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button
                onClick={handleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Log In to Continue
              </Button>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                Return to Dashboard
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

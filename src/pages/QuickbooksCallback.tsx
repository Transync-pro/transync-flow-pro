
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQuickbooks } from "@/contexts/QuickbooksContext";

const QuickbooksCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { refreshConnection } = useQuickbooks();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get URL parameters
        const params = new URLSearchParams(location.search);
        const code = params.get("code");
        const realmId = params.get("realmId");
        const state = params.get("state"); // This contains the userId from our auth process
        const errorParam = params.get("error");

        if (errorParam) {
          throw new Error(`Authorization error: ${errorParam}`);
        }

        if (!code) {
          throw new Error("Missing authorization code from QuickBooks");
        }

        if (!realmId) {
          throw new Error("Missing realm ID from QuickBooks");
        }
        
        // Get current session first to ensure we have authentication
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user || user;
        
        // Check if we have a stored user ID from the connection initiation
        const storedUserId = sessionStorage.getItem("qb_connecting_user");
        
        if (!currentUser && !storedUserId) {
          console.error("No authenticated user found and no stored user ID");
          throw new Error("You must be signed in to complete this process");
        }

        // Use state parameter as userId if available, otherwise use stored ID or current user's ID
        const userId = state || storedUserId || currentUser?.id;
        
        if (!userId) {
          throw new Error("Could not determine user ID for QuickBooks connection");
        }
        
        console.log("Processing callback with code, realmId, and userId", { code, realmId, userId });
        
        // Use the current origin for the redirect URI to ensure it matches what we used for authorization
        const redirectUri = window.location.origin + "/dashboard/quickbooks-callback";

        // Call our edge function to exchange the code for tokens
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
          console.error("Edge function error:", invokeError);
          throw new Error(invokeError.message || "Failed to complete QuickBooks authentication");
        }
        
        if (data?.error) {
          console.error("Error from edge function:", data.error);
          throw new Error(data.error);
        }

        // Clear the stored user ID as we no longer need it
        sessionStorage.removeItem("qb_connecting_user");

        // Make sure to refresh the QuickBooks connection status in our context
        await refreshConnection();
        
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
          description: err.message || "Unable to connect to QuickBooks. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
        setIsCheckingSession(false);
      }
    };

    // Only proceed if we're not still loading auth state
    if (!isAuthLoading) {
      handleCallback();
    }
  }, [location, navigate, user, isAuthLoading, refreshConnection]);

  // Show loading state while checking session
  if (isCheckingSession || isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-600">Checking your session...</p>
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

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
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get URL parameters
        const params = new URLSearchParams(location.search);
        const code = params.get("code");
        const realmId = params.get("realmId");
        const state = params.get("state"); // This should be the userId
        const error = params.get("error");

        if (error) {
          setError(`Authorization error: ${error}`);
          return;
        }

        if (!code) {
          setError("Missing authorization code from QuickBooks");
          return;
        }

        if (!realmId) {
          setError("Missing realm ID from QuickBooks");
          return;
        }

        if (!user) {
          setError("You must be signed in to complete this process");
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        console.log("Processing callback with code, realmId, and state", { code, realmId, state: state || user.id });

        // Call our edge function to exchange the code for tokens
        // We pass the realmId explicitly to ensure it's stored
        const { data, error: invokeError } = await supabase.functions.invoke("quickbooks-auth", {
          body: {
            path: "token",
            code,
            realmId, // Explicitly pass realmId
            redirectUri: window.location.origin + "/dashboard/quickbooks-callback",
            userId: user.id,
          },
        });

        if (invokeError || data?.error) {
          throw new Error(invokeError?.message || data?.error || "Failed to complete authentication");
        }

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

    if (user) {
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
  }, [location, navigate, user]);

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
            <div className="flex justify-center">
              <Button
                onClick={() => navigate("/connect-quickbooks")}
                className="w-full"
              >
                Try Again
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


import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const QuickbooksCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        const error = params.get("error");

        if (error) {
          setError(`Authorization error: ${error}`);
          return;
        }

        if (!code || !realmId) {
          setError("Missing required parameters");
          return;
        }

        if (!user) {
          setError("You must be signed in to complete this process");
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        console.log("QuickBooks callback parameters:", { code, realmId, userId: user.id });
        const redirectUri = window.location.origin + "/dashboard/quickbooks-callback";
        console.log("Using redirect URI:", redirectUri);
        
        // Call our edge function to exchange the code for tokens
        console.log("Calling quickbooks-auth edge function with action 'callback'...");
        const { data, error: invokeError } = await supabase.functions.invoke("quickbooks-auth", {
          body: {
            action: "callback",
            code,
            realmId,
            state: user.id,
            redirectUri: redirectUri,
          },
        });
        
        console.log("Edge function response:", { data, error: invokeError });

        if (invokeError || data?.error) {
          console.error("Authentication error:", invokeError || data?.error);
          throw new Error(invokeError?.message || data?.error || "Failed to complete authentication");
        }

        toast({
          title: "Connection Successful",
          description: "Your QuickBooks account has been connected successfully!",
        });

        // Redirect to dashboard
        navigate("/dashboard");
      } catch (err) {
        console.error("Error processing callback:", err);
        setError("Failed to complete QuickBooks connection. Please try again.");
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
          navigate("/login");
        }
      }, 1000);
      
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
          <div className="p-4 rounded-md bg-red-50 text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => navigate("/connect-quickbooks")}
              className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-md bg-green-50 text-green-700">
            <p className="font-medium">Success!</p>
            <p className="text-sm">
              Your QuickBooks account has been connected successfully. You will be redirected to the dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickbooksCallback;

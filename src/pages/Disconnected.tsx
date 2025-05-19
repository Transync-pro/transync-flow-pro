
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { checkQBConnectionExists } from "@/services/quickbooksApi/connections";

const Disconnected = () => {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { connect, isConnected, isLoading, refreshConnection } = useQuickbooks();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Direct check for QuickBooks connection on mount
  useEffect(() => {
    const checkDirectConnection = async () => {
      if (!user || isConnected) return;
      
      try {
        // Direct database check bypassing the context
        const hasConnection = await checkQBConnectionExists(user.id);
        
        if (hasConnection) {
          console.log("Direct DB check found a connection, refreshing state");
          await refreshConnection();
          
          // Redirect after connection is refreshed
          handleRedirectAfterConnect();
        }
      } catch (error) {
        console.error("Error checking direct connection:", error);
      }
    };
    
    checkDirectConnection();
  }, [user, isConnected, refreshConnection]);
  
  // Check if we should redirect after connecting
  useEffect(() => {
    if (isConnected && !isReconnecting) {
      handleRedirectAfterConnect();
    }
  }, [isConnected]);
  
  // Handle redirection after connecting
  const handleRedirectAfterConnect = () => {
    const redirectPath = sessionStorage.getItem('qb_redirect_after_connect');
    if (redirectPath) {
      sessionStorage.removeItem('qb_redirect_after_connect');
      navigate(redirectPath);
    } else {
      navigate('/dashboard');
    }
  };
  
  // Handle connection
  const handleConnect = async () => {
    try {
      setIsReconnecting(true);
      
      if (!user) {
        navigate('/login', { state: { redirectAfter: '/connect-quickbooks' } });
        return;
      }
      
      await connect();
      // The connect function will handle the redirection to QuickBooks auth
    } catch (error) {
      console.error("Error connecting to QuickBooks:", error);
      setIsReconnecting(false);
    }
  };

  // Handle back button
  const handleBackToHome = () => {
    // Clear any stored redirect path
    sessionStorage.removeItem('qb_redirect_after_connect');
    navigate("/");
  };

  // If we're connected, redirect immediately
  if (isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
            <p className="mt-4 text-gray-600">Connection detected, redirecting...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
          <CardTitle className="text-2xl">QuickBooks Connection Required</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            You need to connect to QuickBooks to access this feature. Please connect your QuickBooks account to continue.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            className="w-full bg-transyncpro-button hover:bg-transyncpro-button/90"
            onClick={handleConnect}
            disabled={isLoading || isReconnecting}
          >
            {isLoading || isReconnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLoading ? "Checking connection..." : "Connecting..."}
              </>
            ) : (
              "Connect to QuickBooks"
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={handleBackToHome}
          >
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Disconnected;

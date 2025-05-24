
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { checkQBConnectionExists, clearConnectionCache } from "@/services/quickbooksApi/connections";
import { toast } from "@/components/ui/use-toast";
import PageLayout from "@/components/PageLayout";

const Disconnected = () => {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const { connect, isConnected, isLoading, refreshConnection } = useQuickbooks();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Track if we've already checked the connection
  const hasCheckedConnection = useRef(false);
  
  // Direct check for QuickBooks connection on mount with optimized approach
  useEffect(() => {
    // Skip if we've already checked the connection, regardless of dependency changes
    if (hasCheckedConnection.current) {
      return;
    }
    
    let isMounted = true;
    
    const checkDirectConnection = async () => {
      if (!user) {
        setIsCheckingConnection(false);
        return;
      }
      
      try {
        // Mark that we've checked the connection to prevent multiple checks
        hasCheckedConnection.current = true;
        
        // Clear any stale cache first
        clearConnectionCache(user.id);
        
        // Now refresh the connection status
        await refreshConnection();
        
        // After refresh, do a direct DB check as well
        const hasConnection = await checkQBConnectionExists(user.id);
        
        if (!isMounted) return;
        
        if (hasConnection || isConnected) {
          console.log("Direct DB check found a connection, redirecting to dashboard");
          // Show success message
          toast({
            title: "QuickBooks Connected",
            description: "Your QuickBooks account is connected. Redirecting to dashboard...",
          });
          
          // Redirect immediately to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          console.log("No QuickBooks connection found");
          // Connection not found, allow display of the connect button
          setIsCheckingConnection(false);
        }
      } catch (error) {
        console.error("Error checking direct connection:", error);
        setIsCheckingConnection(false);
      }
    };
    
    checkDirectConnection();
    
    return () => {
      isMounted = false;
    };
  }, [user, navigate, refreshConnection, isConnected]);
  
  // Handle connection
  const handleConnect = async () => {
    try {
      setIsReconnecting(true);
      
      if (!user) {
        navigate('/login', { state: { redirectAfter: '/connect-quickbooks' } });
        return;
      }
      
      // Clear any stale connection cache before connecting
      clearConnectionCache(user.id);
      
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

  // If we're checking connection or connected, show loading state
  if (isCheckingConnection) {
    return (
      <PageLayout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-4 text-gray-600">
                Checking connection status...
              </p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
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
    </PageLayout>
  );
};

export default Disconnected;

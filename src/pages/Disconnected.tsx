
import { useEffect, useState, useRef } from "react";
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
  const [buttonHover, setButtonHover] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const { connect, isConnected, isLoading, refreshConnection } = useQuickbooks();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Track if we've already checked the connection
  const hasCheckedConnection = useRef(false);
  
  // Simplified connection check for the Disconnected page
  useEffect(() => {
    // If we already know there's no connection (which is likely since we're on this page)
    // or if we've already checked, exit loading state immediately
    if (!isConnected || hasCheckedConnection.current) {
      console.log("Disconnected: Already know there's no connection or already checked");
      setIsCheckingConnection(false);
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
        
        // Guaranteed timeout to ensure we NEVER get stuck in loading state
        setTimeout(() => {
          if (isMounted) {
            setIsCheckingConnection(false);
          }
        }, 2000); // Short 2 second timeout as a safety net
        
        // If isConnected is already false, we don't need a full check
        if (!isConnected) {
          console.log("Disconnected: Context already shows no connection");
          setIsCheckingConnection(false);
          return;
        }
        
        // One quick direct check to be sure
        const hasConnection = await checkQBConnectionExists(user.id);
          
        if (!isMounted) return;
        
        if (hasConnection) {
          console.log("Disconnected: Found connection, redirecting to dashboard");
          toast({
            title: "QuickBooks Connected",
            description: "Your QuickBooks account is connected. Redirecting to dashboard...",
          });
          navigate('/dashboard', { replace: true });
        } else {
          console.log("Disconnected: Confirmed no connection");
          setIsCheckingConnection(false);
        }
      } catch (error) {
        console.error("Error checking connection in Disconnected page:", error);
        // Always ensure we exit loading state
        setIsCheckingConnection(false);
      }
    };
    
    // Very short delay before checking to allow state to settle
    const initTimeout = setTimeout(() => {
      if (isMounted) {
        checkDirectConnection();
      }
    }, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
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
            <button
  className="w-full focus:outline-none disabled:opacity-60"
  onClick={handleConnect}
  disabled={isLoading || isReconnecting}
  aria-label="Connect to QuickBooks"
  style={{ background: 'none', border: 'none', padding: 0 }}
>
  {isLoading || isReconnecting ? (
    <div className="flex items-center justify-center py-2">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      <span>{isLoading ? "Checking connection..." : "Connecting..."}</span>
    </div>
  ) : (
    <img
      src={buttonHover ? "/connecttoquickbooksbutton.png_hover.png" : "/connecttoquickbooksbutton.png"}
      alt="Connect to QuickBooks"
      className="w-full h-auto cursor-pointer"
      draggable="false"
      style={{ pointerEvents: (isLoading || isReconnecting) ? 'none' : 'auto', opacity: (isLoading || isReconnecting) ? 0.6 : 1 }}
      onMouseEnter={() => setButtonHover(true)}
      onMouseLeave={() => setButtonHover(false)}
    />
  )}
</button>
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

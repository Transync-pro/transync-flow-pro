
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthFlow } from "@/services/auth/AuthFlowManager";
import { toast } from "@/components/ui/use-toast";
import PageLayout from "@/components/PageLayout";
import { connectionStatusService } from "@/services/auth/ConnectionStatusService";

const Authenticate = () => {
  const [buttonHover, setButtonHover] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { connect, isLoading } = useQuickbooks();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { connectionStatus, isCheckingConnection, checkConnection } = useAuthFlow();

  // Check connection status when component mounts - but force a fresh check
  useEffect(() => {
    if (user) {
      console.log('Authenticate: Forcing fresh connection check for user:', user.id);
      // Clear any stale cache and force a fresh check
      connectionStatusService.clearCache(user.id);
      checkConnection(user.id);
    }
  }, [user, checkConnection]);

  // Handle navigation based on connection status - but be more careful about when to redirect
  useEffect(() => {
    // Only redirect if we're definitely connected and not in a loading state
    if (connectionStatus === 'connected' && !isCheckingConnection && !isLoading) {
      console.log('Authenticate: User is confirmed connected, redirecting to dashboard');
      toast({
        title: "Already Connected",
        description: "Your QuickBooks account is already connected. Redirecting to dashboard...",
      });
      navigate('/dashboard', { replace: true });
    }
  }, [connectionStatus, isCheckingConnection, isLoading, navigate]);

  const handleConnect = async () => {
    if (!user) {
      navigate('/login', { state: { redirectAfter: '/authenticate' } });
      return;
    }
    
    try {
      setIsConnecting(true);
      console.log('Authenticate: Starting connection process');
      
      // Clear any existing auth flags and connection cache
      sessionStorage.removeItem('qb_auth_success');
      sessionStorage.removeItem('qb_connection_timestamp');
      connectionStatusService.clearCache(user.id);
      
      await connect();
    } catch (error) {
      console.error("Authenticate: Error connecting to QuickBooks:", error);
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: "Failed to start QuickBooks connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  // Show loading state while checking connection
  if (isCheckingConnection) {
    return (
      <PageLayout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-4 text-gray-600">
                Checking your QuickBooks connection...
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
            <CardTitle className="text-2xl">Connect to QuickBooks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Connect your QuickBooks account to access all features and manage your financial data seamlessly.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              <p className="mb-2">
                <strong>What you can do:</strong>
              </p>
              <ul className="text-left space-y-1">
                <li>• Import and export financial data</li>
                <li>• Sync transactions automatically</li>
                <li>• Generate comprehensive reports</li>
                <li>• Manage customers and vendors</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <div className="w-full relative">
              <button
                className="w-full focus:outline-none disabled:opacity-60 h-12 flex items-center justify-center"
                onClick={handleConnect}
                disabled={isLoading || isConnecting}
                aria-label="Connect to QuickBooks"
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                {isLoading || isConnecting ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>{isLoading ? "Checking connection..." : "Connecting..."}</span>
                  </div>
                ) : (
                  <img
                    src={buttonHover ? "/connecttoquickbooksbutton.png_hover.png" : "/connecttoquickbooksbutton.png"}
                    alt="Connect to QuickBooks"
                    className="h-full w-auto max-w-full object-contain"
                    draggable="false"
                    style={{ 
                      pointerEvents: (isLoading || isConnecting) ? 'none' : 'auto', 
                      opacity: (isLoading || isConnecting) ? 0.6 : 1,
                      maxHeight: '48px'
                    }}
                    onMouseEnter={() => setButtonHover(true)}
                    onMouseLeave={() => setButtonHover(false)}
                  />
                )}
              </button>
            </div>
            <div className="w-full flex justify-center">
              <Button
                variant="outline"
                className="w-[280px]"
                onClick={handleBackToHome}
              >
                Back to Home
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Authenticate;


import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import PageLayout from "@/components/PageLayout";
import { connectionStatusService } from "@/services/auth/ConnectionStatusService";

const Authenticate = () => {
  const [buttonHover, setButtonHover] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { isConnected, isLoading, checkConnection } = useQuickbooks();
  const { user } = useAuth();
  const navigate = useNavigate();
  const popupRef = useRef<Window | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  // Check connection status when component mounts
  useEffect(() => {
    if (user && !isConnected) {
      console.log('Authenticate: Checking initial connection status');
      checkConnection(true);
    }
  }, [user, checkConnection, isConnected]);

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected && !isLoading) {
      console.log('Authenticate: User is connected, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isConnected, isLoading, navigate]);

  // Listen for successful authentication from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our domain
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'QB_AUTH_SUCCESS') {
        console.log('Authenticate: Received auth success from popup');
        
        // Close popup
        if (popupRef.current) {
          popupRef.current.close();
          popupRef.current = null;
        }
        
        // Clear any checking intervals
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
        
        setIsConnecting(false);
        
        // Show success message
        toast({
          title: "Successfully Connected!",
          description: `Connected to ${event.data.companyName || 'QuickBooks'}`,
        });
        
        // Force refresh connection status and navigate
        connectionStatusService.markAsConnected(user!.id, event.data.companyName);
        
        // Small delay to let state update, then navigate
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      } else if (event.data.type === 'QB_AUTH_ERROR') {
        console.error('Authenticate: Received auth error from popup:', event.data.error);
        
        // Close popup
        if (popupRef.current) {
          popupRef.current.close();
          popupRef.current = null;
        }
        
        // Clear any checking intervals
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
        
        setIsConnecting(false);
        
        toast({
          title: "Connection Failed",
          description: event.data.error || "Failed to connect to QuickBooks",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user, navigate]);

  const handleConnect = async () => {
    if (!user) {
      navigate('/login', { state: { redirectAfter: '/authenticate' } });
      return;
    }
    
    try {
      setIsConnecting(true);
      console.log('Authenticate: Opening QuickBooks OAuth in popup');
      
      // Get the current URL to use as a base for the redirect URI
      const baseUrl = window.location.origin;
      const redirectUrl = `${baseUrl}/dashboard/quickbooks-callback`;
      
      // Build the OAuth URL manually to open in popup
      const authUrl = `/api/quickbooks-auth?path=authorize&redirectUri=${encodeURIComponent(redirectUrl)}&userId=${user.id}`;
      
      // Open popup
      const popup = window.open(
        authUrl,
        'quickbooks-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
      );
      
      if (!popup) {
        throw new Error('Failed to open popup. Please allow popups for this site.');
      }
      
      popupRef.current = popup;
      
      // Check if popup was closed manually
      checkIntervalRef.current = setInterval(() => {
        if (popup.closed) {
          console.log('Authenticate: Popup was closed manually');
          setIsConnecting(false);
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
          }
        }
      }, 1000);
      
    } catch (error: any) {
      console.error("Authenticate: Error starting connection:", error);
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to start QuickBooks connection",
        variant: "destructive",
      });
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  // Show loading state while checking connection
  if (isLoading) {
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
                {isConnecting ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Opening QuickBooks...</span>
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

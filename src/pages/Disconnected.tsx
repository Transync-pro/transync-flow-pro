
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Disconnected = () => {
  const { connect, isConnected, isLoading } = useQuickbooks();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if we should redirect after connecting
  useEffect(() => {
    if (isConnected) {
      const redirectPath = sessionStorage.getItem('qb_redirect_after_connect');
      if (redirectPath) {
        sessionStorage.removeItem('qb_redirect_after_connect');
        navigate(redirectPath);
      } else {
        navigate('/dashboard');
      }
    }
  }, [isConnected, navigate]);
  
  // Handle connection
  const handleConnect = async () => {
    try {
      if (!user) {
        navigate('/login', { state: { redirectAfter: '/connect-quickbooks' } });
        return;
      }
      
      await connect();
      // The connect function will handle the redirection to QuickBooks auth
    } catch (error) {
      console.error("Error connecting to QuickBooks:", error);
    }
  };

  // Handle back button
  const handleBackToHome = () => {
    // Clear any stored redirect path
    sessionStorage.removeItem('qb_redirect_after_connect');
    navigate("/");
  };

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
            disabled={isLoading}
          >
            {isLoading ? "Connecting..." : "Connect to QuickBooks"}
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

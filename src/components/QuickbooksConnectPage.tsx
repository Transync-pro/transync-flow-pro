import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Link, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const QuickbooksConnectPage = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { connect, isConnected, isLoading } = useQuickbooks();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If already connected, redirect to dashboard
    if (isConnected && !isLoading) {
      navigate('/dashboard');
    }
  }, [isConnected, isLoading, navigate]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
      // Note: navigation happens in the callback or on page refresh
    } catch (error) {
      setIsConnecting(false);
      toast({
        title: "Connection failed",
        description: "Unable to connect to QuickBooks. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <p className="text-gray-600 text-center">
              Checking your QuickBooks connection status...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Connect to QuickBooks</CardTitle>
          <CardDescription className="text-center">
            Connect your QuickBooks account to start importing, exporting, and managing your data.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <img 
              src="/Connect to QuickBooks Button.svg" 
              alt="QuickBooks Connect" 
              className="h-20" 
            />
          </div>
          
          <div className="text-sm text-gray-600 space-y-3">
            <p>
              TransyncPro integrates with QuickBooks Online to help you manage your financial data more efficiently.
            </p>
            
            <p>
              By connecting your account, you'll be able to:
            </p>
            
            <ul className="list-disc pl-6 space-y-1">
              <li>Import data from spreadsheets directly to QuickBooks</li>
              <li>Export QuickBooks data for analysis or backup</li>
              <li>Bulk update or delete records when needed</li>
            </ul>
            
            <p className="font-medium">
              Your data is secure. TransyncPro follows OAuth 2.0 protocol and never stores your QuickBooks password.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center pt-2">
          <Button 
            onClick={handleConnect}
            className="w-full flex items-center justify-center bg-transyncpro-button hover:bg-transyncpro-button/90"
            disabled={isConnecting}
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Link className="mr-2 h-5 w-5" />
                Connect to QuickBooks
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {user && (
        <p className="mt-6 text-sm text-gray-500">
          Signed in as: <span className="font-medium">{user.email}</span>
        </p>
      )}
    </div>
  );
};

export default QuickbooksConnectPage;


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useAuth } from "@/contexts/AuthContext";
import PageLayout from "@/components/PageLayout";
import { LogOut, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Disconnected = () => {
  const { isConnected, isLoading, connect, disconnect, error } = useQuickbooks();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connectClicked, setConnectClicked] = useState(false);

  useEffect(() => {
    // If already connected, redirect to dashboard
    if (isConnected && !connectClicked) {
      navigate('/dashboard');
    }
  }, [isConnected, navigate, connectClicked]);

  const handleConnect = async () => {
    setConnectClicked(true);
    try {
      await connect();
    } catch (err) {
      console.error("Connection error:", err);
      setConnectClicked(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account."
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out.",
        variant: "destructive"
      });
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold gradient-text">QuickBooks Connection</h1>
            <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut size={16} />
              Sign Out
            </Button>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Connect to QuickBooks</CardTitle>
              <CardDescription>
                TransyncPro needs to connect to your QuickBooks account to function properly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Connection Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              <div className="p-6 text-center">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Intuit_QuickBooks_logo.svg/1200px-Intuit_QuickBooks_logo.svg.png" 
                  alt="QuickBooks Logo" 
                  className="h-16 mx-auto mb-4"
                />
                <p className="mb-4">
                  You need to connect TransyncPro to your QuickBooks account to continue. This will allow TransyncPro to access your QuickBooks data securely.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                onClick={handleConnect} 
                disabled={isLoading || connectClicked}
                className="bg-transyncpro-button hover:bg-transyncpro-button/90 text-white px-8"
              >
                {isLoading || connectClicked ? "Connecting..." : "Connect to QuickBooks"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Disconnected;

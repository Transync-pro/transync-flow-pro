import { useState } from "react";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertCircle, CheckCircle, Link, LogOut } from "lucide-react";
import { format } from "date-fns";

const QuickbooksConnect = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  const {
    connection,
    isLoading,
    error,
    connect: connectToQuickbooks,
    disconnect: disconnectQuickbooks,
    isConnected,
  } = useQuickbooks();

  const { user } = useAuth();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectToQuickbooks();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectQuickbooks();
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="ml-3 text-sm text-gray-500">Checking connection status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">QuickBooks Integration</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isConnected ? (
        <div>
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700">Connected to QuickBooks</AlertTitle>
            <AlertDescription className="text-green-700">
              <div className="mt-2 space-y-2">
                <p>Company ID: {connection?.realm_id}</p>
                <p>Connected until: {format(new Date(connection?.expires_at || ""), "PPP pp")}</p>
                {user && <p>Connected as: {user.email}</p>}
              </div>
            </AlertDescription>
          </Alert>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="mt-2 flex items-center"
                variant="outline"
                disabled={isDisconnecting}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isDisconnecting ? "Disconnecting..." : "Disconnect QuickBooks"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect from QuickBooks?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove your connection to QuickBooks. You'll need to re-authenticate to use QuickBooks features again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDisconnect}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-gray-600">
            Connect your QuickBooks account to enable importing, exporting, and managing your QuickBooks data.
          </p>
          <Button
            onClick={handleConnect}
            className="flex items-center"
            disabled={isConnecting}
          >
            <Link className="mr-2 h-4 w-4" />
            {isConnecting ? "Connecting..." : "Connect to QuickBooks"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuickbooksConnect;

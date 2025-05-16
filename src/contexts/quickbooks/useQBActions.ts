
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const useQBActions = (
  user: User | null,
  refreshConnection: () => Promise<void>,
  handleError: (error: string, displayToast?: boolean) => string
) => {
  // Start OAuth flow to connect to QuickBooks
  const connect = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in before connecting to QuickBooks",
        variant: "destructive",
      });
      return;
    }

    try {
      // Store the user ID in session storage in case we lose auth state during the OAuth flow
      sessionStorage.setItem("qb_connecting_user", user.id);
      
      // Determine the appropriate redirect URL
      const redirectUrl = `${window.location.origin}/dashboard/quickbooks-callback`;
      
      console.log("Starting QuickBooks OAuth flow, redirecting to", redirectUrl);
      console.log("User ID for connection:", user.id);
      
      // Call the edge function to get authorization URL
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { 
          path: 'authorize',
          redirectUri: redirectUrl,
          userId: user.id 
        }
      });

      if (error) {
        console.error("Edge function invocation error:", error);
        throw error;
      }
      
      if (data.error) {
        console.error("Error from edge function:", data.error);
        throw new Error(data.error);
      }
      
      if (data && data.authUrl) {
        console.log("Received authorization URL, redirecting user...");
        // Redirect user to QuickBooks authorization page
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error: any) {
      console.error("Error in connect flow:", error);
      handleError(`Failed to initiate QuickBooks connection: ${error.message || "Unknown error"}`, true);
    }
  };

  // Disconnect from QuickBooks
  const disconnect = async () => {
    if (!user) return;

    try {
      console.log("Attempting to disconnect QuickBooks for user:", user.id);
      
      // Call the edge function to revoke the token
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { 
          path: 'revoke',
          userId: user.id
        }
      });
      
      if (error) {
        console.error("Error revoking QuickBooks tokens:", error);
        throw error;
      }
      
      if (data && data.error) {
        console.error("Error from revoke endpoint:", data.error);
        throw new Error(data.error);
      }
      
      console.log("QuickBooks disconnection successful, refreshing connection status...");
      
      // Refresh the connection status
      await refreshConnection();
      
      toast({
        title: "Disconnected",
        description: "QuickBooks account has been disconnected successfully",
      });
      
    } catch (error: any) {
      console.error("Error in disconnect flow:", error);
      handleError(`Failed to disconnect from QuickBooks: ${error.message || "Unknown error"}`, true);
    }
  };

  return { connect, disconnect };
};

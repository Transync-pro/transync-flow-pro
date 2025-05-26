
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { clearConnectionCache, forceConnectionState } from "@/services/quickbooksApi/connections";
import { navigationController } from "@/services/navigation/NavigationController";

export const useQBActions = (
  user: User | null,
  refreshConnection: () => Promise<void>,
  handleError: (error: string, displayToast?: boolean) => string,
  navigate?: (path: string, options?: any) => void
) => {
  // Clear all QuickBooks-related session storage items
  const clearQBSessionData = () => {
    const qbItems = [
      'qb_connection_data',
      'qb_connection_success',
      'qb_connection_company',
      'qb_redirected_to_authenticate',
      'qb_connecting_user',
      'qb_connection_in_progress',
      'qb_auth_timestamp',
      'processed_qb_codes',
      'qb_auth_success',
      'qb_connect_user',
      'qb_connection_verified',
      'qb_connection_timestamp',
      'qb_disconnected',
      'qb_disconnect_timestamp'
    ];
    
    qbItems.forEach(key => sessionStorage.removeItem(key));
    console.log('Cleared all QB session storage items before starting authentication');
  };

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
      // Clear all QuickBooks session data before starting a new authentication flow
      clearQBSessionData();
      
      // Store the user ID in session storage in case we lose auth state during the OAuth flow
      sessionStorage.setItem("qb_connecting_user", user.id);
      
      // Get the current URL to use as a base for the redirect URI
      // Use window.location.origin to ensure we get the correct protocol and domain
      const baseUrl = window.location.origin;
      
      // Construct the redirect URL using the base URL
      const redirectUrl = `${baseUrl}/dashboard/quickbooks-callback`;
      
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
      
      // Use our comprehensive clear function instead of individual removals
      clearQBSessionData();
      
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
        // Handle non-critical error: Continue with database cleanup even if token revocation fails
        console.log('User successfully disconnected from QuickBooks');
      }
      
      // Clear all QuickBooks related session storage
      clearConnectionCache(user.id);
      
      // Force the connection state to be false for this user for 10 seconds
      // This overrides any database checks during the critical navigation period
      forceConnectionState(user.id, false, 10000); // 10 seconds of forced disconnected state
      console.log(`Forced connection state to false for user ${user.id} after disconnection`);
      
      console.log("QuickBooks disconnection process completed, refreshing connection status...");
      
      // Refresh the connection status
      refreshConnection && refreshConnection();
      
      // Use NavigationController to handle the disconnect navigation
      // This provides centralized navigation control and prevents competing redirects
      if (navigate) {
        console.log('Using NavigationController to handle disconnection navigation');
        navigationController.handleDisconnect(user.id, navigate);
      }
      
      toast({
        title: "Disconnected",
        description: "QuickBooks account has been disconnected successfully",
      });
      
    } catch (error: any) {
      console.error("Error in disconnect flow:", error);
      handleError(`Failed to disconnect from QuickBooks: ${error.message || "Unknown error"}`, true);
      
      // Still try to clear critical flags even if there was an error
      sessionStorage.removeItem('qb_redirected_to_authenticate');
      sessionStorage.removeItem('qb_connection_verified');
    }
  };

  return { connect, disconnect };
};

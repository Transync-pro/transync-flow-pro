
import { QuickbooksConnection } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { isStaging } from "@/config/environment";

export const useQBTokenManagement = (
  connection: QuickbooksConnection | null,
  refreshConnection: () => Promise<void>,
  handleError: (error: string, displayToast?: boolean) => string
) => {
  // Get the correct edge function name based on environment
  const getEdgeFunctionName = () => {
    return isStaging() ? 'quickbooks-auth-staging' : 'quickbooks-auth';
  };

  // Refresh the access token
  const refreshToken = async (refreshTokenStr: string): Promise<string | null> => {
    if (!connection?.user_id) return null;
    
    try {
      console.log("Refreshing token using edge function:", getEdgeFunctionName());
      
      const { data, error } = await supabase.functions.invoke(getEdgeFunctionName(), {
        body: { 
          path: 'refresh',
          userId: connection.user_id,
          refreshToken: refreshTokenStr
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      // Update our local state with the new tokens
      await refreshConnection();
      
      return data.accessToken;
    } catch (error: any) {
      handleError(`Error refreshing QuickBooks token: ${error.message || "Unknown error"}`, true);
      return null;
    }
  };

  // Get access token for API calls
  const getAccessToken = async (): Promise<string | null> => {
    if (!connection) return null;

    try {
      // Check if token needs refreshing
      const expiresAt = new Date(connection.expires_at);
      const now = new Date();
      
      if ((expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000) {
        // Token is expired or about to expire, refresh it
        return await refreshToken(connection.refresh_token);
      }
      
      // Token is still valid
      return connection.access_token;
    } catch (error: any) {
      handleError(`Error getting access token: ${error.message || "Unknown error"}`, false);
      return null;
    }
  };

  return { refreshToken, getAccessToken };
};

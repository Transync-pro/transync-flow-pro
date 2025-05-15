
import { QuickbooksConnection } from "../QuickbooksContext";
import { supabase } from "@/integrations/supabase/client";

export const useQBTokenManagement = (
  connection: QuickbooksConnection | null,
  refreshConnection: () => Promise<void>
) => {
  // Refresh the access token
  const refreshToken = async (refreshTokenStr: string): Promise<string | null> => {
    if (!connection?.user_id) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
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
    } catch (error) {
      console.error("Error refreshing QuickBooks token:", error);
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
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  };

  return { refreshToken, getAccessToken };
};

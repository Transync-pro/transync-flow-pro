
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";

export const useQBActions = (
  user: User | null,
  refreshConnection: () => Promise<void>
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
      // Determine the appropriate redirect URL
      const redirectUrl = `${window.location.origin}/dashboard/quickbooks-callback`;
      
      // Call the edge function to get authorization URL
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { 
          path: 'authorize',
          redirectUri: redirectUrl,
          userId: user.id 
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      if (data && data.authUrl) {
        // Redirect user to QuickBooks authorization page
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error) {
      console.error("Error connecting to QuickBooks:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to initiate QuickBooks connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Disconnect from QuickBooks
  const disconnect = async () => {
    if (!user) return;

    try {
      // Call the edge function to revoke the token
      const { error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { 
          path: 'revoke',
          userId: user.id
        }
      });
      
      if (error) throw error;
      
      // Refresh the connection status
      await refreshConnection();
      
      toast({
        title: "Disconnected",
        description: "QuickBooks account has been disconnected successfully",
      });
      
    } catch (error) {
      console.error("Error disconnecting from QuickBooks:", error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect from QuickBooks. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { connect, disconnect };
};

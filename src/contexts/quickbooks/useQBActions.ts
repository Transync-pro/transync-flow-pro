
import { useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { initQBAuth, disconnectQB } from "@/services/quickbooksApi/connections";
import { navigateWithEnvironment } from "@/config/environment";
import { useNavigate } from "react-router-dom";

export const useQBActions = (
  user: User | null,
  refreshConnection: (force?: boolean, silent?: boolean) => Promise<void>,
  handleError: (error: string) => void
) => {
  const navigate = useNavigate();

  const connect = useCallback(async (): Promise<void> => {
    if (!user) {
      throw new Error("User must be logged in to connect to QuickBooks");
    }

    try {
      console.log('Initiating QuickBooks connection for user:', user.id);
      await initQBAuth(user.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error('QuickBooks connection failed:', errorMessage);
      handleError(`Connection failed: ${errorMessage}`);
      throw error;
    }
  }, [user, handleError]);

  const disconnect = useCallback(async (): Promise<void> => {
    if (!user) {
      throw new Error("User must be logged in to disconnect from QuickBooks");
    }

    try {
      console.log('Disconnecting QuickBooks for user:', user.id);
      await disconnectQB(user.id);
      await refreshConnection(true);
      
      // Navigate to authenticate page after disconnect using environment-aware navigation
      const authenticatePath = navigateWithEnvironment('/authenticate');
      console.log('Navigating to authenticate after disconnect with path:', authenticatePath);
      navigate(authenticatePath, { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error('QuickBooks disconnection failed:', errorMessage);
      handleError(`Disconnection failed: ${errorMessage}`);
      throw error;
    }
  }, [user, refreshConnection, handleError, navigate]);

  return {
    connect,
    disconnect
  };
};

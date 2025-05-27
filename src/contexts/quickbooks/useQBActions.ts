
import { useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { initQBAuth, disconnectQB } from "@/services/quickbooksApi/connections";

export const useQBActions = (
  user: User | null,
  refreshConnection: (force?: boolean, silent?: boolean) => Promise<void>,
  handleError: (error: string) => void
) => {
  const connect = useCallback(async (): Promise<void> => {
    if (!user) {
      throw new Error("User must be logged in to connect to QuickBooks");
    }

    try {
      await initQBAuth(user.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      handleError(`Connection failed: ${errorMessage}`);
      throw error;
    }
  }, [user, handleError]);

  const disconnect = useCallback(async (): Promise<void> => {
    if (!user) {
      throw new Error("User must be logged in to disconnect from QuickBooks");
    }

    try {
      await disconnectQB(user.id);
      await refreshConnection(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      handleError(`Disconnection failed: ${errorMessage}`);
      throw error;
    }
  }, [user, refreshConnection, handleError]);

  return {
    connect,
    disconnect
  };
};

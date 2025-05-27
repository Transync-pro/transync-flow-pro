
import { useCallback } from "react";
import { QuickbooksConnection } from "./types";
import { refreshQBToken } from "@/services/quickbooksApi/connections";

export const useQBTokenManagement = (
  connection: QuickbooksConnection | null,
  refreshConnection: (force?: boolean, silent?: boolean) => Promise<void>,
  handleError: (error: string) => void
) => {
  const refreshToken = useCallback(async (): Promise<void> => {
    if (!connection) {
      throw new Error("No connection available for token refresh");
    }

    try {
      await refreshQBToken(connection.user_id);
      await refreshConnection(true, true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      handleError(`Token refresh failed: ${errorMessage}`);
      throw error;
    }
  }, [connection, refreshConnection, handleError]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!connection) return null;

    try {
      // Check if token is expired (with 5 minute buffer)
      const expiresAt = new Date(connection.expires_at);
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (expiresAt.getTime() - now.getTime() < bufferTime) {
        console.log("Token is expired or expiring soon, refreshing...");
        await refreshToken();
        // After refresh, we need to get the updated connection
        await refreshConnection(true, true);
      }

      return connection.access_token;
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  }, [connection, refreshToken, refreshConnection]);

  return {
    refreshToken,
    getAccessToken
  };
};

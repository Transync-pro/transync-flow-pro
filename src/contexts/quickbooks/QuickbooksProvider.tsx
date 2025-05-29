
import React, { createContext, useContext, ReactNode, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { QuickbooksConnection, QuickbooksContextType } from "./types";
import { useQBConnectionStatus } from "./useQBConnectionStatus";
import { useQBTokenManagement } from "./useQBTokenManagement";
import { useQBActions } from "./useQBActions";
import { useQBErrors } from "./useQBErrors";
import { useQBConnectionManager } from './useQBConnectionManager';

const QuickbooksContext = createContext<QuickbooksContextType | null>(null);

export const useQuickbooks = () => {
  const context = useContext(QuickbooksContext);
  if (!context) {
    throw new Error("useQuickbooks must be used within a QuickbooksProvider");
  }
  return context;
};

interface QuickbooksProviderProps {
  children: ReactNode;
  user: User | null;
}

export const QuickbooksProvider: React.FC<QuickbooksProviderProps> = ({ children, user }) => {
  // Use custom hooks for different aspects of QuickBooks functionality
  const { 
    isConnected, 
    isLoading, 
    connection, 
    realmId, 
    companyName, 
    refreshConnection 
  } = useQBConnectionStatus(user);
  
  const { error, handleError, clearError } = useQBErrors();
  const { connectionState, lastChecked, checkConnectionWithRetry } = useQBConnectionManager(user);
  
  const { refreshToken, getAccessToken } = useQBTokenManagement(
    connection,
    async (force?: boolean, silent?: boolean) => {
      await refreshConnection(force, silent);
    },
    handleError
  );
  
  const { connect, disconnect } = useQBActions(
    user,
    async (force?: boolean, silent?: boolean) => {
      await refreshConnection(force, silent);
    },
    handleError
  );

  // Get realm ID for API calls
  const getRealmId = useCallback(async (): Promise<string | null> => {
    return realmId;
  }, [realmId]);

  // Expose the checkConnectionStatus function from useQBConnectionStatus
  const checkConnection = useCallback(async (force?: boolean, silent?: boolean): Promise<void> => {
    await refreshConnection(force, silent);
  }, [refreshConnection]);

  const value: QuickbooksContextType = {
    isConnected,
    isLoading,
    connection,
    realmId,
    companyName,
    error,
    connect,
    disconnect,
    getAccessToken,
    refreshToken: refreshToken as unknown as () => Promise<void>,
    getRealmId,
    clearError,
    refreshConnection: async (force?: boolean, silent?: boolean) => {
      await refreshConnection(force, silent);
    },
    checkConnection,
    // New properties
    connectionState,
    lastChecked,
    checkConnectionWithRetry
  };

  return (
    <QuickbooksContext.Provider value={value}>
      {children}
    </QuickbooksContext.Provider>
  );
};

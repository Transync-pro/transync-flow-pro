
import React, { createContext, useContext, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { QuickbooksConnection, QuickbooksContextType } from "./types";
import { useQBConnectionStatus } from "./useQBConnectionStatus";
import { useQBTokenManagement } from "./useQBTokenManagement";
import { useQBActions } from "./useQBActions";
import { useQBErrors } from "./useQBErrors";

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
  const getRealmId = async (): Promise<string | null> => {
    return realmId;
  };

  // Expose the checkConnectionStatus function from useQBConnectionStatus
  const checkConnection = async (force?: boolean, silent?: boolean): Promise<void> => {
    await refreshConnection(force, silent);
  };

  const value: QuickbooksContextType = {
    isConnected,
    isLoading,
    realmId,
    companyName,
    connection,
    error,
    connect,
    disconnect,
    getAccessToken,
    getRealmId,
    clearError,
    refreshConnection: async (force?: boolean, silent?: boolean) => {
      await refreshConnection(force, silent);
    },
    checkConnection
  };

  // Reduce logging frequency to avoid console spam
  if (process.env.NODE_ENV !== 'production') {
    console.log('QuickBooks context state:', { 
      isConnected, 
      isLoading,
      realmId: realmId ? 'present' : 'null',
      companyName 
    });
  }

  return (
    <QuickbooksContext.Provider value={value}>
      {children}
    </QuickbooksContext.Provider>
  );
};

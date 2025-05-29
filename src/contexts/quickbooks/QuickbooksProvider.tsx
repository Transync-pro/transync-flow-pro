
import React, { createContext, useContext, ReactNode, useCallback, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { QuickbooksConnection, QuickbooksContextType } from "./types";
import { useQBTokenManagement } from "./useQBTokenManagement";
import { useQBActions } from "./useQBActions";
import { useQBErrors } from "./useQBErrors";
import { connectionStatusService } from '@/services/auth/ConnectionStatusService';
import { useAuthFlow } from '@/services/auth/AuthFlowManager';

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

// Map AuthFlowState to our expected connection state type
const mapAuthFlowStateToConnectionState = (authFlowState: string) => {
  switch (authFlowState) {
    case 'connected':
      return 'connected';
    case 'disconnected':
      return 'disconnected';
    case 'connecting':
    case 'authenticating':
      return 'connecting';
    case 'error':
      return 'error';
    default:
      return 'idle';
  }
};

export const QuickbooksProvider: React.FC<QuickbooksProviderProps> = ({ children, user }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connection, setConnection] = useState<QuickbooksConnection | null>(null);
  const [realmId, setRealmId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  const { error, handleError, clearError } = useQBErrors();
  const { connectionStatus } = useAuthFlow();

  // Subscribe to connection status changes
  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      setIsLoading(false);
      setConnection(null);
      setRealmId(null);
      setCompanyName(null);
      setLastChecked(null);
      return;
    }

    const unsubscribe = connectionStatusService.subscribe((userId, info) => {
      if (userId === user.id) {
        setIsConnected(info.status === 'connected');
        setIsLoading(info.status === 'checking');
        setLastChecked(info.lastChecked);
        setCompanyName(info.companyName || null);
        
        if (info.error) {
          handleError(info.error);
        }
      }
    });

    // Initial check
    connectionStatusService.checkConnectionStatus(user.id);

    return unsubscribe;
  }, [user, handleError]);

  const { refreshToken, getAccessToken } = useQBTokenManagement(
    connection,
    async () => {
      if (user) {
        await connectionStatusService.checkConnectionStatus(user.id, true);
      }
    },
    handleError
  );

  const { connect, disconnect } = useQBActions(
    user,
    async () => {
      if (user) {
        await connectionStatusService.checkConnectionStatus(user.id, true);
      }
    },
    handleError
  );

  const refreshConnection = useCallback(async (force = true, silent = false) => {
    if (!user) return;
    
    if (!silent) {
      setIsLoading(true);
    }
    
    try {
      await connectionStatusService.checkConnectionStatus(user.id, force);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [user]);

  const checkConnection = useCallback(async (force = false, silent = false) => {
    if (!user) return;
    await refreshConnection(force, silent);
  }, [user, refreshConnection]);

  const getRealmId = useCallback(async (): Promise<string | null> => {
    return realmId;
  }, [realmId]);

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
    refreshConnection,
    checkConnection,
    connectionState: mapAuthFlowStateToConnectionState(connectionStatus),
    lastChecked,
    checkConnectionWithRetry: async () => {
      if (user) {
        return connectionStatusService.checkConnectionStatus(user.id, true);
      }
      return false;
    }
  };

  return (
    <QuickbooksContext.Provider value={value}>
      {children}
    </QuickbooksContext.Provider>
  );
};

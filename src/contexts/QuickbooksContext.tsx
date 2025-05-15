
// src/contexts/auth/QuickbooksContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQBConnectionStatus } from "./quickbooks/useQBConnectionStatus";
import { useQBTokenManagement } from "./quickbooks/useQBTokenManagement";
import { useQBActions } from "./quickbooks/useQBActions";

export interface QuickbooksConnection {
  id: string;
  user_id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  created_at: string;
  expires_at: string;
  company_name?: string;
  token_type: string;
  updated_at: string;
}

export interface QuickbooksContextType {
  isConnected: boolean;
  isLoading: boolean;
  realmId: string | null;
  companyName: string | null;
  connection: QuickbooksConnection | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getRealmId: () => Promise<string | null>;
}

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
}

export const QuickbooksProvider: React.FC<QuickbooksProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Use our custom hooks for different aspects of QuickBooks functionality
  const { 
    isConnected, 
    isLoading, 
    connection, 
    realmId, 
    companyName, 
    error, 
    refreshConnection 
  } = useQBConnectionStatus(user);
  
  const { refreshToken, getAccessToken } = useQBTokenManagement(connection, refreshConnection);
  
  const { connect, disconnect } = useQBActions(user, refreshConnection);

  // Get realm ID for API calls
  const getRealmId = async (): Promise<string | null> => {
    return realmId;
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
  };

  return (
    <QuickbooksContext.Provider value={value}>
      {children}
    </QuickbooksContext.Provider>
  );
};

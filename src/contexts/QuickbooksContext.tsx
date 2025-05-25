
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface QuickbooksContextType {
  isConnected: boolean;
  isLoading: boolean;
  realmId: string | null;
  companyName: string | null;
  refreshConnection: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const QuickbooksContext = createContext<QuickbooksContextType | null>(null);

export const useQuickbooks = () => {
  const context = useContext(QuickbooksContext);
  if (!context) {
    throw new Error('useQuickbooks must be used within a QuickbooksProvider');
  }
  return context;
};

export const QuickbooksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [realmId, setRealmId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const { user } = useAuth();

  console.log("QuickbooksProvider: Rendering with user:", user?.id);

  const refreshConnection = useCallback(async () => {
    if (!user) {
      console.log("QuickbooksProvider: No user, setting not connected");
      setIsConnected(false);
      setRealmId(null);
      setCompanyName(null);
      setIsLoading(false);
      return;
    }

    try {
      console.log("QuickbooksProvider: Checking connection for user:", user.id);
      
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .select('realm_id, company_name, access_token, refresh_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('QuickbooksProvider: Error fetching connection:', error);
        setIsConnected(false);
        setRealmId(null);
        setCompanyName(null);
      } else if (data) {
        console.log("QuickbooksProvider: Connection found:", data);
        setIsConnected(true);
        setRealmId(data.realm_id);
        setCompanyName(data.company_name);
      } else {
        console.log("QuickbooksProvider: No connection found");
        setIsConnected(false);
        setRealmId(null);
        setCompanyName(null);
      }
    } catch (error) {
      console.error('QuickbooksProvider: Exception while checking connection:', error);
      setIsConnected(false);
      setRealmId(null);
      setCompanyName(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const disconnect = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('quickbooks_connections')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error disconnecting QuickBooks:', error);
        toast({
          title: "Error",
          description: "Failed to disconnect QuickBooks",
          variant: "destructive"
        });
      } else {
        setIsConnected(false);
        setRealmId(null);
        setCompanyName(null);
        toast({
          title: "Success",
          description: "QuickBooks disconnected successfully"
        });
      }
    } catch (error) {
      console.error('Exception while disconnecting:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect QuickBooks",
        variant: "destructive"
      });
    }
  }, [user]);

  useEffect(() => {
    console.log("QuickbooksProvider: useEffect triggered, user:", user?.id);
    refreshConnection();
  }, [refreshConnection]);

  // Log state changes
  useEffect(() => {
    console.log("QuickBooks context state:", {
      isConnected,
      isLoading,
      realmId: realmId || "null",
      companyName
    });
  }, [isConnected, isLoading, realmId, companyName]);

  const value = {
    isConnected,
    isLoading,
    realmId,
    companyName,
    refreshConnection,
    disconnect,
  };

  return (
    <QuickbooksContext.Provider value={value}>
      {children}
    </QuickbooksContext.Provider>
  );
};

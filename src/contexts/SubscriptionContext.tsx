
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface SubscriptionData {
  subscription_status: string;
  trial_days_left: number;
  trial_end_date: string;
  plan_name?: string;
}

interface SubscriptionContextType {
  subscriptionData: SubscriptionData | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  isTrialExpired: boolean;
  isOnTrial: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const refreshSubscription = async () => {
    if (!user) {
      setSubscriptionData(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('check_trial_status', {
        user_id: user.id
      });

      if (error) {
        console.error("Error checking trial status:", error);
        return;
      }

      if (data && data.length > 0) {
        setSubscriptionData(data[0]);
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [user]);

  const isTrialExpired = subscriptionData?.subscription_status === 'expired';
  const isOnTrial = subscriptionData?.subscription_status === 'trial';

  const value = {
    subscriptionData,
    isLoading,
    refreshSubscription,
    isTrialExpired,
    isOnTrial,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

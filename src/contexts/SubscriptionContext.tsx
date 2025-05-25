import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('check_trial_status', { user_id: user.id });
    setStatus(data && data.length > 0 ? data[0] : null);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user]);

  return (
    <SubscriptionContext.Provider value={{
      subscriptionStatus: status?.subscription_status,
      trialDaysLeft: status?.trial_days_left,
      trialEndDate: status?.trial_end_date,
      isTrialExpired: status?.subscription_status === 'expired',
      isOnTrial: status?.subscription_status === 'trial',
      loading,
      refresh,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);

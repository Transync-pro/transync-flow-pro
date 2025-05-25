
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useState } from "react";

interface UseTrialAccessReturn {
  hasAccess: boolean;
  showUpgradeModal: () => void;
  upgradeModalOpen: boolean;
  setUpgradeModalOpen: (open: boolean) => void;
}

export const useTrialAccess = (): UseTrialAccessReturn => {
  const { subscriptionData, isTrialExpired } = useSubscription();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const hasAccess = !isTrialExpired && (
    subscriptionData?.subscription_status === 'trial' ||
    subscriptionData?.subscription_status === 'active'
  );

  const showUpgradeModal = () => {
    if (isTrialExpired) {
      setUpgradeModalOpen(true);
    }
  };

  return {
    hasAccess,
    showUpgradeModal,
    upgradeModalOpen,
    setUpgradeModalOpen,
  };
};

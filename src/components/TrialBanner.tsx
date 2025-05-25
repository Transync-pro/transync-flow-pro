import { useSubscription } from "@/contexts/SubscriptionContext";
import { Link } from "react-router-dom";

const TrialBanner = () => {
  const { isOnTrial, trialDaysLeft, isTrialExpired } = useSubscription();
  if (isOnTrial) return <div>Your trial ends in {trialDaysLeft} days.</div>;
  if (isTrialExpired) return <div>Your trial has expired. <Link to="/subscription">Subscribe now</Link></div>;
  return null;
};
export default TrialBanner;

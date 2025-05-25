import { useSubscription } from "@/contexts/SubscriptionContext";
import { Link } from "react-router-dom";

const TrialBanner = () => {
  const { isOnTrial, trialDaysLeft, isTrialExpired, planName } = useSubscription();
  if (isOnTrial) return (
    <div style={{ background: '#e0f7fa', padding: '12px 0', textAlign: 'center' }}>
      Trial: <b>{trialDaysLeft}</b> days left on <b>{planName}</b> plan.
      <Link to="/subscription"><button style={{ marginLeft: 16 }}>Subscribe</button></Link>
    </div>
  );
  if (isTrialExpired) return (
    <div style={{ background: '#ffebee', padding: '12px 0', textAlign: 'center' }}>
      Trial expired for <b>{planName}</b> plan.
      <Link to="/subscription"><button style={{ marginLeft: 16 }}>Subscribe</button></Link>
    </div>
  );
  return null;
};
export default TrialBanner;

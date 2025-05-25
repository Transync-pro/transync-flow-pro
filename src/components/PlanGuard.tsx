import { useSubscription } from "@/contexts/SubscriptionContext";
import { Navigate } from "react-router-dom";

const PlanGuard = ({ children }) => {
  const { loading, planName } = useSubscription();
  if (loading) return <div>Loading...</div>;
  if (!planName) return <Navigate to="/pricing" />;
  return children;
};
export default PlanGuard;

import { useSubscription } from "@/contexts/SubscriptionContext";
import { Navigate } from "react-router-dom";

const DashboardGuard = ({ children }) => {
  const { isTrialExpired, loading } = useSubscription();
  if (loading) return <div>Loading...</div>;
  if (isTrialExpired) return <Navigate to="/subscription" />;
  return children;
};
export default DashboardGuard;

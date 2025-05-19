
import { useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import DashboardHome from "@/components/Dashboard/DashboardHome";
import { useToast } from "@/components/ui/use-toast";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isConnected, companyName, refreshConnection } = useQuickbooks();
  
  // Check QuickBooks connection on mount - but only once
  useEffect(() => {
    const checkConnection = async () => {
      await refreshConnection();
    };
    
    checkConnection();
  }, [refreshConnection]);
  
  // Handle disconnection case - redirect to disconnected page if not connected
  useEffect(() => {
    if (isConnected === false) { // Only redirect if we're definitely not connected (not during loading)
      console.log("Dashboard detected disconnected state, redirecting to /disconnected");
      navigate('/disconnected', { replace: true });
    }
  }, [isConnected, navigate]);
  
  // Show welcome message when connected
  useEffect(() => {
    if (isConnected && companyName) {
      toast({
        title: `Connected to ${companyName}`,
        description: "Your QuickBooks account is successfully connected.",
      });
    }
  }, [isConnected, companyName, toast]);
  
  // Only render the dashboard if connected
  if (!isConnected) {
    return null; // Will redirect via the effect
  }
  
  return (
    <DashboardLayout>
      <DashboardHome />
    </DashboardLayout>
  );
};

export default Dashboard;


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
  
  // Check QuickBooks connection on mount
  useEffect(() => {
    refreshConnection();
  }, [refreshConnection]);
  
  // Handle disconnection case
  useEffect(() => {
    const checkConnection = async () => {
      if (!isConnected) {
        // If not connected, redirect to disconnected page
        navigate('/disconnected', { replace: true });
      }
    };
    
    checkConnection();
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
  
  return (
    <DashboardLayout>
      <DashboardHome />
    </DashboardLayout>
  );
};

export default Dashboard;

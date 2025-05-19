
import { useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import DashboardHome from "@/components/Dashboard/DashboardHome";
import { useToast } from "@/components/ui/use-toast";
import { useQuickbooks } from "@/contexts/QuickbooksContext";

const Dashboard = () => {
  const { toast } = useToast();
  const { isConnected, companyName, refreshConnection } = useQuickbooks();
  
  // Check QuickBooks connection on mount
  useEffect(() => {
    refreshConnection();
  }, [refreshConnection]);
  
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

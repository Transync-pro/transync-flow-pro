
import { useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-text">TransyncPro Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome to TransyncPro. Use the sidebar to navigate to different features.
          </p>
          {isConnected && companyName && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">
                <span className="font-semibold">Connected to:</span> {companyName}
              </p>
            </div>
          )}
        </div>
        
        <div className="dashboard-content">
          {/* This will be filled by DashboardHome component that is rendered inside DashboardLayout */}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

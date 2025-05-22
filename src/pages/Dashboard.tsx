
import { useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import DashboardHome from "@/components/Dashboard/DashboardHome";
import { useToast } from "@/components/ui/use-toast";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { checkQBConnectionExists } from "@/services/quickbooksApi/connections";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isConnected, companyName, refreshConnection } = useQuickbooks();
  const { user } = useAuth();
  
  // Check QuickBooks connection on mount - but only once
  useEffect(() => {
    let isMounted = true;
    
    const checkConnection = async () => {
      console.log("Dashboard: Refreshing QB connection");
      await refreshConnection();
      
      // Direct DB check as a fallback
      if (user && !isConnected) {
        console.log("Dashboard: Context says not connected, checking DB directly");
        const hasConnection = await checkQBConnectionExists(user.id);
        
        if (hasConnection && isMounted) {
          console.log("Dashboard: Found connection in DB but context says not connected, refreshing again");
          // Found connection in DB but context doesn't reflect it, refresh again
          await refreshConnection();
        }
      }
    };
    
    checkConnection();
    
    return () => {
      isMounted = false;
    };
  }, [refreshConnection, user, isConnected]);
  
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
  if (isConnected === false) {
    // Will redirect via the effect
    return null;
  }
  
  return (
    <DashboardLayout>
      <DashboardHome />
    </DashboardLayout>
  );
};

export default Dashboard;

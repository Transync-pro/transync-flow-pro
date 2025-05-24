
import React, { useEffect, useRef } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import DashboardHome from "@/components/Dashboard/DashboardHome";
import { useToast } from "@/components/ui/use-toast";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { checkQBConnectionExists } from "@/services/quickbooksApi/connections";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, companyName, refreshConnection, checkConnection } = useQuickbooks();
  const { user } = useAuth();
  
  // Check QuickBooks connection on mount - but only once and silently
  useEffect(() => {
    let isMounted = true;
    
    const checkConnectionOnMount = async () => {
      console.log("Dashboard: Checking QB connection on mount");
      // Use silent mode to prevent UI flickering
      await refreshConnection(true, true); // force=true, silent=true
      
      // Direct DB check as a fallback
      if (user && !isConnected) {
        console.log("Dashboard: Context says not connected, checking DB directly");
        const hasConnection = await checkQBConnectionExists(user.id);
        
        if (hasConnection && isMounted) {
          console.log("Dashboard: Found connection in DB but context says not connected, refreshing again");
          // Found connection in DB but context doesn't reflect it, refresh again
          await refreshConnection(true, true); // force=true, silent=true
        }
      }
    };
    
    checkConnectionOnMount();
    
    return () => {
      isMounted = false;
    };
  }, [refreshConnection, user, isConnected]);
  
  // Check connection on location/route changes
  useEffect(() => {
    // Skip the initial check since we already do it in the mount effect
    const isInitialMount = useRef(true);
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const checkConnectionOnRouteChange = async () => {
      console.log("Dashboard: Checking QB connection on route change");
      // Use silent mode to prevent UI flickering
      await refreshConnection(true, true); // force=true, silent=true
    };
    
    checkConnectionOnRouteChange();
  }, [location.pathname, refreshConnection]);
  
  // Handle disconnection case - redirect to disconnected page if not connected
  useEffect(() => {
    if (isConnected === false) { // Only redirect if we're definitely not connected (not during loading)
      console.log("Dashboard detected disconnected state, redirecting to /disconnected");
      navigate('/disconnected', { replace: true });
    }
  }, [isConnected, navigate]);
  
  // Add document visibility change listener to check connection when user returns to the app
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log("Dashboard: Checking QB connection on visibility change");
        // Use silent mode to prevent UI flickering
        await refreshConnection(true, true); // force=true, silent=true
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

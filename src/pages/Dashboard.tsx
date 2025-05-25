
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
  const { isConnected, isLoading, companyName, refreshConnection, checkConnection } = useQuickbooks();
  const { user } = useAuth();

  useEffect(() => {
    console.log("Dashboard: isLoading:", isLoading, "isConnected:", isConnected);
  }, [isLoading, isConnected]);
  
  // Track if we've already checked the connection on mount
  const hasCheckedOnMount = useRef(false);
  
  // Check QuickBooks connection on mount - but only once and silently
  useEffect(() => {
    // Skip if we've already checked on mount or if we just came from a successful QB auth
    if (hasCheckedOnMount.current) {
      return;
    }
    
    // Check if we should skip the connection check (set by QuickbooksCallback)
    // @ts-ignore - Reading from a temporary window property
    if (window.__skipNextQBConnectionCheck) {
      console.log("Dashboard: Skipping connection check due to recent QB authentication");
      // @ts-ignore - Cleanup the temporary property
      window.__skipNextQBConnectionCheck = false;
      hasCheckedOnMount.current = true;
      return;
    }
    
    // Check if we have a recent successful auth from session storage
    const recentAuth = sessionStorage.getItem('qb_auth_successful');
    const authTimestamp = sessionStorage.getItem('qb_auth_timestamp');
    
    if (recentAuth === 'true' && authTimestamp) {
      const now = Date.now();
      const timeSinceAuth = now - parseInt(authTimestamp);
      
      // If auth was completed in the last 10 seconds, skip additional checks
      if (timeSinceAuth < 10000) {
        console.log("Dashboard: Skipping connection check due to recent auth", { timeSinceAuth: timeSinceAuth / 1000 + 's' });
        hasCheckedOnMount.current = true;
        // Clear the auth flags since we've used them
        sessionStorage.removeItem('qb_auth_successful');
        sessionStorage.removeItem('qb_auth_timestamp');
        return;
      }
    }
    
    let isMounted = true;
    
    const checkConnectionOnMount = async () => {
      console.log("Dashboard: Checking QB connection on mount");
      
      try {
        // Mark that we've checked the connection on mount to prevent multiple checks
        hasCheckedOnMount.current = true;
        
        // First check if we're already connected
        if (isConnected) {
          console.log("Dashboard: Already connected, skipping check");
          return;
        }
        
        // Use silent mode to prevent UI flickering
        await refreshConnection(true, true);
        
        // If we're still not connected, do a direct DB check as a fallback
        if (user && !isConnected && isMounted) {
          console.log("Dashboard: Context says not connected, checking DB directly");
          const hasConnection = await checkQBConnectionExists(user.id);
          
          if (hasConnection && isMounted) {
            console.log("Dashboard: Found connection in DB but context says not connected, refreshing again");
            // Found connection in DB but context doesn't reflect it, refresh again
            await refreshConnection(true, true);
          }
        }
      } catch (error) {
        console.error("Dashboard: Error checking connection:", error);
      } finally {
        // Ensure loading state is cleared even if there's an error
        if (isMounted) {
          // Force a final state update to ensure loading is set to false
          checkConnection(false, false);
        }
      }
    };
    
    checkConnectionOnMount();
    
    return () => {
      isMounted = false;
    };
  }, [refreshConnection, user, isConnected, checkConnection]);
  
  // Create ref outside the effect for tracking initial mount
  const isInitialRouteChange = useRef(true);
  
  // Track if we've already checked connection on this route
  const routeCheckedRef = useRef(false);
  
  // Check connection on location/route changes, but only once per route
  useEffect(() => {
    // Skip the initial check since we already do it in the mount effect
    if (isInitialRouteChange.current) {
      isInitialRouteChange.current = false;
      routeCheckedRef.current = true;
      return;
    }
    
    // Skip if we've already checked on this route
    if (routeCheckedRef.current) {
      return;
    }
    
    const checkConnectionOnRouteChange = async () => {
      console.log("Dashboard: Checking QB connection on route change");
      // Use silent mode to prevent UI flickering
      await refreshConnection(true, true); // force=true, silent=true
      // Mark that we've checked on this route
      routeCheckedRef.current = true;
    };
    
    checkConnectionOnRouteChange();
  }, [location.pathname, refreshConnection]);
  
  // Handle disconnection case - redirect to authenticate page if not connected
  // Using a ref to track if we've already redirected to avoid excessive checks
  const hasRedirected = useRef(false);
  
  useEffect(() => {
    // Only redirect if we're definitely not connected (not during loading)
    // And we haven't already redirected
    if (isConnected === false && !hasRedirected.current) {
      console.log("Dashboard detected disconnected state, redirecting to /authenticate");
      hasRedirected.current = true;
      navigate('/authenticate', { replace: true });
    } else if (isConnected === true) {
      // Reset the flag if we're connected again
      hasRedirected.current = false;
    }
  }, [isConnected, navigate]);
  
  // Add document visibility change listener to check connection when user returns to the app
  useEffect(() => {
    // We need to wrap the async function since event listeners can't be async directly
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Dashboard: Checking QB connection on visibility change");
        // Use silent mode to prevent UI flickering
        // We don't need to await this since we don't do anything with the result
        refreshConnection(true, true); // force=true, silent=true
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshConnection]);
  
  // No welcome message here - it's already shown in the AuthContext when the user signs in
  
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

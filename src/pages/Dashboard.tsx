import React, { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import DashboardHome from "@/components/Dashboard/DashboardHome";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { checkQBConnectionExists } from "@/services/quickbooksApi/connections";
import { motion } from "framer-motion";
// Staging is now handled via subdomain

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
  
  // Show success message when coming from QuickBooks callback
  useEffect(() => {
    if (location.state?.fromQbCallback) {
      navigate(location.pathname, { replace: true, state: {} });
      
      toast({
        title: "Connected to QuickBooks",
        description: "Your QuickBooks connection was successful!",
        duration: 5000,
      });
    }
  }, [location.state, navigate]);

  // Check QuickBooks connection on mount - but only once and silently
  useEffect(() => {
    // Skip if we've already checked on mount
    if (hasCheckedOnMount.current) {
      return;
    }
    
    // Check if we have a recent successful connection from session storage
    const connectionData = sessionStorage.getItem('qb_connection_data');
    const parsedConnection = connectionData ? JSON.parse(connectionData) : null;
    
    // If we have a recent successful connection, skip the check
    if (parsedConnection?.success && (Date.now() - parsedConnection.timestamp) < 30000) {
      console.log("Dashboard: Recent connection found, skipping initial check");
      hasCheckedOnMount.current = true;
      // Don't clear the connection data here - let RouteGuard handle it
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
  const redirectTimeout = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Clear any pending redirect timeout
    if (redirectTimeout.current) {
      clearTimeout(redirectTimeout.current);
    }
    
    // Only redirect if we're definitely not connected (not during loading)
    // And we haven't already redirected
    if (isConnected === false && !hasRedirected.current) {
      // Add a small delay to allow any pending state updates to complete
      redirectTimeout.current = setTimeout(() => {
        // Double-check that we're still not connected
        if (!isConnected && !isLoading && !hasRedirected.current) {
          console.log("Dashboard detected disconnected state, redirecting to /authenticate");
          hasRedirected.current = true;
          navigate('/authenticate', { replace: true });
        }
      }, 1000); // 1 second delay
    } else if (isConnected === true) {
      // Reset the flag if we're connected again
      hasRedirected.current = false;
    }
    
    // Clean up timeout on unmount or dependency change
    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, [isConnected, navigate, isLoading]);
  
  // Add smooth fade-in animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };
  
  // Add document visibility change listener to check connection when user returns to the app
  useEffect(() => {
    // We need to wrap the async function since event listeners can't be async directly
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if we have a recent connection in progress
        const connectionInProgress = sessionStorage.getItem('qb_connection_in_progress');
        
        if (connectionInProgress) {
          console.log("Dashboard: Connection in progress, skipping visibility check");
          return;
        }
        
        console.log("Dashboard: Checking QB connection on visibility change");
        // Use silent mode to prevent UI flickering
        refreshConnection(true, true); // force=true, silent=true
      }
    };
    
    // Add a small delay before adding the event listener to avoid race conditions
    const timer = setTimeout(() => {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
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
    <motion.div 
      className="min-h-screen bg-gray-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <DashboardLayout>
        <DashboardHome />
      </DashboardLayout>
    </motion.div>
  );
};

export default Dashboard;

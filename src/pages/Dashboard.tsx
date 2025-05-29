
import React, { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import DashboardHome from "@/components/Dashboard/DashboardHome";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, isLoading, companyName, refreshConnection, checkConnection } = useQuickbooks();
  const { user } = useAuth();

  console.log("Dashboard: isLoading:", isLoading, "isConnected:", isConnected);
  
  // Track if we've already checked the connection on mount
  const hasCheckedOnMount = useRef(false);
  
  // Check for recent QB auth success on mount
  useEffect(() => {
    // Skip if we've already checked on mount
    if (hasCheckedOnMount.current) {
      return;
    }
    
    hasCheckedOnMount.current = true;
    
    // Check for recent auth success flags
    const authSuccess = sessionStorage.getItem('qb_auth_success') === 'true';
    const authTimestamp = sessionStorage.getItem('qb_connection_timestamp');
    const isRecentAuth = authTimestamp && (Date.now() - parseInt(authTimestamp, 10) < 15000); // 15 second window
    
    if (authSuccess && isRecentAuth) {
      console.log("Dashboard: Recent QB auth detected, clearing flags and ensuring connection");
      
      // Clear the auth success flags to prevent showing the message again
      setTimeout(() => {
        sessionStorage.removeItem('qb_auth_success');
        sessionStorage.removeItem('qb_connection_timestamp');
      }, 1000);
      
      // Force a connection check to ensure context is up to date
      if (user) {
        refreshConnection(true, true); // force=true, silent=true
      }
      
      return;
    }
    
    // Regular connection check if not recent auth
    if (user && !isConnected && !isLoading) {
      console.log("Dashboard: Checking QB connection on mount");
      refreshConnection(true, true); // force=true, silent=true
    }
  }, [user, isConnected, isLoading, refreshConnection]);
  
  // Handle disconnection case - redirect to authenticate page if not connected
  const hasRedirected = useRef(false);
  const redirectTimeout = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Clear any pending redirect timeout
    if (redirectTimeout.current) {
      clearTimeout(redirectTimeout.current);
    }
    
    // Only redirect if we're definitely not connected and not loading
    if (isConnected === false && !isLoading && !hasRedirected.current) {
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

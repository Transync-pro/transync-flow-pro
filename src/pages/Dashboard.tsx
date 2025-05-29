import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { toast } from "@/components/ui/use-toast";
import { DashboardShell } from "@/components/DashboardShell";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ConnectionLoading } from "@/components/ConnectionLoading";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import DashboardHome from "@/components/Dashboard/DashboardHome";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Dashboard = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isConnected, isLoading, refreshConnection, companyName } = useQuickbooks();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Handle connection status messages
  useEffect(() => {
    const connected = searchParams.get('connected');
    const company = searchParams.get('company');
    const error = searchParams.get('error');

    if (connected === '1' && company) {
      toast({
        title: 'Connected to QuickBooks',
        description: `Successfully connected to ${decodeURIComponent(company)}`,
      });
      // Clean up URL parameters
      window.history.replaceState({}, '', '/dashboard');
    } else if (error) {
      toast({
        title: 'Connection Error',
        description: decodeURIComponent(error),
        variant: 'destructive',
      });
      // Clean up URL parameters
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  // Handle QuickBooks auth success message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'QB_AUTH_SUCCESS') {
        // Refresh connection status
        refreshConnection();
        toast({
          title: 'Connected to QuickBooks',
          description: `Successfully connected to ${event.data.companyName}`,
        });
      } else if (event.data.type === 'QB_AUTH_ERROR') {
        toast({
          title: 'Connection Error',
          description: event.data.error,
          variant: 'destructive',
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refreshConnection]);

  // Initial load handling
  useEffect(() => {
    if (isInitialLoad && !isLoading) {
      refreshConnection();
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, isLoading, refreshConnection]);

  // Handle disconnection case - redirect to authenticate page if not connected
  // Using a ref to track if we've already redirected to avoid excessive checks
  const hasRedirected = React.useRef(false);
  const redirectTimeout = React.useRef<NodeJS.Timeout>();

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

  if (isLoading || isInitialLoad) {
    return (
      <DashboardShell>
        <DashboardHeader heading="Dashboard" text="Loading your dashboard..." />
        <ConnectionLoading />
      </DashboardShell>
    );
  }

  // Add smooth fade-in animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gray-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <DashboardShell>
        <DashboardHeader 
          heading="Dashboard" 
          text={isConnected ? `Your QuickBooks connection to ${companyName} is active` : "Connect to QuickBooks to get started"} 
        />
        <DashboardLayout>
          <DashboardHome />
        </DashboardLayout>
      </DashboardShell>
    </motion.div>
  );
};

export default Dashboard;


import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuickbooks } from '@/contexts/QuickbooksContext';
import { toast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import DashboardHome from '@/components/Dashboard/DashboardHome';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ConnectionLoading } from '@/components/ConnectionLoading';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, isLoading, refreshConnection, companyName } = useQuickbooks();
  const { user } = useAuth();
  
  // Track if we've already processed URL parameters
  const hasProcessedParams = useRef(false);

  // Handle connection status from URL parameters (legacy support)
  useEffect(() => {
    if (hasProcessedParams.current) return;
    
    const params = new URLSearchParams(location.search);
    const connected = params.get('connected');
    const company = params.get('company');
    const error = params.get('error');

    if (connected === '1' && company) {
      toast({
        title: 'Connected to QuickBooks',
        description: `Successfully connected to ${decodeURIComponent(company)}`,
      });
      
      // Refresh connection to update context
      refreshConnection();
      
      // Clean up URL parameters
      navigate('/dashboard', { replace: true });
    } else if (error) {
      toast({
        title: 'Connection Error',
        description: decodeURIComponent(error),
        variant: 'destructive',
      });
      // Clean up URL parameters
      navigate('/dashboard', { replace: true });
    }
    
    hasProcessedParams.current = true;
  }, [location.search, navigate, refreshConnection]);

  // Handle disconnection case - but with a delay to allow connection check
  useEffect(() => {
    if (!isLoading && isConnected === false) {
      // Add a small delay to prevent immediate redirect during loading
      const timer = setTimeout(() => {
        navigate('/authenticate', { replace: true });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, isLoading, navigate]);

  // Add smooth fade-in animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  if (isLoading) {
    return <ConnectionLoading />;
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
}


import React, { useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import DashboardHome from "@/components/Dashboard/DashboardHome";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { motion } from "framer-motion";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isConnected, isLoading } = useQuickbooks();
  const { user } = useAuth();

  console.log("Dashboard: isLoading:", isLoading, "isConnected:", isConnected);
  
  // Handle disconnection case - redirect to authenticate page if not connected
  useEffect(() => {
    // Only redirect if we're definitely not connected and not loading
    if (isConnected === false && !isLoading) {
      console.log("Dashboard: User not connected, redirecting to /authenticate");
      navigate('/authenticate', { replace: true });
    }
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

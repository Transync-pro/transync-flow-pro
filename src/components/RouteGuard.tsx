
import { ReactNode, useEffect, useState, useCallback } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RouteGuardProps {
  children: ReactNode;
  requiresAuth?: boolean;
  requiresQuickbooks?: boolean;
  isPublicOnly?: boolean;
}

const RouteGuard = ({ 
  children, 
  requiresAuth = true, 
  requiresQuickbooks = false,
  isPublicOnly = false
}: RouteGuardProps) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isConnected, isLoading: isQbLoading, refreshConnection } = useQuickbooks();
  const [isChecking, setIsChecking] = useState(true);
  const [hasQbConnection, setHasQbConnection] = useState(false);
  const location = useLocation();

  // Direct database check for QuickBooks connection
  const checkQbConnectionDirectly = useCallback(async () => {
    if (!user) {
      setHasQbConnection(false);
      return false;
    }

    try {
      // Query the database directly to check connection status
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      const hasConnection = !error && !!data;
      
      // Update state based on what we found
      setHasQbConnection(hasConnection);
      
      // If we found a connection but isConnected is false, refresh connection in the context
      if (hasConnection && !isConnected) {
        await refreshConnection();
      }
      
      return hasConnection;
    } catch (error) {
      console.error('Error checking QB connection directly:', error);
      setHasQbConnection(false);
      return false;
    }
  }, [user, isConnected, refreshConnection]);

  // Initial check on mount and when dependencies change
  useEffect(() => {
    const checkAccess = async () => {
      // Wait for auth to load first
      if (isAuthLoading) return;
      
      // If we don't need QuickBooks, we can finish checking immediately
      if (!requiresQuickbooks) {
        setIsChecking(false);
        return;
      }
      
      // If we need QuickBooks, do a direct DB check
      if (user && requiresQuickbooks) {
        await checkQbConnectionDirectly();
      }
      
      // Finish checking
      setIsChecking(false);
    };
    
    checkAccess();
  }, [isAuthLoading, requiresQuickbooks, user, checkQbConnectionDirectly]);
  
  // Periodic re-check for routes requiring QuickBooks
  useEffect(() => {
    if (!requiresQuickbooks || !user) return;
    
    // Immediate check
    checkQbConnectionDirectly();
    
    const interval = setInterval(() => {
      checkQbConnectionDirectly();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [requiresQuickbooks, user, checkQbConnectionDirectly]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-600">Verifying your access...</p>
      </div>
    );
  }

  // Redirect authenticated users away from public-only pages (login, signup, etc.)
  if (isPublicOnly && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect unauthenticated users from protected pages to login
  if (requiresAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect users without QuickBooks connection to the disconnected page
  // Use our direct database check result instead of the context value
  if (requiresQuickbooks && !hasQbConnection) {
    console.log('RouteGuard: No QuickBooks connection found, redirecting to /disconnected');
    return <Navigate to="/disconnected" state={{ from: location }} replace />;
  }

  // If all requirements are met, render the children
  return <>{children}</>;
};

export default RouteGuard;

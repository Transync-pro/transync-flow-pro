
import { ReactNode, useEffect, useState, useCallback } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/utils/errorLogger";

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

  // Check if the current route is the QuickBooks callback route
  const isQbCallbackRoute = location.pathname === "/dashboard/quickbooks-callback";
  
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
      
      console.log('RouteGuard: Direct QB connection check result:', hasConnection);
      
      // Update state based on what we found
      setHasQbConnection(hasConnection);
      
      // If we found a connection but isConnected is false, refresh connection in the context
      if (hasConnection && !isConnected) {
        await refreshConnection();
      }
      
      return hasConnection;
    } catch (error) {
      logError("Error checking QB connection directly", {
        source: "RouteGuard",
        stack: error instanceof Error ? error.stack : undefined,
        context: { userId: user.id }
      });
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
  
  // No periodic recheck - only check on mount and after re-auth
  // This helps reduce unnecessary API calls
  
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

  // Don't redirect from the callback route - this is critical to let the callback complete
  if (isQbCallbackRoute) {
    return <>{children}</>;
  }

  // If we have a valid connection state from the context, use that
  if (requiresQuickbooks && !hasQbConnection && !isQbCallbackRoute) {
    console.log('RouteGuard: No QuickBooks connection found, redirecting to /disconnected');
    // Store the current location to redirect back after connecting
    sessionStorage.setItem('qb_redirect_after_connect', location.pathname);
    return <Navigate to="/disconnected" replace />;
  }

  // If all requirements are met, render the children
  return <>{children}</>;
};

export default RouteGuard;

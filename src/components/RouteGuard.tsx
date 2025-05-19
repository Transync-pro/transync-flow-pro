
import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
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
  const { isConnected, refreshConnection } = useQuickbooks();
  const [isChecking, setIsChecking] = useState(true);
  const [hasQbConnection, setHasQbConnection] = useState(false);
  const location = useLocation();
  const checkInProgress = useRef(false);
  const checkCompleted = useRef(false);
  const connectionCheckTimestamp = useRef(0);

  // Flag special routes
  const isQbCallbackRoute = location.pathname === "/dashboard/quickbooks-callback";
  const isDisconnectedRoute = location.pathname === "/disconnected";
  
  // Direct database check for QuickBooks connection with cache
  const checkQbConnectionDirectly = useCallback(async () => {
    // Skip check if already completed or in progress
    if (checkCompleted.current || checkInProgress.current || !user) {
      return hasQbConnection;
    }
    
    // Add cache mechanism - only check every 5 seconds max
    const now = Date.now();
    if (now - connectionCheckTimestamp.current < 5000 && connectionCheckTimestamp.current > 0) {
      return hasQbConnection;
    }
    
    // Prevent concurrent checks
    checkInProgress.current = true;

    try {
      // Log the check for debugging (with less frequency)
      console.log('RouteGuard: Checking QB connection for user', user.id);
      
      // Query the database directly
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const connectionExists = !error && !!data;
      connectionCheckTimestamp.current = Date.now();
      
      console.log('RouteGuard: QB connection check result:', connectionExists);
      
      // Update state based on database check
      setHasQbConnection(connectionExists);
      
      // If we found a connection but the context doesn't know yet, refresh it
      if (connectionExists && !isConnected) {
        await refreshConnection();
      }
      
      // Mark check as completed - we only need to do this once per component mount
      checkCompleted.current = true;
      
      return connectionExists;
    } catch (error: any) {
      logError("Error checking QB connection", {
        source: "RouteGuard",
        stack: error instanceof Error ? error.stack : undefined,
        context: { userId: user.id }
      });
      return false;
    } finally {
      checkInProgress.current = false;
    }
  }, [user, isConnected, refreshConnection, hasQbConnection]);

  // Check access on mount and when dependencies change with optimized approach
  useEffect(() => {
    // Skip check if already completed for this route
    if (checkCompleted.current && !isAuthLoading) {
      setIsChecking(false);
      return;
    }
    
    // Reset completed flag on dependency changes
    checkCompleted.current = false;
    
    const checkAccess = async () => {
      // Wait for auth to load first
      if (isAuthLoading) return;
      
      // Skip QB check for special routes
      if (isQbCallbackRoute || isDisconnectedRoute) {
        setIsChecking(false);
        return;
      }
      
      // If we need QuickBooks, do a direct DB check (but only if necessary)
      if (user && requiresQuickbooks && !hasQbConnection) {
        const hasConnection = await checkQbConnectionDirectly();
        setHasQbConnection(hasConnection);
      } else if (user && requiresQuickbooks && hasQbConnection) {
        // If we already know we have a connection, skip the check
        checkCompleted.current = true;
      }
      
      // Finish checking
      setIsChecking(false);
    };
    
    checkAccess();
  }, [isAuthLoading, requiresQuickbooks, user, checkQbConnectionDirectly, isQbCallbackRoute, isDisconnectedRoute, hasQbConnection]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-600">Verifying your access...</p>
      </div>
    );
  }

  // Redirect authenticated users away from public-only pages
  if (isPublicOnly && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect unauthenticated users to login
  if (requiresAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Special case: don't redirect from the callback route
  if (isQbCallbackRoute) {
    return <>{children}</>;
  }
  
  // Special case: don't redirect from the disconnected route
  if (isDisconnectedRoute) {
    return <>{children}</>;
  }

  // If QuickBooks is required and not connected, redirect to disconnected page
  if (requiresQuickbooks && user && !hasQbConnection && !isQbCallbackRoute) {
    console.log('RouteGuard: No QuickBooks connection found, redirecting to /disconnected');
    // Store the current location to redirect back after connecting
    sessionStorage.setItem('qb_redirect_after_connect', location.pathname);
    return <Navigate to="/disconnected" replace />;
  }

  // If all requirements are met, render the children
  return <>{children}</>;
};

export default RouteGuard;

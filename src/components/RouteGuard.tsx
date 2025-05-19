import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/utils/errorLogger";
import { checkQBConnectionExists } from "@/services/quickbooksApi/connections";

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
  const navigate = useNavigate();
  const checkInProgress = useRef(false);
  const connectionCheckTimestamp = useRef(0);
  const maxChecks = useRef(0);
  const checksCompleted = useRef(0);
  
  // Flag special routes
  const isQbCallbackRoute = location.pathname === "/dashboard/quickbooks-callback";
  const isDisconnectedRoute = location.pathname === "/disconnected";
  const isDashboardRoute = location.pathname === "/dashboard";
  
  // Direct database check for QuickBooks connection with better caching
  const checkQbConnectionDirectly = useCallback(async () => {
    // Skip check if in progress or no user
    if (checkInProgress.current || !user) {
      return hasQbConnection;
    }
    
    // Add cache mechanism - only check every 10 seconds max
    const now = Date.now();
    if (now - connectionCheckTimestamp.current < 10000 && connectionCheckTimestamp.current > 0) {
      return hasQbConnection;
    }
    
    // Limit the number of consecutive checks
    if (maxChecks.current === 0) {
      // Initialize on first check
      maxChecks.current = 3; // Only allow 3 consecutive checks
    } else if (checksCompleted.current >= maxChecks.current) {
      console.log(`RouteGuard: Maximum checks (${maxChecks.current}) reached, using cached result: ${hasQbConnection}`);
      return hasQbConnection;
    }
    
    // Prevent concurrent checks
    checkInProgress.current = true;
    checksCompleted.current++;

    try {
      // Only log the first check for debugging
      if (checksCompleted.current === 1) {
        console.log('RouteGuard: Checking QB connection for user', user.id);
      }
      
      // Use the optimized connection check function
      const connectionExists = await checkQBConnectionExists(user.id);
      connectionCheckTimestamp.current = Date.now();
      
      // Only log meaningful changes
      if (connectionExists !== hasQbConnection) {
        console.log('RouteGuard: QB connection check result:', connectionExists);
      }
      
      // Update state based on check
      setHasQbConnection(connectionExists);
      
      // If we found a connection but the context doesn't know yet, refresh it once
      if (connectionExists && !isConnected) {
        refreshConnection();
      }
      
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

  // Fix for disconnected page redirect loop - always prevent redirection from disconnected when we have no connection
  useEffect(() => {
    // If we're on the disconnected page and have a connection, navigate away immediately
    if (isDisconnectedRoute && hasQbConnection) {
      console.log('RouteGuard: Connection found while on disconnected page, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isDisconnectedRoute, hasQbConnection, navigate]);

  // Check access on mount and when dependencies change with optimized approach
  useEffect(() => {
    // Reset check counter on route change
    checksCompleted.current = 0;
    
    const checkAccess = async () => {
      // Wait for auth to load first
      if (isAuthLoading) return;
      
      // Skip QB check for special routes
      if (isQbCallbackRoute) {
        setIsChecking(false);
        return;
      }
      
      // If we need QuickBooks and are not yet on the disconnected page, do direct DB check
      if (user && requiresQuickbooks && !isDisconnectedRoute) {
        const hasConnection = await checkQbConnectionDirectly();
        
        // If we have a connection, ensure we're not stuck in a loop
        if (hasConnection && checksCompleted.current >= 3) {
          setIsChecking(false);
        }
      } 
      
      // Finish checking even if we're on disconnected page (we'll handle redirect in the other effect)
      setIsChecking(false);
    };
    
    checkAccess();
  }, [
    isAuthLoading, 
    requiresQuickbooks, 
    user, 
    checkQbConnectionDirectly, 
    isQbCallbackRoute, 
    isDisconnectedRoute
  ]);

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
  
  // Special case: don't redirect from the disconnected route if we don't have a connection
  if (isDisconnectedRoute && !hasQbConnection) {
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

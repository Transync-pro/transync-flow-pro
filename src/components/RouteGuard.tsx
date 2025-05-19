
import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { Loader2 } from "lucide-react";
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
  const { isConnected, isLoading: isQBLoading, refreshConnection } = useQuickbooks();
  const [isChecking, setIsChecking] = useState(true);
  const [hasQbConnection, setHasQbConnection] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Flag special routes
  const isQbCallbackRoute = location.pathname === "/dashboard/quickbooks-callback";
  const isDisconnectedRoute = location.pathname === "/disconnected";
  const isDashboardRoute = location.pathname === "/dashboard";
  
  // Direct database check for QuickBooks connection with better caching
  const checkQbConnectionDirectly = useCallback(async () => {
    if (!user) {
      return false;
    }
    
    try {
      // Use the optimized connection check function
      const connectionExists = await checkQBConnectionExists(user.id);
      console.log('RouteGuard: Direct QB connection check result:', connectionExists);
      
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
    }
  }, [user, isConnected, refreshConnection]);

  // Check access on mount and when dependencies change
  useEffect(() => {
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
        await checkQbConnectionDirectly();
      } 
      
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

  // Special effect for disconnected page - prevent redirect loop
  useEffect(() => {
    // If we're on the disconnected page and have a connection, navigate away
    if (isDisconnectedRoute && hasQbConnection && !isChecking) {
      console.log('RouteGuard: Connection found while on disconnected page, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isDisconnectedRoute, hasQbConnection, navigate, isChecking]);

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

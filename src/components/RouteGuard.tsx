
import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { Loader2 } from "lucide-react";
import { logError } from "@/utils/errorLogger";
import { checkQBConnectionExists, clearConnectionCache } from "@/services/quickbooksApi/connections";
import { isUserAdmin } from "@/services/blog/users";
import { toast } from "@/components/ui/use-toast";

interface RouteGuardProps {
  children: ReactNode;
  requiresAuth?: boolean;
  requiresQuickbooks?: boolean;
  isPublicOnly?: boolean;
  requiresAdmin?: boolean;
}

const RouteGuard = ({ 
  children, 
  requiresAuth = true, 
  requiresQuickbooks = false,
  isPublicOnly = false,
  requiresAdmin = false
}: RouteGuardProps) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected, isLoading: isQBLoading, refreshConnection } = useQuickbooks();
  const [isChecking, setIsChecking] = useState(true);
  const [hasQbConnection, setHasQbConnection] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Flag special routes
  const isQbCallbackRoute = location.pathname === "/dashboard/quickbooks-callback";
  const isAuthenticateRoute = location.pathname === "/authenticate";
  const isDashboardRoute = location.pathname === "/dashboard";
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isLoginPage = location.pathname === "/login";
  const isSignupPage = location.pathname === "/signup";

  // Flag to prevent multiple redirects
  const redirectingRef = useRef(false);
  
  // Track if this is the first check after mount
  const isInitialCheck = useRef(true);
  
  // For tracking previous user ID to detect changes
  const prevUserIdRef = useRef<string | null>(null);
  
  // Direct database check for QuickBooks connection with better error handling and retry
  const checkQbConnectionDirectly = useCallback(async () => {
    if (!user) {
      console.log("RouteGuard: No user available for QB connection check");
      return false;
    }
    
    // If user ID changed, clear the connection cache
    if (prevUserIdRef.current && prevUserIdRef.current !== user.id) {
      console.log(`RouteGuard: User changed from ${prevUserIdRef.current} to ${user.id}, clearing cache`);
      clearConnectionCache();
    }
    prevUserIdRef.current = user.id;
    
    try {
      console.log(`RouteGuard: Checking QB connection for user ${user.id}`);
      
      // Use the optimized connection check function with retry
      let connectionExists = await checkQBConnectionExists(user.id);
      
      // If connection is not found but should exist, try refreshing and checking again
      if (!connectionExists && isConnected) {
        console.log("RouteGuard: Connection not found but context says connected, refreshing...");
        await refreshConnection();
        // Try one more time after refresh
        connectionExists = await checkQBConnectionExists(user.id);
      }
      
      console.log('RouteGuard: Direct QB connection check result:', connectionExists);
      
      setHasQbConnection(connectionExists);
      
      // If we found a connection but the context doesn't know yet, refresh it
      if (connectionExists && !isConnected && !isQBLoading) {
        console.log("RouteGuard: Found connection in DB but context isn't aware, refreshing context");
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
  }, [user, isConnected, isQBLoading, refreshConnection]);

  // Check if user is admin
  useEffect(() => {
    if (isAuthLoading) return; // Wait for auth to finish loading

    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setRoleChecked(true);
        setIsLoading(false);
        return;
      }
      
      try {
        console.log("RouteGuard: Checking admin role for user:", user.id);
        const adminStatus = await isUserAdmin();
        console.log("RouteGuard: Is user admin:", adminStatus);
        
        // Set admin status and role checked in one update
        setIsAdmin(adminStatus);
        setRoleChecked(true);
        
        // If not admin and on admin route, redirect immediately
        if (!adminStatus && isAdminRoute) {
          console.log("RouteGuard: Admin route access denied after check completed");
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin area.",
            variant: "destructive"
          });
          navigate('/', { replace: true });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("RouteGuard: Error checking admin role:", error);
        setIsAdmin(false);
        setRoleChecked(true);
        setIsLoading(false);
        
        if (isAdminRoute) {
          toast({
            title: "Error",
            description: "Failed to verify admin permissions",
            variant: "destructive"
          });
          navigate('/', { replace: true });
        }
      }
    };
    
    if ((requiresAdmin || isAdminRoute) && user) {
      checkAdminRole();
    } else {
      setRoleChecked(true);
      setIsLoading(false);
    }
  }, [user, requiresAdmin, isAdminRoute, isAuthLoading, navigate]);

  // Track if we've already checked the connection for this user
  const connectionCheckedRef = useRef(false);
  
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
      
      // If we need QuickBooks and are not yet on the authenticate page, do direct DB check
      // But only if we haven't already checked for this user
      if (user && requiresQuickbooks && !isAuthenticateRoute && !connectionCheckedRef.current) {
        await checkQbConnectionDirectly();
        // Mark that we've checked the connection for this user
        connectionCheckedRef.current = true;
      } 
      
      if (!requiresAdmin || roleChecked) {
        setIsChecking(false);
      }
      
      // Reset the initial check flag after first run
      isInitialCheck.current = false;
    };
    
    checkAccess();
    
    // Reset the connection checked flag when user changes
    return () => {
      if (user?.id !== prevUserIdRef.current) {
        connectionCheckedRef.current = false;
      }
    };
  }, [
    isAuthLoading, 
    requiresQuickbooks, 
    user, 
    checkQbConnectionDirectly, 
    isQbCallbackRoute, 
    isAuthenticateRoute,
    requiresAdmin,
    roleChecked
  ]);

  // Handle redirection based on connection status
  useEffect(() => {
    // Add debounce to prevent redirect loops
    const timeoutId = setTimeout(() => {
      // Don't process redirects while still checking or for QB callback route
      if (isChecking || isQbCallbackRoute || redirectingRef.current || isLoading) return;
      
      // Set redirecting flag to prevent multiple redirects
      redirectingRef.current = true;
      
      // Handle authenticate page logic
      if (isAuthenticateRoute) {
        if (hasQbConnection || isConnected) {
          console.log('RouteGuard: Connection found while on authenticate page, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        }
        redirectingRef.current = false;
        return;
      }
      
      // Handle QuickBooks requirement for other pages
      if (requiresQuickbooks && user && !hasQbConnection && !isConnected && !isQBLoading) {
        console.log('RouteGuard: No QuickBooks connection found, redirecting to /authenticate');
        navigate('/authenticate', { replace: true });
        redirectingRef.current = false;
        return;
      }
      
      redirectingRef.current = false;
    }, 200); // Small delay to prevent rapid redirects
    
    return () => clearTimeout(timeoutId);
  }, [
    isChecking,
    hasQbConnection,
    isConnected,
    isAuthenticateRoute,
    requiresQuickbooks,
    user,
    isQbCallbackRoute,
    isQBLoading,
    isLoading,
    navigate
  ]);

  // Special admin route check
  useEffect(() => {
    if (isAdminRoute && roleChecked && !isChecking && !isLoading) {
      if (!isAdmin) {
        console.log('RouteGuard: Admin route access denied after check completed');
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin area.",
          variant: "destructive"
        });
        navigate('/', { replace: true });
      }
    }
  }, [isAdminRoute, roleChecked, isChecking, isAdmin, navigate]);

  // Fix for QuickBooks callback handling - a special case to always render children
  if (isQbCallbackRoute) {
    return <>{children}</>;
  }

  // Show loading state while checking
  if (isChecking || (requiresAdmin && !roleChecked) || isLoading) {
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
  
  // For admin routes, only check if we've completed the role check
  if (requiresAdmin && roleChecked && !isAdmin) {
    console.log("RouteGuard: Admin route access denied, redirecting to home");
    return <Navigate to="/" replace />;
  }
  
  // Special case: don't redirect from the authenticate route if we don't have a connection
  if (isAuthenticateRoute && !hasQbConnection && !isConnected) {
    return <>{children}</>;
  }

  // If all requirements are met, render the children
  return <>{children}</>;
};

export default RouteGuard;

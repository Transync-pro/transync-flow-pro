
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
  const { 
    isConnected, 
    isLoading: isQBLoading, 
    refreshConnection,
    connectionState
  } = useQuickbooks();
  const [isChecking, setIsChecking] = useState(true);
  const [hasQbConnection, setHasQbConnection] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use direct paths since staging is handled via subdomain
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
  
  // Track connection check attempts to prevent circuit breaker issues
  const connectionCheckAttempts = useRef(0);
  const lastConnectionCheck = useRef(0);
  
  // Reset connection check state when user changes
  useEffect(() => {
    if (user?.id !== prevUserIdRef.current) {
      // Reset connection check state when user changes
      setHasCheckedConnection(false);
      prevUserIdRef.current = user?.id || null;
    }
  }, [user?.id]);

  // Direct database check for QuickBooks connection with improved error handling
  const checkQbConnectionDirectly = useCallback(async () => {
    if (!user) {
      console.log("RouteGuard: No user available for QB connection check");
      return false;
    }
    
    // Check for recent successful QB authentication flags
    const skipAuthRedirect = sessionStorage.getItem('qb_skip_auth_redirect') === 'true';
    const authSuccess = sessionStorage.getItem('qb_auth_success') === 'true';
    const authTimestamp = sessionStorage.getItem('qb_connection_timestamp');
    const isRecentAuth = authTimestamp && 
      (Date.now() - parseInt(authTimestamp, 10) < 30000); // 30 second window
    
    // If we have recent auth success flags, assume connection exists (but don't navigate here)
    if ((skipAuthRedirect || authSuccess) && isRecentAuth) {
      console.log('RouteGuard: Recent QB auth success detected, setting connection to true');
      setHasQbConnection(true);
      return true;
    }
    
    // Prevent excessive connection checks
    const now = Date.now();
    if (now - lastConnectionCheck.current < 2000) { // 2 second throttle
      console.log('RouteGuard: Connection check throttled');
      return hasQbConnection;
    }
    
    // Reset circuit breaker if too many attempts
    if (connectionCheckAttempts.current > 10) {
      console.log('RouteGuard: Resetting connection check attempts');
      connectionCheckAttempts.current = 0;
    }
    
    // If user ID changed, clear the connection cache and reset attempts
    if (prevUserIdRef.current && prevUserIdRef.current !== user.id) {
      console.log(`RouteGuard: User changed from ${prevUserIdRef.current} to ${user.id}, clearing cache`);
      clearConnectionCache();
      connectionCheckAttempts.current = 0;
    }
    prevUserIdRef.current = user.id;
    
    try {
      console.log(`RouteGuard: Checking QB connection for user ${user.id} (attempt ${connectionCheckAttempts.current + 1})`);
      lastConnectionCheck.current = now;
      connectionCheckAttempts.current++;
      
      const connectionExists = await checkQBConnectionExists(user.id);
      
      console.log('RouteGuard: Direct QB connection check result:', connectionExists);
      
      setHasQbConnection(connectionExists);
      
      if (connectionExists && !isConnected && !isQBLoading) {
        console.log("RouteGuard: Found connection in DB but context isn't aware, refreshing context");
        // Don't await this to prevent blocking
        refreshConnection(true, true); // force=true, silent=true
      }
      
      return connectionExists;
    } catch (error: any) {
      console.error('RouteGuard: Error checking QB connection:', error);
      logError("Error checking QB connection", {
        source: "RouteGuard",
        stack: error instanceof Error ? error.stack : undefined,
        context: { userId: user.id, attempts: connectionCheckAttempts.current }
      });
      return false;
    }
  }, [user, isConnected, isQBLoading, refreshConnection, hasQbConnection]);

  // Check QuickBooks connection status when user is authenticated
  useEffect(() => {
    const verifyConnection = async () => {
      if (!requiresQuickbooks || !user) return;
      
      try {
        // Only show loading if we haven't checked yet or if we're on a route that needs it
        if (!hasCheckedConnection) {
          setIsChecking(true);
        }
        
        // Use the direct API call instead of the context method with inconsistent signature
        const isConnected = await checkQBConnectionExists(user.id);
        setHasCheckedConnection(true);
        
        // Only redirect if we're not already on the target route
        if (isConnected) {
          if (isAuthenticateRoute) {
            navigate('/dashboard', { replace: true });
          }
        } else if (!isAuthenticateRoute && !isQbCallbackRoute) {
          // Only redirect to authenticate if we're not already there
          navigate('/authenticate', { replace: true });
        }
      } catch (error) {
        console.error('Error checking QuickBooks connection:', error);
        logError({
          source: 'RouteGuard:verifyConnection',
          error: error as Error,
          context: { userId: user?.id }
        });
        
        // On error, assume not connected but don't redirect to avoid loops
        if (isAuthenticateRoute) {
          // If we're on the authenticate route and there's an error, stay there
          return;
        }
      } finally {
        setIsChecking(false);
      }
    };

    // Only verify connection if we haven't checked yet or if the user has changed
    if (!hasCheckedConnection || user?.id !== prevUserIdRef.current) {
      verifyConnection();
    }
  }, [
    user, 
    requiresQuickbooks, 
    location.pathname, 
    navigate, 
    hasCheckedConnection, 
    isAuthenticateRoute, 
    isQbCallbackRoute
  ]);

  // Check if user is admin
  useEffect(() => {
    if (isAuthLoading) return;

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
        
        setIsAdmin(adminStatus);
        setRoleChecked(true);
        
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
    console.log("[RouteGuard] useEffect triggered. Pathname:", location.pathname);
    console.log("[RouteGuard] Auth state: isAuthLoading:", isAuthLoading);
    console.log("[RouteGuard] User data:", user);
    
    const checkAccess = async () => {
      // Skip auth success is handled by the priority useEffect above
      
      if (isAuthLoading) return;
      
      if (isQbCallbackRoute) {
        setIsChecking(false);
        return;
      }
      
      if (user && requiresQuickbooks && !isAuthenticateRoute && !connectionCheckedRef.current) {
        try {
          const hasConnection = await checkQbConnectionDirectly();
          setHasQbConnection(hasConnection);
        } catch (error) {
          console.error('Error checking QB connection in RouteGuard:', error);
          setHasQbConnection(false);
        } finally {
          connectionCheckedRef.current = true;
          setIsChecking(false);
        }
      } else if (!requiresAdmin || roleChecked) {
        setIsChecking(false);
      }
      
      isInitialCheck.current = false;
    };
    
    checkAccess();
  }, [
    user, 
    isAuthLoading, 
    requiresQuickbooks, 
    requiresAdmin, 
    isQbCallbackRoute, 
    isAuthenticateRoute, 
    checkQbConnectionDirectly, 
    roleChecked, 
    location.pathname
  ]);

  // PRIORITY 1: Handle auth success immediately - this runs first
  useEffect(() => {
    if (!user || isAuthLoading) return;
    
    // Check for recent QB auth success flags
    const skipAuthRedirect = sessionStorage.getItem('qb_skip_auth_redirect') === 'true';
    const authSuccess = sessionStorage.getItem('qb_auth_success') === 'true';
    const authTimestamp = sessionStorage.getItem('qb_connection_timestamp');
    const isRecentAuth = authTimestamp && 
      (Date.now() - parseInt(authTimestamp, 10) < 30000); // 30 second window
    
    // If we have recent auth success and we're on authenticate page, navigate immediately
    if ((skipAuthRedirect || authSuccess) && isRecentAuth && isAuthenticateRoute && !redirectingRef.current) {
      console.log('RouteGuard: PRIORITY - Recent QB auth success detected on authenticate page, navigating to dashboard');
      redirectingRef.current = true;
      setHasQbConnection(true);
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [user, isAuthLoading, isAuthenticateRoute, navigate]);

  // Handle navigation when connection status changes (but not for auth success - that's handled above)
  useEffect(() => {
    const handleNavigation = async () => {
      try {
        if (isChecking || isAuthLoading || !roleChecked) return;
        
        // Skip if we're already redirecting
        if (redirectingRef.current) return;
        
        // Skip if we're on the callback route
        if (isQbCallbackRoute) return;
        
        // Skip if we're still checking the connection
        if (requiresQuickbooks && connectionCheckedRef.current === false) return;
        
        // Skip auth success handling - this is handled by the priority useEffect
        const skipAuthRedirect = sessionStorage.getItem('qb_skip_auth_redirect') === 'true';
        const authSuccess = sessionStorage.getItem('qb_auth_success') === 'true';
        const authTimestamp = sessionStorage.getItem('qb_connection_timestamp');
        const isRecentAuth = authTimestamp && 
          (Date.now() - parseInt(authTimestamp, 10) < 30000);
        
        if ((skipAuthRedirect || authSuccess) && isRecentAuth) {
          // Auth success is handled by priority useEffect, don't interfere
          return;
        }
        
        // Set redirecting flag to prevent multiple redirects
        redirectingRef.current = true;
        
        // Handle unauthenticated users
        if (!user && requiresAuth && !isPublicOnly) {
          console.log('RouteGuard: Redirecting to login (unauthenticated)');
          navigate('/login', { 
            replace: true,
            state: { from: location.pathname }
          });
          return;
        }
        
        // Handle authenticated users on public-only pages
        if (user && isPublicOnly) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin area.",
            variant: "destructive"
          });
          navigate('/', { replace: true });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("RouteGuard: Error handling navigation:", error);
        setIsLoading(false);
        
        if (isAdminRoute) {
          toast({
            title: "Error",
            description: "An error occurred while checking permissions",
            variant: "destructive"
          });
          navigate('/', { replace: true });
        }
      } finally {
        redirectingRef.current = false;
      }
    };

    handleNavigation();
  }, [
    user,
    isChecking,
    isAuthLoading,
    roleChecked,
    requiresQuickbooks,
    isQbCallbackRoute,
    isPublicOnly,
    requiresAuth,
    isAdminRoute,
    navigate,
    location.pathname
  ]);

  // Show loading state while checking permissions
  if (isLoading || isChecking || isAuthLoading || (requiresAdmin && !roleChecked)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // If we're on a public page and not logged in, or if we're on the callback page, render children
  if ((isPublicOnly && !user) || isQbCallbackRoute) {
    return <>{children}</>;
  }

  // If we require authentication but there's no user, redirect to login
  if (requiresAuth && !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If we require QuickBooks connection but don't have one, redirect to authenticate
  if (requiresQuickbooks && !hasQbConnection) {
    return <Navigate to="/authenticate" replace />;
  }

  // If we require admin but the user isn't an admin, redirect to home
  if (requiresAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, render the protected content
  return <>{children}</>;
};

export default RouteGuard;

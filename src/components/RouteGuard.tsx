import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { Loader2 } from "lucide-react";
import { logError } from "@/utils/errorLogger";
import { checkQBConnectionExists, clearConnectionCache } from "@/services/quickbooksApi/connections";
import { isUserAdmin } from "@/services/blog/users";
import { toast } from "@/components/ui/use-toast";
import { navigationController } from "@/services/navigation/NavigationController";

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
  
  // Use direct paths since staging is handled via subdomain
  const isQbCallbackRoute = location.pathname === "/dashboard/quickbooks-callback";
  const isAuthenticateRoute = location.pathname === "/authenticate";
  const isDashboardRoute = location.pathname === "/dashboard";
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isLoginPage = location.pathname === "/login";
  const isSignupPage = location.pathname === "/signup";

  // Flag to prevent multiple redirects
  const redirectingRef = useRef(false);
  
  // For tracking previous user ID to detect changes
  const prevUserIdRef = useRef<string | null>(null);
  
  // Track connection check attempts to prevent circuit breaker issues
  const connectionCheckAttempts = useRef(0);
  const lastConnectionCheck = useRef(0);

  // Track if we've already attempted navigation for this auth session
  const navigationAttemptedRef = useRef(false);

  // PRIORITY 1: Handle successful QB auth immediately with robust navigation
  useEffect(() => {
    if (!user || isAuthLoading) return;
    
    // Check for recent QB auth success flags
    const skipAuthRedirect = sessionStorage.getItem('qb_skip_auth_redirect') === 'true';
    const authSuccess = sessionStorage.getItem('qb_auth_success') === 'true';
    const authTimestamp = sessionStorage.getItem('qb_connection_timestamp');
    const isRecentAuth = authTimestamp && 
      (Date.now() - parseInt(authTimestamp, 10) < 30000); // 30 second window
    
    // If we have recent auth success and we're on authenticate page
    if ((skipAuthRedirect || authSuccess) && isRecentAuth && isAuthenticateRoute) {
      // Prevent multiple navigation attempts
      if (navigationAttemptedRef.current) {
        console.log('RouteGuard: Navigation already attempted, skipping duplicate attempt');
        return;
      }

      console.log('RouteGuard: PRIORITY - Recent QB auth success detected, forcing navigation to dashboard');
      navigationAttemptedRef.current = true;
      redirectingRef.current = true;
      setHasQbConnection(true);
      
      // Use multiple navigation approaches for maximum reliability
      const attemptNavigation = async () => {
        try {
          // Method 1: React Router navigate with replace
          console.log('RouteGuard: Attempting React Router navigation');
          navigate('/dashboard', { replace: true });
          
          // Method 2: Fallback with timeout in case React Router fails
          setTimeout(() => {
            if (location.pathname === '/authenticate') {
              console.log('RouteGuard: React Router navigation may have failed, trying window.location');
              window.location.replace('/dashboard');
            }
          }, 1000);
          
          // Clear the auth flags after successful navigation attempt
          setTimeout(() => {
            console.log('RouteGuard: Clearing auth success flags after navigation');
            sessionStorage.removeItem('qb_skip_auth_redirect');
            sessionStorage.removeItem('qb_auth_success');
            // Keep timestamp for a bit longer to prevent race conditions
            setTimeout(() => {
              sessionStorage.removeItem('qb_connection_timestamp');
            }, 5000);
          }, 2000);
          
        } catch (error) {
          console.error('RouteGuard: Navigation error:', error);
          // Ultimate fallback
          window.location.href = '/dashboard';
        }
      };
      
      attemptNavigation();
      return;
    }
  }, [user, isAuthLoading, isAuthenticateRoute, navigate, location.pathname]);
  
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
    
    // If we have recent auth success flags, assume connection exists
    if ((skipAuthRedirect || authSuccess) && isRecentAuth) {
      console.log('RouteGuard: Recent QB auth success detected, setting connection to true');
      setHasQbConnection(true);
      return true;
    }
    
    // Prevent excessive connection checks - circuit breaker
    const now = Date.now();
    if (now - lastConnectionCheck.current < 2000) { // 2 second throttle
      console.log('RouteGuard: Connection check throttled');
      return hasQbConnection;
    }
    
    // Reset circuit breaker if too many attempts
    if (connectionCheckAttempts.current > 10) {
      console.log('RouteGuard: Circuit breaker triggered - resetting connection check attempts');
      connectionCheckAttempts.current = 0;
      // Don't continue with checks when circuit breaker is triggered
      return hasQbConnection;
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
    
    // Skip if we're already attempting navigation
    if (navigationAttemptedRef.current) {
      console.log("[RouteGuard] Navigation already attempted, skipping access check");
      return;
    }
    
    const checkAccess = async () => {
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

  // Handle navigation when connection status changes
  useEffect(() => {
    if (isChecking || isAuthLoading || !roleChecked) return;
    
    // Skip if we're already redirecting or attempting navigation
    if (redirectingRef.current || navigationAttemptedRef.current) return;
    
    // Skip if we're on the callback route
    if (isQbCallbackRoute) return;
    
    // Skip if we're still checking the connection
    if (requiresQuickbooks && connectionCheckedRef.current === false) return;
    
    // Check for recent auth success - this should be handled by the priority useEffect
    const skipAuthRedirect = sessionStorage.getItem('qb_skip_auth_redirect') === 'true';
    const authSuccess = sessionStorage.getItem('qb_auth_success') === 'true';
    const authTimestamp = sessionStorage.getItem('qb_connection_timestamp');
    const isRecentAuth = authTimestamp && 
      (Date.now() - parseInt(authTimestamp, 10) < 30000);
    
    if ((skipAuthRedirect || authSuccess) && isRecentAuth) {
      // Recent auth success is handled by priority useEffect, don't interfere
      console.log('RouteGuard: Recent auth detected, letting priority useEffect handle navigation');
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
      console.log('RouteGuard: Redirecting to dashboard (public page)');
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Handle QuickBooks connection requirements
    if (user && requiresQuickbooks) {
      // If we don't have a connection and we're not on the authenticate page
      if (!hasQbConnection && !isAuthenticateRoute) {
        console.log('RouteGuard: Redirecting to authenticate (no QB connection)');
        navigate('/authenticate', { replace: true });
        return;
      }
      
      // If we have a connection and we're on the authenticate page
      if (hasQbConnection && isAuthenticateRoute) {
        console.log('RouteGuard: Redirecting to dashboard (already connected)');
        navigate('/dashboard', { replace: true });
        return;
      }
    }
    
    // Handle admin role requirements
    if (user && requiresAdmin && !isAdmin) {
      console.log('RouteGuard: Redirecting to home (not admin)');
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin area.",
        variant: "destructive"
      });
      navigate('/', { replace: true });
    }
    
    // Reset redirecting flag
    redirectingRef.current = false;
  }, [
    user, 
    isConnected, 
    hasQbConnection, 
    isChecking, 
    isAuthLoading, 
    requiresQuickbooks, 
    requiresAuth, 
    isPublicOnly, 
    requiresAdmin, 
    isAdmin, 
    roleChecked,
    isQbCallbackRoute,
    isAuthenticateRoute,
    isDashboardRoute,
    isLoginPage,
    isSignupPage,
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

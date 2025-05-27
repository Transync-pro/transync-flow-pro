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
      
      let connectionExists = await checkQBConnectionExists(user.id);
      
      if (!connectionExists && isConnected) {
        console.log("RouteGuard: Connection not found but context says connected, refreshing...");
        await refreshConnection();
        connectionExists = await checkQBConnectionExists(user.id);
      }
      
      console.log('RouteGuard: Direct QB connection check result:', connectionExists);
      
      setHasQbConnection(connectionExists);
      
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
      // CRITICAL: Check for skip flags BEFORE any other operations
      // These flags come from successful QuickBooks authentication
      const skipAuthRedirect = sessionStorage.getItem('qb_skip_auth_redirect') === 'true';
      const authSuccess = sessionStorage.getItem('qb_auth_success') === 'true';
      const authTimestamp = sessionStorage.getItem('qb_connection_timestamp');
      const isRecentAuth = authTimestamp && 
        (Date.now() - parseInt(authTimestamp, 10) < 30000); // 30 second cooldown
      
      // If we have a recent successful auth, skip ALL checks and render children
      if ((skipAuthRedirect || authSuccess) && isRecentAuth) {
        console.log('RouteGuard: Skip flags detected, bypassing ALL connection checks');
        setIsChecking(false);
        connectionCheckedRef.current = true;
        return;
      }
      
      if (isAuthLoading) return;
      
      if (isQbCallbackRoute) {
        setIsChecking(false);
        return;
      }
      
      if (user && requiresQuickbooks && !isAuthenticateRoute && !connectionCheckedRef.current) {
        try {
          await checkQbConnectionDirectly();
        } catch (error) {
          console.error('Error checking QB connection in RouteGuard:', error);
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

  // Handle navigation when connection status changes
  useEffect(() => {
    if (isChecking || isAuthLoading || !roleChecked) return;
    
    // Skip if we're already redirecting
    if (redirectingRef.current) return;
    
    // Skip if we're on the callback route
    if (isQbCallbackRoute) return;
    
    // Skip if we're still checking the connection
    if (requiresQuickbooks && connectionCheckedRef.current === false) return;
    
    // Skip if we're on the authenticate page and don't have a connection yet
    if (isAuthenticateRoute && !hasQbConnection) return;
    
    // Skip if we're on the dashboard and have a connection
    if (isDashboardRoute && hasQbConnection) return;
    
    // Skip if we're on a public page and not logged in
    if ((isLoginPage || isSignupPage) && !user) return;
    
    // Skip if we're on an admin page and have the correct role
    if (isAdminRoute && isAdmin) return;
    
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

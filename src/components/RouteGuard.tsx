import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { Loader2 } from "lucide-react";
import { logError } from "@/utils/errorLogger";
import { checkQBConnectionExists, clearConnectionCache } from "@/services/quickbooksApi/connections";
import { isUserAdmin } from "@/services/blog/users";
import { toast } from "@/components/ui/use-toast";
import { addStagingPrefix, removeStagingPrefix } from "@/config/environment";
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
  
  // Remove staging prefix for route comparison
  const normalizedPath = removeStagingPrefix(location.pathname);
  
  // Flag special routes using normalized paths
  const isQbCallbackRoute = normalizedPath === "/dashboard/quickbooks-callback";
  const isAuthenticateRoute = normalizedPath === "/authenticate";
  const isDashboardRoute = normalizedPath === "/dashboard";
  const isAdminRoute = normalizedPath.startsWith("/admin");
  const isLoginPage = normalizedPath === "/login";
  const isSignupPage = normalizedPath === "/signup";

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
          navigate(addStagingPrefix('/'), { replace: true });
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
          navigate(addStagingPrefix('/'), { replace: true });
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

  // Check auth and redirect helper function
  const checkAuthAndRedirect = useCallback(() => {
    if (!user && requiresAuth) {
      console.log('RouteGuard: No user found, redirecting to login');
      navigate(addStagingPrefix('/login'), { replace: true });
      return true; // Return true to indicate redirect occurred
    }
    return false; // Return false to indicate no redirect
  }, [user, requiresAuth, navigate]);

  // Handle redirection based on connection status with staging support
  useEffect(() => {
    console.log("[RouteGuard] useEffect triggered. Pathname:", location.pathname);
    console.log("[RouteGuard] Auth state: isAuthLoading:", isAuthLoading);
    console.log("[RouteGuard] User data:", user);
    
    const timeoutId = setTimeout(() => {
      // CRITICAL CHECK FIRST: Check for skip flags before ANY other processing
      // This is our primary defense against redirect loops
      const skipAuthRedirect = sessionStorage.getItem('qb_skip_auth_redirect') === 'true';
      const authSuccess = sessionStorage.getItem('qb_auth_success') === 'true';
      const authTimestamp = sessionStorage.getItem('qb_connection_timestamp');
      // Extend cooldown to 30 seconds
      const isRecentAuth = authTimestamp && 
        (Date.now() - parseInt(authTimestamp, 10) < 30000); // 30 second cooldown
        console.log('[RouteGuard DEBUG] Timeout - Initial flags: skipAuthRedirect:', skipAuthRedirect, 'authSuccess:', authSuccess, 'authTimestamp:', authTimestamp, 'isRecentAuth:', isRecentAuth);
      
      // If we have a recent successful auth, skip ALL redirect logic immediately
      if ((skipAuthRedirect || authSuccess) && isRecentAuth) {
        console.log('RouteGuard: Skip flags detected in redirect logic, bypassing ALL redirects');
        redirectingRef.current = false;
        return;
      }
      
      // Only check navigation controller if skip flags aren't active
      if (navigationController.isNavigationLocked()) {
        console.log('RouteGuard: Navigation is currently locked by NavigationController, skipping ALL redirect logic');
        redirectingRef.current = false;
        return;
      }
      
      // Check for navigation in progress flag set by NavigationController
      const navigationInProgress = sessionStorage.getItem('qb_navigation_in_progress') === 'true';
      console.log('[RouteGuard DEBUG] Timeout - Navigation in progress flag:', navigationInProgress);
      if (navigationInProgress) {
        console.log('RouteGuard: Navigation in progress flag detected, skipping ALL redirect logic');
        redirectingRef.current = false;
        return;
      }
      
      // Get all other relevant session storage items we need
      const qbConnectionVerified = sessionStorage.getItem('qb_connection_verified');
      const qbDisconnected = sessionStorage.getItem('qb_disconnected');
      const qbDisconnectTimestamp = sessionStorage.getItem('qb_disconnect_timestamp');
      const qbRedirectedToAuth = sessionStorage.getItem('qb_redirected_to_authenticate');
      const qbRedirectTimestamp = sessionStorage.getItem('qb_redirect_timestamp');
      console.log('[RouteGuard DEBUG] Timeout - QB session items: qbConnectionVerified:', qbConnectionVerified, 'qbDisconnected:', qbDisconnected, 'qbDisconnectTimestamp:', qbDisconnectTimestamp, 'qbRedirectedToAuth:', qbRedirectedToAuth, 'qbRedirectTimestamp:', qbRedirectTimestamp);
      
      // The authentication skip check has already been performed at the top of this function
      // No need to check again here
      
      console.log('[RouteGuard DEBUG] Timeout - Exiting early check: isChecking:', isChecking, 'redirectingRef.current:', redirectingRef.current, 'isLoading:', isLoading);
      if (isChecking || redirectingRef.current || isLoading) return;
      
      // Check for connection data in session storage
      const connectionData = sessionStorage.getItem('qb_connection_data');
      const parsedConnection = connectionData ? JSON.parse(connectionData) : null;
      
      // Directly get connection timestamp from session storage since we removed the earlier variable
      const connectionTimestamp = sessionStorage.getItem('qb_connection_timestamp');
      console.log('[RouteGuard DEBUG] Timeout - Connection data: connectionData exists:', !!connectionData, 'parsedConnection:', parsedConnection, 'connectionTimestamp:', connectionTimestamp);
      const hasRecentVerifiedConnection = qbConnectionVerified && connectionTimestamp && 
        (Date.now() - parseInt(connectionTimestamp, 10) < 60000); // 60 second window
      
      // Get skip flag from session storage directly since we removed the earlier variable
      const shouldSkipRedirect = sessionStorage.getItem('qb_skip_auth_redirect') === 'true';
      
      // Check if we're in the middle of a QuickBooks connection process
      const isInConnectionProcess = 
        location.pathname.includes('quickbooks-callback') || 
        location.search.includes('code=') ||
        location.state?.fromQbCallback === true ||
        location.state?.connectionEstablished === true ||
        sessionStorage.getItem('qb_connecting_user') ||
        sessionStorage.getItem('qb_connection_in_progress') ||
        hasRecentVerifiedConnection ||
        (parsedConnection && (Date.now() - parsedConnection.timestamp) < 30000); // 30 second window for connection
      
      if (isInConnectionProcess) {
        console.log('RouteGuard: In QuickBooks connection process, skipping redirect', {
          path: location.pathname,
          search: location.search,
          state: location.state,
          qbConnecting: sessionStorage.getItem('qb_connecting_user'),
          qbInProgress: sessionStorage.getItem('qb_connection_in_progress'),
          connectionData: parsedConnection
        });
        
        if (parsedConnection && parsedConnection.success && location.pathname === '/dashboard') {
          console.log('RouteGuard: Connection successful, cleaning up session storage');
          sessionStorage.removeItem('qb_connection_data');
          sessionStorage.removeItem('qb_connection_in_progress');
          sessionStorage.removeItem('qb_connecting_user');
          
          if (refreshConnection) {
            refreshConnection(true); // Force refresh
          }
        }
        
        redirectingRef.current = false;
        return;
      }
      
      const qbConnectionSuccess = sessionStorage.getItem('qb_connection_success');
      const qbConnectionCompany = sessionStorage.getItem('qb_connection_company');
      const qbAuthTimestamp = sessionStorage.getItem('qb_auth_timestamp');
      
      if (location.state?.fromQbCallback) {
        console.log('RouteGuard: Just came from QuickBooks callback, skipping redirect check');
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }
      
      redirectingRef.current = true;
      
      if (qbConnectionSuccess && qbAuthTimestamp) {
        const connectionTime = parseInt(qbAuthTimestamp, 10);
        const currentTime = Date.now();
        const maxAge = 5 * 60 * 1000;
        
        if (currentTime - connectionTime < maxAge) {
          console.log('RouteGuard: Detected recent QuickBooks connection from session');
          
          // Assume connected for a better UX - skip the connection check
          setHasQbConnection(true);
          
          // Don't remove success flag immediately - keep it for the duration of this session
          // This ensures we don't redirect to authenticate during this session
          
          // Refresh connection in the background without waiting
          refreshConnection(true, true).then(() => {
            console.log('RouteGuard: Connection refresh completed in background');
            // Only clear flags after successful refresh
            sessionStorage.removeItem('qb_connection_success');
            sessionStorage.removeItem('qb_connection_company');
          }).catch(err => {
            console.error('RouteGuard: Error refreshing connection in background:', err);
          });
          
          // If we're not already on the dashboard, redirect there
          if (location.pathname !== addStagingPrefix('/dashboard')) {
            navigate(addStagingPrefix('/dashboard'), { replace: true });
          }
          
          redirectingRef.current = false;
          return;
        } else {
          console.log('RouteGuard: Stale connection success detected, cleaning up');
          sessionStorage.removeItem('qb_connection_success');
          sessionStorage.removeItem('qb_connection_company');
        }
      }
      
      // Clear any redirect flags when on the authenticate page
      if (isAuthenticateRoute) {
        // Only clear the flag if we're not in the middle of a connection process
        if (!isInConnectionProcess) {
          sessionStorage.removeItem('qb_redirected_to_authenticate');
        }
        
        // Only redirect to dashboard if we have an active connection
        if ((hasQbConnection || isConnected) && !location.state?.fromDisconnect) {
          console.log('RouteGuard: Connection found while on authenticate page, redirecting to dashboard');
          navigate(addStagingPrefix('/dashboard'), { replace: true });
        }
        redirectingRef.current = false;
        return;
      }
      
      // Use our pre-declared variables for disconnect checks
      const isRecentDisconnect = qbDisconnected && qbDisconnectTimestamp && 
        (Date.now() - parseInt(qbDisconnectTimestamp, 10) < 10000); // 10 second window after disconnect
      
      // Skip all redirect logic if the skip flag is set (post-authentication)
      if (shouldSkipRedirect && isDashboardRoute) {
        console.log('RouteGuard: Skipping redirect logic due to qb_skip_auth_redirect flag');
        // Clear the flag after using it to prevent it from affecting future navigation
        setTimeout(() => {
          sessionStorage.removeItem('qb_skip_auth_redirect');
          console.log('RouteGuard: Cleared qb_skip_auth_redirect flag');
        }, 2000); // Clear after 2 seconds to ensure it's used for the initial navigation
        redirectingRef.current = false;
        return;
      }
      
      // Handle redirection when QuickBooks connection is required but not found
      if (requiresQuickbooks && user && !hasQbConnection && !isConnected && !isQBLoading && !isRecentDisconnect && !shouldSkipRedirect) {
        const redirected = sessionStorage.getItem('qb_redirected_to_authenticate');
        const lastRedirectTime = sessionStorage.getItem('qb_redirect_timestamp');
        const currentTime = Date.now();
        const redirectThreshold = 5000; // 5 seconds between redirects to prevent loops
        
        // Only redirect if we haven't redirected recently (prevents rapid cycling)
        const canRedirect = !lastRedirectTime || (currentTime - parseInt(lastRedirectTime, 10)) > redirectThreshold;
        
        if (!redirected && canRedirect) {
          console.log('RouteGuard: No QuickBooks connection found, redirecting to /authenticate');
          sessionStorage.setItem('qb_redirected_to_authenticate', 'true');
          sessionStorage.setItem('qb_redirect_timestamp', currentTime.toString());
          navigate(addStagingPrefix('/authenticate'), { 
            replace: true,
            state: { fromDisconnect: true } // Mark that this redirect is due to disconnection
          });
        } else if (redirected) {
        }
        
        // Clear redirect flag when we have an active connection
        if (hasQbConnection || isConnected) {
          sessionStorage.removeItem('qb_redirected_to_authenticate');
        }
        
        redirectingRef.current = false;
      }
      
      // Call the checkAuthAndRedirect function
      checkAuthAndRedirect();
    }, 200);
    
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
    navigate,
    refreshConnection,
    checkAuthAndRedirect
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
        navigate(addStagingPrefix('/'), { replace: true });
      }
    }
  }, [isAdminRoute, roleChecked, isChecking, isAdmin, navigate]);

  // Fix for QuickBooks callback handling
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
    return <Navigate to={addStagingPrefix("/dashboard")} replace />;
  }

  // Redirect unauthenticated users to login
  if (requiresAuth && !user) {
    return <Navigate to={addStagingPrefix("/login")} state={{ from: location }} replace />;
  }
  
  // For admin routes, only check if we've completed the role check
  if (requiresAdmin && roleChecked && !isAdmin) {
    console.log("RouteGuard: Admin route access denied, redirecting to home");
    return <Navigate to={addStagingPrefix("/")} replace />;
  }
  
  // Special case: don't redirect from the authenticate route if we don't have a connection
  if (isAuthenticateRoute && !hasQbConnection && !isConnected) {
    return <>{children}</>;
  }

  // If all requirements are met, render the children
  return <>{children}</>;
};

export default RouteGuard;

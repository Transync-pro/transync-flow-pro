
import { useEffect, useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickbooks } from '@/contexts/QuickbooksContext';
import { checkQBConnectionExists } from '@/services/quickbooksApi/connections';
import { isUserAdmin } from '@/services/blog/users';
import { toast } from '@/components/ui/use-toast';

interface RouteGuardProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  requiresQuickbooks?: boolean;
  requiresAdmin?: boolean;
}

export default function RouteGuard({ 
  children, 
  requiresAuth = true, 
  requiresQuickbooks = false,
  requiresAdmin = false
}: RouteGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isConnected, isLoading: isQBLoading, refreshConnection } = useQuickbooks();
  const [isChecking, setIsChecking] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const hasNavigated = useRef(false);
  const redirectingRef = useRef(false);

  // Track current path type
  const isDashboardRoute = location.pathname === '/dashboard';
  const isAuthenticateRoute = location.pathname === '/authenticate';
  const isQbCallbackRoute = location.pathname.includes('/quickbooks-callback');
  const isDisconnectedRoute = location.pathname === '/disconnected';
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Handle authentication check
  useEffect(() => {
    if (!requiresAuth) return;
    
    if (isAuthLoading) return;

    if (!user && !isAuthLoading && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate('/login', { replace: true });
    }
  }, [user, isAuthLoading, navigate, requiresAuth]);

  // Check admin role when needed
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      try {
        console.log("RouteGuard: Checking admin role for user");
        const adminStatus = await isUserAdmin();
        console.log("RouteGuard: Admin status:", adminStatus);
        
        setIsAdmin(adminStatus);
        setRoleChecked(true);
      } catch (error) {
        console.error("RouteGuard: Error checking admin role:", error);
        setIsAdmin(false);
        setRoleChecked(true);
      }
    };

    if ((requiresAdmin || isAdminRoute) && user) {
      checkAdminRole();
    } else {
      setRoleChecked(true);
    }
  }, [user, requiresAdmin, isAdminRoute]);

  // Handle QuickBooks connection check
  useEffect(() => {
    if (!requiresQuickbooks || !user || isAuthLoading || hasNavigated.current) {
      return;
    }

    // Skip checks in callback route
    if (isQbCallbackRoute) {
      return;
    }

    // Check for recent auth success flags
    const authSuccess = sessionStorage.getItem('qb_auth_success') === 'true';
    const authTimestamp = sessionStorage.getItem('qb_connection_timestamp');
    const isRecentAuth = authTimestamp && 
      (Date.now() - parseInt(authTimestamp, 10) < 30000);

    // If we have recent auth success and we're connected, allow access
    if (authSuccess && isRecentAuth && isConnected) {
      return;
    }

    let isMounted = true;
    const checkConnection = async () => {
      try {
        setIsChecking(true);

        // If we're already connected according to context, we're good
        if (isConnected) {
          if (isMounted) setIsChecking(false);
          return;
        }

        // Check connection directly from database
        const hasConnection = await checkQBConnectionExists(user.id);
        
        if (!isMounted) return;

        if (hasConnection) {
          // Connection exists, refresh context
          if (!isConnected) {
            await refreshConnection();
          }
        } else if (isDashboardRoute && !hasNavigated.current) {
          // No connection and we're on dashboard, redirect to authenticate
          hasNavigated.current = true;
          navigate('/authenticate', { replace: true });
        }
      } catch (error) {
        console.error('Error in RouteGuard connection check:', error);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };

    // Only check if we're not already loading
    if (!isQBLoading) {
      checkConnection();
    }

    return () => { isMounted = false; };
  }, [
    user,
    isQBLoading,
    isConnected,
    requiresQuickbooks,
    isDashboardRoute,
    isQbCallbackRoute,
    refreshConnection,
    navigate,
    isAuthLoading
  ]);

  // Handle redirection based on connection status
  useEffect(() => {
    // Don't process redirects while still checking or for QB callback route
    if (isChecking || isQbCallbackRoute || redirectingRef.current) return;

    // Set redirecting flag to prevent multiple redirects
    redirectingRef.current = true;

    // Use a timeout to ensure the component has time to update state before redirecting
    setTimeout(() => {
      // Handle disconnected page logic
      if (isDisconnectedRoute) {
        if (isConnected) {
          navigate('/dashboard', { replace: true });
        }
        redirectingRef.current = false;
        return;
      }

      // If we need QB connection but don't have one, redirect to disconnected
      if (requiresQuickbooks && !isConnected && !isQBLoading) {
        // Store the current location to redirect back after connecting
        sessionStorage.setItem('qb_redirect_after_connect', location.pathname);
        navigate('/disconnected', { replace: true });
        redirectingRef.current = false;
        return;
      }

      // Handle admin routes
      if (requiresAdmin && !isAdmin && roleChecked) {
        console.log('RouteGuard: User is not an admin, redirecting to home');
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin area.",
          variant: "destructive"
        });
        navigate('/', { replace: true });
        redirectingRef.current = false;
        return;
      }

      redirectingRef.current = false;
    }, 0);
  }, [
    isChecking,
    isConnected,
    location.pathname,
    navigate,
    requiresQuickbooks,
    requiresAdmin,
    isAdmin,
    roleChecked,
    user,
    isQbCallbackRoute,
    isQBLoading,
    isDisconnectedRoute
  ]);

  // Reset navigation flag on route change
  useEffect(() => {
    hasNavigated.current = false;
  }, [location.pathname]);

  if (isAuthLoading || isChecking) {
    return null;
  }

  // Don't render anything if user is required but not present
  if (requiresAuth && !user) {
    return null;
  }

  // For admin routes, only check if we've completed the role check
  if (requiresAdmin && roleChecked && !isAdmin) {
    console.log("RouteGuard: Admin route access denied, redirecting to home");
    return null;
  }

  return <>{children}</>;
}

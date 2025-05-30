import { useEffect, useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickbooks } from '@/contexts/QuickbooksContext';
import { checkQBConnectionExists } from '@/services/quickbooksApi/connections';

interface RouteGuardProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  requiresQuickbooks?: boolean;
}

export default function RouteGuard({ 
  children, 
  requiresAuth = true, 
  requiresQuickbooks = false 
}: RouteGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isConnected, isLoading: isQBLoading, refreshConnection } = useQuickbooks();
  const [isChecking, setIsChecking] = useState(false);
  const hasNavigated = useRef(false);

  // Track current path type
  const isDashboardRoute = location.pathname === '/dashboard';
  const isAuthenticateRoute = location.pathname === '/authenticate';
  const isQbCallbackRoute = location.pathname.includes('/quickbooks-callback');
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Log path information on every render
  console.log(`RouteGuard: Current path: ${location.pathname}, isAdminRoute: ${isAdminRoute}, requiresQuickbooks: ${requiresQuickbooks}`);

  // Handle authentication check
  useEffect(() => {
    if (!requiresAuth) return;
    
    if (isAuthLoading) return;

    if (!user && !isAuthLoading && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate('/login', { replace: true });
    }
  }, [user, isAuthLoading, navigate, requiresAuth]);

  // Handle QuickBooks connection check
  useEffect(() => {
    // Skip if this is an admin route - NEVER check QuickBooks for admin routes
    if (isAdminRoute) {
      console.log(`RouteGuard: Admin route detected (${location.pathname}), skipping QuickBooks check entirely`);
      return;
    }
    
    // Skip for other conditions
    if (!requiresQuickbooks || !user || isAuthLoading || hasNavigated.current) {
      console.log(`RouteGuard: Skipping QuickBooks check for path: ${location.pathname}, requiresQuickbooks: ${requiresQuickbooks}, user: ${!!user}, isAuthLoading: ${isAuthLoading}, hasNavigated: ${hasNavigated.current}`);
      return;
    }

    // Skip checks in callback route
    if (isQbCallbackRoute) {
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
          console.log('RouteGuard: No QuickBooks connection, redirecting to authenticate');
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
    isAuthLoading,
    isAdminRoute,
    location.pathname
  ]);

  // Reset navigation flag on route change
  useEffect(() => {
    console.log(`RouteGuard: Path changed to ${location.pathname}, resetting navigation flag`);
    hasNavigated.current = false;
  }, [location.pathname]);

  // Set a fake "connected" state for admin routes to prevent any QuickBooks-related redirects
  useEffect(() => {
    if (isAdminRoute && user) {
      // For admin routes, we don't need to check QuickBooks connection at all
      console.log(`RouteGuard: Admin route detected (${location.pathname}), setting isChecking to false`);
      setIsChecking(false);
    }
  }, [isAdminRoute, user, location.pathname]);

  if (isAuthLoading || isChecking) {
    console.log(`RouteGuard: Loading state - isAuthLoading: ${isAuthLoading}, isChecking: ${isChecking}`);
    return null;
  }

  return <>{children}</>;
}

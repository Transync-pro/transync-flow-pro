
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
    // Skip QuickBooks check for admin routes or when not required
    const isAdminRoute = location.pathname.startsWith('/admin/');
    const shouldSkipQuickbooksCheck = isAdminRoute || !requiresQuickbooks;
    
    if (shouldSkipQuickbooksCheck) {
      console.log('Skipping QuickBooks check for route:', location.pathname);
      return;
    }

    // Add a debug delay to prevent immediate redirect
    const debugDelay = async () => {
      console.log('🔴 DEBUG: Adding 5 second delay to prevent immediate redirect');
      console.log('Current path:', window.location.pathname);
      console.log('requiresQuickbooks:', requiresQuickbooks);
      console.log('isAuthLoading:', isAuthLoading);
      console.log('hasNavigated.current:', hasNavigated.current);
      
      // Add a 5-second delay for debugging
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      if (!user || isAuthLoading || hasNavigated.current) {
        console.log('Skipping QuickBooks check - missing user, loading, or already navigated');
        return;
      }
      
      // Rest of your QuickBooks check logic here
      console.log('Continuing with QuickBooks check...');
    };
    
    debugDelay();

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

  // Reset navigation flag on route change
  useEffect(() => {
    hasNavigated.current = false;
  }, [location.pathname]);

  if (isAuthLoading || isChecking) {
    return null;
  }

  return <>{children}</>;
}

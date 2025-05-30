
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
    // Skip QuickBooks check for admin routes
    const isAdminRoute = location.pathname.startsWith('/admin/');
    
    if (isAdminRoute) {
      console.log('🟢 Admin route detected, skipping QuickBooks check');
      return undefined; // Return undefined to prevent cleanup warning
    }
    
    // Skip if QuickBooks check is not required
    if (!requiresQuickbooks) {
      console.log('🟡 QuickBooks check not required for route:', location.pathname);
      return undefined;
    }
    
    // Skip if we're still loading or already navigated
    if (!user || isAuthLoading || hasNavigated.current) {
      console.log('🟡 Skipping QuickBooks check - missing user, loading, or already navigated');
      return undefined;
    }
    
    console.log('🔵 Starting QuickBooks check for route:', location.pathname);
    
    // Skip checks in callback route
    if (isQbCallbackRoute) {
      console.log('🟡 Skipping QuickBooks check - in callback route');
      return undefined;
    }

    // Check for recent auth success flags
    const authSuccess = sessionStorage.getItem('qb_auth_success') === 'true';
    const authTimestamp = sessionStorage.getItem('qb_connection_timestamp');
    const isRecentAuth = authTimestamp && 
      (Date.now() - parseInt(authTimestamp, 10) < 30000);

    // If we have recent auth success and we're connected, allow access
    if (authSuccess && isRecentAuth && isConnected) {
      console.log('🟢 Using cached QuickBooks connection');
      return undefined;
    }

    let isMounted = true;
    
    const checkConnection = async () => {
      try {
        console.log('🔍 Checking QuickBooks connection...');
        setIsChecking(true);

        // If we're already connected according to context, we're good
        if (isConnected) {
          console.log('🟢 Already connected to QuickBooks');
          if (isMounted) setIsChecking(false);
          return;
        }


        // Check connection directly from database
        console.log('🔍 Checking QuickBooks connection in database...');
        const hasConnection = await checkQBConnectionExists(user.id);
        
        if (!isMounted) return;

        if (hasConnection) {
          console.log('🟢 QuickBooks connection found in database');
          // Connection exists, refresh context
          if (!isConnected) {
            console.log('🔄 Refreshing QuickBooks connection context...');
            await refreshConnection();
          }
        } else if (isDashboardRoute && !hasNavigated.current) {
          // No connection and we're on dashboard, redirect to authenticate
          console.log('🔴 No QuickBooks connection, redirecting to authenticate');
          hasNavigated.current = true;
          navigate('/authenticate', { replace: true });
        }
      } catch (error) {
        console.error('Error in RouteGuard connection check:', error);
      } finally {
        if (isMounted) {
          console.log('✅ QuickBooks check complete');
          setIsChecking(false);
        }
      }
    };

    // Only check if we're not already loading
    if (!isQBLoading) {
      console.log('🚀 Starting QuickBooks connection check');
      checkConnection();
    } else {
      console.log('⏳ QuickBooks check already in progress');
    }

    return () => { 
      console.log('🧹 Cleaning up QuickBooks check');
      isMounted = false; 
    };
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

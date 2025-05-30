import { useEffect, useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickbooks } from '@/contexts/QuickbooksContext';
import { checkQBConnectionExists } from '@/services/quickbooksApi/connections';

interface RouteGuardProps {
  children: React.ReactNode;
  requiresQuickbooks?: boolean;
}

export default function RouteGuard({ children, requiresQuickbooks = false }: RouteGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isConnected, isLoading: isQBLoading, refreshConnection } = useQuickbooks();
  const [isChecking, setIsChecking] = useState(false);
  const [hasQbConnection, setHasQbConnection] = useState(false);
  const connectionCheckAttempts = useRef(0);

  // Track current path type
  const isDashboardRoute = location.pathname === '/dashboard';
  const isAuthenticateRoute = location.pathname === '/authenticate';
  const isQbCallbackRoute = location.pathname.includes('/quickbooks-callback');

  // Check if we're in a direct auth flow
  const isDirectAuthFlow = useCallback(() => {
    const params = new URLSearchParams(location.search);
    const direct = params.get('direct');
    const connected = params.get('connected');
    const authSuccess = sessionStorage.getItem('qb_auth_success') === 'true';
    const authTimestamp = sessionStorage.getItem('qb_connection_timestamp');
    const isRecentAuth = authTimestamp && 
      (Date.now() - parseInt(authTimestamp, 10) < 30000); // 30 second window

    return (
      ((direct === '1' && connected === '1') || sessionStorage.getItem('qb_direct_auth') === 'true') && 
      (authSuccess && isRecentAuth)
    );
  }, [location.search]);

  // Handle QuickBooks connection check
  useEffect(() => {
    if (!requiresQuickbooks || !user || isAuthLoading) {
      setIsChecking(false);
      return;
    }

    // Skip checks in callback route
    if (isQbCallbackRoute) {
      setIsChecking(false);
      return;
    }

    // If we're in direct auth flow, allow access and skip checks
    if (isDirectAuthFlow()) {
      setHasQbConnection(true);
      setIsChecking(false);
      // Clear direct auth flags after successful check
      sessionStorage.removeItem('qb_direct_auth');
      return;
    }

    let isMounted = true;
    const checkConnection = async () => {
      try {
        setIsChecking(true);

        // If we're already connected according to context, we're good
        if (isConnected) {
          setHasQbConnection(true);
          if (isMounted) setIsChecking(false);
          return;
        }

        // If we have recent auth success, try refreshing connection first
        const authSuccess = sessionStorage.getItem('qb_auth_success') === 'true';
        const authTimestamp = sessionStorage.getItem('qb_connection_timestamp');
        const isRecentAuth = authTimestamp && 
          (Date.now() - parseInt(authTimestamp, 10) < 30000);

        if (authSuccess && isRecentAuth && connectionCheckAttempts.current === 0) {
          await refreshConnection();
          if (!isMounted) return;
          
          // After refresh, check if we're connected
          if (isConnected) {
            setHasQbConnection(true);
            setIsChecking(false);
            return;
          }
        }

        // Increment attempt counter
        connectionCheckAttempts.current++;

        // Only check database after a short delay on first attempt
        if (connectionCheckAttempts.current === 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (!isMounted) return;
        }

        // Check connection directly
        const hasConnection = await checkQBConnectionExists(user.id);
        
        if (!isMounted) return;

        if (hasConnection) {
          setHasQbConnection(true);
          if (!isConnected) {
            refreshConnection();
          }
        } else if (isDashboardRoute && !isAuthenticateRoute && connectionCheckAttempts.current > 1) {
          navigate('/authenticate', { replace: true });
        }
      } catch (error) {
        console.error('Error in RouteGuard connection check:', error);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };

    checkConnection();
    return () => { isMounted = false; };
  }, [
    user,
    isQBLoading,
    isConnected,
    requiresQuickbooks,
    isDashboardRoute,
    isAuthenticateRoute,
    isQbCallbackRoute,
    isDirectAuthFlow,
    refreshConnection,
    navigate,
    isAuthLoading
  ]);

  // Reset connection check attempts on route change
  useEffect(() => {
    connectionCheckAttempts.current = 0;
  }, [location.pathname]);

  // Handle authentication check
  useEffect(() => {
    if (isAuthLoading) return;

    if (!user && !isAuthLoading) {
      navigate('/login', { replace: true });
    }
  }, [user, isAuthLoading, navigate]);

  if (isAuthLoading || isChecking) {
    return null;
  }

  return <>{children}</>;
}

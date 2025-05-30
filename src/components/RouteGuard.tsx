import { ReactNode, useEffect, useState, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickbooks } from '@/contexts/QuickbooksContext';
import { checkQBConnectionExists } from '@/services/quickbooksApi/connections';
import { toast } from '@/components/ui/use-toast';
import { isUserAdmin } from '@/services/blog/users';

interface RouteGuardProps {
  children: ReactNode;
  requiresAuth?: boolean;
  requiresQuickbooks?: boolean;
  requiresAdmin?: boolean;
}

const RouteGuard = ({
  children,
  requiresAuth = true,
  requiresQuickbooks = false,
  requiresAdmin = false,
}: RouteGuardProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isConnected, isLoading: isQBLoading, refreshConnection } = useQuickbooks();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const hasNavigated = useRef(false);

  // Track current path type
  const isDashboardRoute = location.pathname === '/dashboard';
  const isAuthenticateRoute = location.pathname === '/authenticate';
  const isQbCallbackRoute = location.pathname.includes('/quickbooks-callback');
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Handle authentication check
  useEffect(() => {
    if (!requiresAuth) {
      setRoleChecked(true);
      return;
    }
    
    if (isAuthLoading) return;

    if (!user && !isAuthLoading && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [user, isAuthLoading, navigate, requiresAuth, location]);

  // Handle admin role check
  useEffect(() => {
    if ((!requiresAdmin && !isAdminRoute) || !user) {
      setRoleChecked(true);
      return;
    }

    const checkAdminRole = async () => {
      try {
        const adminStatus = await isUserAdmin();
        console.log("RouteGuard: Is user admin:", adminStatus);
        setIsAdmin(adminStatus);

        if (requiresAdmin && !adminStatus) {
          console.log("RouteGuard: User does not have admin role, redirecting to homepage");
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin area.",
            variant: "destructive"
          });
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error("RouteGuard: Error checking admin role:", error);
        if (requiresAdmin) {
          toast({
            title: "Access Error",
            description: "Failed to verify admin permissions.",
            variant: "destructive"
          });
          navigate('/', { replace: true });
        }
      } finally {
        setRoleChecked(true);
      }
    };

    checkAdminRole();
  }, [user, requiresAdmin, isAdminRoute, navigate]);

  // Check QuickBooks connection if required
  useEffect(() => {
    if (!requiresQuickbooks || !user || isAuthLoading || hasNavigated.current) {
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

    return () => {
      isMounted = false;
    };
  }, [user, isQBLoading, isConnected, refreshConnection, navigate, requiresQuickbooks, isDashboardRoute, isAuthLoading, isQbCallbackRoute]);

  // Show loading state while checking
  if (isAuthLoading || (requiresAdmin && !roleChecked) || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (requiresAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect non-admin users away from admin pages
  if (requiresAdmin && roleChecked && !isAdmin) {
    console.log("RouteGuard: Admin route access denied, redirecting to home");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;


import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Loader2 } from "lucide-react";
import { logError } from "@/utils/errorLogger";
import { checkQBConnectionExists, clearConnectionCache } from "@/services/quickbooksApi/connections";
import { isUserAdmin } from "@/services/blog/users";
import { toast } from "@/components/ui/use-toast";
import TrialExpiredModal from "@/components/TrialExpiredModal";

interface RouteGuardProps {
  children: ReactNode;
  requiresAuth?: boolean;
  requiresQuickbooks?: boolean;
  isPublicOnly?: boolean;
  requiresAdmin?: boolean;
  requiresActiveSubscription?: boolean;
}

const RouteGuard = ({ 
  children, 
  requiresAuth = true, 
  requiresQuickbooks = false,
  isPublicOnly = false,
  requiresAdmin = false,
  requiresActiveSubscription = false
}: RouteGuardProps) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected, isLoading: isQBLoading, refreshConnection } = useQuickbooks();
  const { subscriptionData, isTrialExpired, isOnTrial } = useSubscription();
  const [isChecking, setIsChecking] = useState(false);
  const [hasQbConnection, setHasQbConnection] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Flag special routes
  const isQbCallbackRoute = location.pathname === "/dashboard/quickbooks-callback";
  const isAuthenticateRoute = location.pathname === "/authenticate";
  const isDashboardRoute = location.pathname === "/dashboard";
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isLoginPage = location.pathname === "/login";
  const isSignupPage = location.pathname === "/signup";

  console.log("RouteGuard: Rendering for path:", location.pathname, {
    user: user?.id || "none",
    isAuthLoading,
    isQBLoading,
    isConnected,
    requiresAuth,
    requiresQuickbooks,
    isPublicOnly,
    hasRedirected
  });

  // Initialize loading state based on auth loading
  useEffect(() => {
    setIsLoading(isAuthLoading);
  }, [isAuthLoading]);

  // Check admin role if needed
  useEffect(() => {
    if (!requiresAdmin && !isAdminRoute) {
      setRoleChecked(true);
      return;
    }

    if (isAuthLoading || !user) {
      return;
    }

    let isMounted = true;

    const checkAdminRole = async () => {
      try {
        console.log("RouteGuard: Checking admin role for user:", user.id);
        const adminStatus = await isUserAdmin();
        
        if (isMounted) {
          setIsAdmin(adminStatus);
          setRoleChecked(true);
        }
      } catch (error) {
        console.error("RouteGuard: Error checking admin role:", error);
        if (isMounted) {
          setIsAdmin(false);
          setRoleChecked(true);
        }
      }
    };

    checkAdminRole();

    return () => {
      isMounted = false;
    };
  }, [requiresAdmin, isAdminRoute, user, isAuthLoading]);

  // Check QuickBooks connection if needed
  useEffect(() => {
    if (!requiresQuickbooks || isQbCallbackRoute || isAuthenticateRoute || !user || isAuthLoading) {
      setIsChecking(false);
      return;
    }

    let isMounted = true;

    const checkQbConnection = async () => {
      try {
        setIsChecking(true);
        console.log("RouteGuard: Checking QB connection for user:", user.id);
        
        const connectionExists = await checkQBConnectionExists(user.id);
        
        if (isMounted) {
          setHasQbConnection(connectionExists);
          setIsChecking(false);
        }
      } catch (error) {
        console.error("RouteGuard: Error checking QB connection:", error);
        if (isMounted) {
          setHasQbConnection(false);
          setIsChecking(false);
        }
      }
    };

    checkQbConnection();

    return () => {
      isMounted = false;
    };
  }, [requiresQuickbooks, user, isAuthLoading, isQbCallbackRoute, isAuthenticateRoute]);

  // Handle subscription requirements
  useEffect(() => {
    if (requiresActiveSubscription && user && subscriptionData && isTrialExpired) {
      setShowTrialModal(true);
    }
  }, [requiresActiveSubscription, user, subscriptionData, isTrialExpired]);

  // Determine if we should show loading
  const shouldShowLoading = isAuthLoading || 
    (requiresAdmin && !roleChecked) || 
    (requiresQuickbooks && isChecking && !isQbCallbackRoute);

  // Early returns for special cases
  if (isQbCallbackRoute) {
    return <>{children}</>;
  }

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-600">Verifying your access...</p>
      </div>
    );
  }

  // Show trial modal if needed
  if (showTrialModal && requiresActiveSubscription) {
    return (
      <>
        <TrialExpiredModal 
          isOpen={showTrialModal} 
          onClose={() => setShowTrialModal(false)}
        />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Trial Expired</h2>
            <p className="text-gray-600 mb-6">Your free trial has ended. Please subscribe to continue using this feature.</p>
            <button
              onClick={() => navigate('/subscription')}
              className="bg-transyncpro-button text-white px-6 py-3 rounded-lg hover:bg-transyncpro-button/90"
            >
              View Plans
            </button>
          </div>
        </div>
      </>
    );
  }

  // Handle redirects - only redirect once per route change
  if (!hasRedirected && !isAuthLoading) {
    // Public only routes - redirect authenticated users
    if (isPublicOnly && user) {
      console.log("RouteGuard: Redirecting authenticated user from public-only route");
      setHasRedirected(true);
      return <Navigate to="/dashboard" replace />;
    }

    // Auth required routes - redirect unauthenticated users
    if (requiresAuth && !user) {
      console.log("RouteGuard: Redirecting unauthenticated user to login");
      setHasRedirected(true);
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Admin routes - check admin access
    if (requiresAdmin && roleChecked && !isAdmin) {
      console.log("RouteGuard: Redirecting non-admin user from admin route");
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin area.",
        variant: "destructive"
      });
      setHasRedirected(true);
      return <Navigate to="/" replace />;
    }

    // QuickBooks routes - check connection
    if (requiresQuickbooks && user && !hasQbConnection && !isConnected && !isAuthenticateRoute) {
      console.log("RouteGuard: Redirecting to authenticate due to no QB connection");
      setHasRedirected(true);
      return <Navigate to="/authenticate" replace />;
    }

    // Authenticate route - redirect if already connected
    if (isAuthenticateRoute && (hasQbConnection || isConnected)) {
      console.log("RouteGuard: Redirecting from authenticate route - already connected");
      setHasRedirected(true);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Reset redirect flag when location changes
  useEffect(() => {
    setHasRedirected(false);
  }, [location.pathname]);

  // If all checks pass, render children
  return <>{children}</>;
};

export default RouteGuard;

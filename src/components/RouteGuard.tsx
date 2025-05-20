
import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { Loader2 } from "lucide-react";
import { logError } from "@/utils/errorLogger";
import { checkQBConnectionExists } from "@/services/quickbooksApi/connections";
import { isUserAdmin } from "@/services/blog/users";
import { toast } from "@/components/ui/use-toast";

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
  
  // Flag special routes
  const isQbCallbackRoute = location.pathname === "/dashboard/quickbooks-callback";
  const isDisconnectedRoute = location.pathname === "/disconnected";
  const isDashboardRoute = location.pathname === "/dashboard";
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Flag to prevent multiple redirects
  const redirectingRef = useRef(false);
  
  // Track if this is the first check after mount
  const isInitialCheck = useRef(true);
  
  // Direct database check for QuickBooks connection with better caching
  const checkQbConnectionDirectly = useCallback(async () => {
    if (!user) {
      return false;
    }
    
    try {
      // Use the optimized connection check function
      const connectionExists = await checkQBConnectionExists(user.id);
      console.log('RouteGuard: Direct QB connection check result:', connectionExists);
      
      setHasQbConnection(connectionExists);
      
      // If we found a connection but the context doesn't know yet, refresh it once
      if (connectionExists && !isConnected && !isQBLoading) {
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
        setIsLoading(false);
      } catch (error) {
        console.error("RouteGuard: Error checking admin role:", error);
        setIsAdmin(false);
        setRoleChecked(true);
        setIsLoading(false);
      }
    };
    
    if ((requiresAdmin || isAdminRoute) && user) {
      checkAdminRole();
    } else {
      setRoleChecked(true);
      setIsLoading(false);
    }
  }, [user, requiresAdmin, isAdminRoute]);

  // Check access on mount and when dependencies change
  useEffect(() => {
    const checkAccess = async () => {
      // Wait for auth to load first
      if (isAuthLoading) return;
      
      // Skip QB check for special routes
      if (isQbCallbackRoute) {
        setIsChecking(false);
        return;
      }
      
      // If we need QuickBooks and are not yet on the disconnected page, do direct DB check
      if (user && requiresQuickbooks && !isDisconnectedRoute) {
        await checkQbConnectionDirectly();
      } 
      
      if (!requiresAdmin || roleChecked) {
        setIsChecking(false);
      }
      
      // Reset the initial check flag after first run
      isInitialCheck.current = false;
    };
    
    checkAccess();
  }, [
    isAuthLoading, 
    requiresQuickbooks, 
    user, 
    checkQbConnectionDirectly, 
    isQbCallbackRoute, 
    isDisconnectedRoute,
    requiresAdmin,
    roleChecked
  ]);

  // Handle redirection based on connection status
  useEffect(() => {
    // Don't process redirects while still checking or for QB callback route
    if (isChecking || isQbCallbackRoute || redirectingRef.current || isLoading) return;
    
    // Set redirecting flag to prevent multiple redirects
    redirectingRef.current = true;
    
    // Use a timeout to ensure the component has time to update state before redirecting
    setTimeout(() => {
      // Handle disconnected page logic
      if (isDisconnectedRoute) {
        if (hasQbConnection || isConnected) {
          console.log('RouteGuard: Connection found while on disconnected page, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        }
        redirectingRef.current = false;
        return;
      }
      
      // Handle QuickBooks requirement for other pages
      if (requiresQuickbooks && user && !hasQbConnection && !isConnected && !isQBLoading) {
        console.log('RouteGuard: No QuickBooks connection found, redirecting to /disconnected');
        navigate('/disconnected', { replace: true });
        redirectingRef.current = false;
        return;
      }
      
      // Handle admin routes - only redirect if we've completed the role check
      if (requiresAdmin && roleChecked && !isAdmin) {
        console.log('RouteGuard: User is not an admin, redirecting to home');
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin area.",
          variant: "destructive"
        });
        navigate('/', { replace: true });
      }
      
      redirectingRef.current = false;
    }, 100);
  }, [
    isChecking,
    hasQbConnection,
    isConnected,
    isDisconnectedRoute,
    requiresQuickbooks,
    requiresAdmin,
    isAdmin,
    roleChecked,
    user,
    isQbCallbackRoute,
    isQBLoading,
    isLoading,
    navigate,
    location.pathname
  ]);

  // Special admin route check - this ensures we don't redirect until admin check is complete
  useEffect(() => {
    if (isAdminRoute && roleChecked && !isChecking && !isLoading) {
      if (!isAdmin) {
        console.log('RouteGuard: Admin route access denied after check completed');
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin area.",
          variant: "destructive"
        });
        navigate('/', { replace: true });
      }
    }
  }, [isAdminRoute, roleChecked, isChecking, isAdmin, navigate]);

  // Fix for QuickBooks callback handling - a special case to always render children
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
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect unauthenticated users to login
  if (requiresAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // For admin routes, only check if we've completed the role check
  if (requiresAdmin && roleChecked && !isAdmin) {
    console.log("RouteGuard: Admin route access denied, redirecting to home");
    return <Navigate to="/" replace />;
  }
  
  // Special case: don't redirect from the disconnected route if we don't have a connection
  if (isDisconnectedRoute && !hasQbConnection && !isConnected) {
    return <>{children}</>;
  }

  // If all requirements are met, render the children
  return <>{children}</>;
};

export default RouteGuard;

import React, { useEffect, useState, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { addStagingPrefix, removeStagingPrefix } from "@/config/environment";

interface RouteGuardProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  requiresQuickbooks?: boolean;
}

const RouteGuard = ({ 
  children, 
  requiresAuth = true, 
  requiresQuickbooks = false 
}: RouteGuardProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { isConnected, isLoading: qbLoading, checkConnection } = useQuickbooks();
  const location = useLocation();
  const navigate = useNavigate();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const hasCheckedConnection = useRef(false);

  const checkAuthAndRedirect = React.useCallback(() => {
    if (authLoading) return;

    if (requiresAuth && !user) {
      const currentPath = location.pathname;
      navigate('/login', { 
        state: { 
          redirectAfter: currentPath 
        },
        replace: true 
      });
      return;
    }

    if (requiresQuickbooks && user && !isConnected && !qbLoading) {
      navigate('/authenticate', { replace: true });
      return;
    }
  }, [authLoading, requiresAuth, user, requiresQuickbooks, isConnected, qbLoading, location.pathname, navigate]);

  useEffect(() => {
    checkAuthAndRedirect();
    setIsInitialLoad(false);
  }, [checkAuthAndRedirect]);

  useEffect(() => {
    if (requiresQuickbooks && user && !isConnected && !hasCheckedConnection.current) {
      hasCheckedConnection.current = true;
      checkConnection(true, true)
        .then(() => {
          hasCheckedConnection.current = false;
        })
        .catch(error => {
          console.error("Error checking QuickBooks connection:", error);
          toast({
            title: "Error",
            description: "Failed to check QuickBooks connection. Please try again.",
            variant: "destructive",
          });
          hasCheckedConnection.current = false;
        });
    }
  }, [requiresQuickbooks, user, isConnected, checkConnection]);

  // Show loading state while checking authentication or QuickBooks connection
  if (authLoading || (requiresQuickbooks && qbLoading && isInitialLoad)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check authentication requirements
  if (requiresAuth && !user) {
    const currentPath = location.pathname;
    return <Navigate to="/login" state={{ redirectAfter: currentPath }} replace />;
  }

  // Check QuickBooks connection requirements
  if (requiresQuickbooks && user && !isConnected) {
    return <Navigate to="/authenticate" replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;

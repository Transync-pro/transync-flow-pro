
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { Loader2 } from "lucide-react";

interface RouteGuardProps {
  children: ReactNode;
  requiresAuth?: boolean;
  requiresQuickbooks?: boolean;
}

const RouteGuard = ({ 
  children, 
  requiresAuth = true, 
  requiresQuickbooks = false 
}: RouteGuardProps) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isConnected, isLoading: isQbLoading } = useQuickbooks();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (!isAuthLoading && (!isQbLoading || !requiresQuickbooks)) {
      setIsChecking(false);
    }
  }, [isAuthLoading, isQbLoading, requiresQuickbooks]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-600">Verifying your access...</p>
      </div>
    );
  }

  if (requiresAuth && !user) {
    // Redirect to login if authentication is required but user is not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiresQuickbooks && !isConnected) {
    // Redirect to QuickBooks connect page if QuickBooks connection is required but not connected
    return <Navigate to="/connect-quickbooks" state={{ from: location }} replace />;
  }

  // If all requirements are met, render the children
  return <>{children}</>;
};

export default RouteGuard;


import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { Loader2 } from "lucide-react";

interface RouteGuardProps {
  children: ReactNode;
  requiresAuth?: boolean;
  requiresQuickbooks?: boolean;
  isPublicOnly?: boolean;
}

const RouteGuard = ({ 
  children, 
  requiresAuth = true, 
  requiresQuickbooks = false,
  isPublicOnly = false
}: RouteGuardProps) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isConnected, isLoading: isQbLoading } = useQuickbooks();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  // Check connection status on every render for routes that require QuickBooks
  useEffect(() => {
    // Only finish checking when we have definitive auth and QB status (if required)
    if (!isAuthLoading && (!isQbLoading || !requiresQuickbooks)) {
      setIsChecking(false);
    }
  }, [isAuthLoading, isQbLoading, requiresQuickbooks]);
  
  // Force a re-check of QuickBooks connection every 10 seconds for protected routes
  useEffect(() => {
    // Only set up interval for routes requiring QuickBooks
    if (!requiresQuickbooks) return;
    
    const interval = setInterval(() => {
      // This will trigger the QuickbooksProvider to re-check connection status
      if (!isConnected && !isQbLoading) {
        console.log('RouteGuard: Detected disconnected QuickBooks state, redirecting...');
        setIsChecking(false); // Force re-render which will trigger redirect
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [requiresQuickbooks, isConnected, isQbLoading]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-600">Verifying your access...</p>
      </div>
    );
  }

  // Redirect authenticated users away from public-only pages (login, signup, etc.)
  if (isPublicOnly && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect unauthenticated users from protected pages to login
  if (requiresAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect users without QuickBooks connection to the disconnected page
  if (requiresQuickbooks && !isConnected) {
    return <Navigate to="/disconnected" state={{ from: location }} replace />;
  }

  // If all requirements are met, render the children
  return <>{children}</>;
};

export default RouteGuard;

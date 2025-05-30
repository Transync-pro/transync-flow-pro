import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isUserAdmin } from '@/services/blog/users';
import { toast } from '@/components/ui/use-toast';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

/**
 * A dedicated route guard for admin routes that only checks authentication
 * and admin status, but never QuickBooks connection.
 */
export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminChecking, setIsAdminChecking] = useState(true);

  // Handle authentication check
  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      console.log('AdminRouteGuard: No user, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    const checkAdminStatus = async () => {
      try {
        setIsAdminChecking(true);
        const adminStatus = await isUserAdmin();
        console.log(`AdminRouteGuard: Is user admin: ${adminStatus}`);
        
        if (!adminStatus) {
          console.log('AdminRouteGuard: User is not admin, redirecting to home');
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin area.",
            variant: "destructive"
          });
          navigate('/', { replace: true });
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error('AdminRouteGuard: Error checking admin status:', error);
        toast({
          title: "Error",
          description: "Failed to verify admin permissions",
          variant: "destructive"
        });
        navigate('/', { replace: true });
      } finally {
        setIsAdminChecking(false);
      }
    };

    checkAdminStatus();
  }, [user, isAuthLoading, navigate]);

  if (isAuthLoading || isAdminChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        <p className="ml-3 text-gray-600">Verifying access...</p>
      </div>
    );
  }

  // Only render children if user is authenticated and is admin
  if (user && isAdmin) {
    return <>{children}</>;
  }

  return null;
}

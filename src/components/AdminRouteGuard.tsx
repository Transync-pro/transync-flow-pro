
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { isUserAdmin } from '@/services/blog/users';

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isLoading) return;

      if (!user) {
        // Store the intended URL before redirecting to login
        sessionStorage.setItem('returnTo', window.location.pathname);
        navigate('/login');
        return;
      }

      try {
        setIsCheckingAdmin(true);
        console.log('AdminRouteGuard: Checking admin status for user:', user.id);
        
        const adminStatus = await isUserAdmin();
        console.log('AdminRouteGuard: Admin status result:', adminStatus);
        
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          console.log('User is not an admin, redirecting to dashboard');
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page',
            variant: 'destructive'
          });
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('AdminRouteGuard: Error checking admin status:', error);
        toast({
          title: 'Error',
          description: 'Failed to verify admin access',
          variant: 'destructive'
        });
        navigate('/dashboard');
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, isLoading, navigate]);

  // Show loading state while checking auth or admin status
  if (isLoading || isCheckingAdmin || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Only render children if user is confirmed to be an admin
  if (isAdmin) {
    return <>{children}</>;
  }

  // Return null if not admin (navigation will have already occurred)
  return null;
}

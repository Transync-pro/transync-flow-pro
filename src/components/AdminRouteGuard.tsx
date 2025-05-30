import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Store the intended URL before redirecting to login
      sessionStorage.setItem('returnTo', window.location.pathname);
      navigate('/login');
      return;
    }

    // Check all possible locations for admin role
    const isAdmin = (
      user.user_metadata?.role === 'admin' ||
      user.app_metadata?.role === 'admin' ||
      user.app_metadata?.authorization?.roles?.includes('admin')
    );
    
    console.log('Admin check:', {
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata,
      isAdmin
    });
    
    if (!isAdmin) {
      console.log('User is not an admin, redirecting to dashboard');
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page',
        variant: 'destructive'
      });
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  // Show loading state while checking auth
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check admin role again in the render phase
  if (user.user_metadata?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}

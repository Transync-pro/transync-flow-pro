import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isUserAdmin } from '@/services/blog/users';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook to check if the current user has admin privileges
 * @param redirectPath Path to redirect to if user is not an admin (defaults to '/')
 * @returns Object containing admin status and loading state
 */
export function useAdminCheck(redirectPath = '/') {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsChecking(true);
      try {
        const adminStatus = await isUserAdmin();
        console.log(`Admin check: User is admin: ${adminStatus}`);
        
        if (!adminStatus) {
          console.log(`Admin check: User is not admin, redirecting to ${redirectPath}`);
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin area.",
            variant: "destructive"
          });
          navigate(redirectPath);
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error("Admin check: Error checking admin status:", error);
        toast({
          title: "Error",
          description: "Failed to verify admin permissions",
          variant: "destructive"
        });
        navigate(redirectPath);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminStatus();
  }, [navigate, redirectPath]);

  return { isAdmin, isChecking };
}

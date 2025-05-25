import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTabVisibility } from '@/contexts/TabVisibilityContext';
import { useAuth } from '@/contexts/AuthContext';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

/**
 * Component that handles restoring the last active route when a user
 * returns to the application after switching tabs.
 */
const RouteRestorer = () => {
  const { isVisible } = useTabVisibility();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, dismiss } = useToast();
  const wasVisibleRef = useRef(true);

  // Prevent toast notifications when switching back to the tab
  useEffect(() => {
    // Tab has become visible again after being hidden
    if (isVisible && !wasVisibleRef.current) {
      // Dismiss any existing toasts to prevent notification spam when returning to the tab
      const existingToasts = document.querySelectorAll('[role="status"]');
      existingToasts.forEach(toastElement => {
        const toastId = toastElement.id;
        if (toastId) {
          dismiss(toastId);
        }
      });
    }
    
    // Update the visibility ref
    wasVisibleRef.current = isVisible;
  }, [isVisible, dismiss]);

  // Restore the route when tab becomes visible again
  useEffect(() => {
    // Only attempt to restore route when tab becomes visible again
    // and the user is authenticated
    if (isVisible && user) {
      const lastRoute = sessionStorage.getItem('lastActiveRoute');
      
      // Check if we're on the dashboard page and there's a saved route to restore
      if (lastRoute && window.location.pathname === '/dashboard') {
        // Small delay to ensure the app is fully loaded
        const timer = setTimeout(() => {
          navigate(lastRoute, { replace: true }); // Use replace to avoid adding to history
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, navigate, user]);

  // This is a utility component that doesn't render anything
  return null;
};

export default RouteRestorer;

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
    // Only attempt to restore route when tab becomes visible again,
    // the user is authenticated, and we're coming back from a hidden state
    if (isVisible && !wasVisibleRef.current && user) {
      const lastRoute = sessionStorage.getItem('lastActiveRoute');
      const currentPath = window.location.pathname;
      
      // Only restore if we have a saved route and we're on the dashboard page
      // Make sure we don't redirect if we're already on the dashboard or a sub-route
      if (lastRoute && 
          currentPath === '/dashboard' && 
          lastRoute !== '/dashboard' && 
          !lastRoute.includes('quickbooks-callback')) {
        // Small delay to ensure the app is fully loaded
        const timer = setTimeout(() => {
          navigate(lastRoute, { replace: true }); // Use replace to avoid adding to history
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, wasVisibleRef, navigate, user]);

  // This is a utility component that doesn't render anything
  return null;
};

export default RouteRestorer;

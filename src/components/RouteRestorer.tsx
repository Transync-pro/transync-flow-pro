import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTabVisibility } from '@/contexts/TabVisibilityContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Component that handles restoring the last active route when a user
 * returns to the application after switching tabs.
 */
const RouteRestorer = () => {
  const { isVisible } = useTabVisibility();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Only attempt to restore route when tab becomes visible again
    // and the user is authenticated
    if (isVisible && user) {
      const lastRoute = sessionStorage.getItem('lastActiveRoute');
      
      // Check if we're on the dashboard page and there's a saved route to restore
      if (lastRoute && window.location.pathname === '/dashboard') {
        // Small delay to ensure the app is fully loaded
        const timer = setTimeout(() => {
          navigate(lastRoute);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, navigate, user]);

  // This is a utility component that doesn't render anything
  return null;
};

export default RouteRestorer;

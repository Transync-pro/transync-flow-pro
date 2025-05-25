import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface TabVisibilityContextType {
  isVisible: boolean;
  lastActiveRoute: string | null;
}

const TabVisibilityContext = createContext<TabVisibilityContextType>({
  isVisible: true,
  lastActiveRoute: null
});

export const useTabVisibility = () => useContext(TabVisibilityContext);

interface TabVisibilityProviderProps {
  children: ReactNode;
}

export const TabVisibilityProvider: React.FC<TabVisibilityProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastActiveRoute, setLastActiveRoute] = useState<string | null>(null);
  const location = useLocation();

  // Store the current route in session storage when it changes
  useEffect(() => {
    const currentPath = location.pathname;
    const currentSearch = location.search;
    const fullPath = `${currentPath}${currentSearch}`;
    
    // Only store protected routes (those that require authentication)
    if (currentPath.startsWith('/dashboard') || currentPath === '/profile') {
      sessionStorage.setItem('lastActiveRoute', fullPath);
      setLastActiveRoute(fullPath);
    }
  }, [location]);

  // Handle visibility change events
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    // Listen for visibility change events
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <TabVisibilityContext.Provider value={{ isVisible, lastActiveRoute }}>
      {children}
    </TabVisibilityContext.Provider>
  );
};

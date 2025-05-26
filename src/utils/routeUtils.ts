
import { addStagingPrefix, removeStagingPrefix, isStaging, normalizeStagingPath } from '@/config/environment';

// Handle staging route normalization
export const handleStagingRoute = (pathname: string) => {
  if (isStaging()) {
    // If we're in staging environment and path is exactly '/staging', redirect to dashboard
    if (pathname === '/staging') {
      return '/staging/dashboard';
    }
    
    // If path doesn't start with /staging but we're in staging, add the prefix
    if (!pathname.startsWith('/staging')) {
      return addStagingPrefix(pathname);
    }
  }
  
  return pathname;
};

// Get the actual route path without staging prefix for component rendering
export const getRoutePath = (pathname: string) => {
  return removeStagingPrefix(pathname);
};

// Check if current path matches a route pattern
export const matchesRoute = (pathname: string, pattern: string) => {
  const normalizedPath = removeStagingPrefix(pathname);
  return normalizedPath === pattern || normalizedPath.startsWith(pattern + '/');
};


// Environment configuration for staging and production only
export type Environment = 'staging' | 'production';

export const getEnvironment = (): Environment => {
  // Check for staging path prefix first
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;
    
    console.log('Environment detection - pathname:', pathname, 'hostname:', hostname);
    
    // Check if URL is exactly /staging or starts with /staging/
    if (pathname === '/staging' || pathname.startsWith('/staging/')) {
      // If it's exactly /staging, redirect to /staging/
      if (pathname === '/staging') {
        window.history.replaceState(null, '', '/staging/');
      }
      console.log('Environment detected as staging due to path prefix');
      return 'staging';
    }
    
    // Check for explicit staging domains (but not the main preview domain)
    if (hostname.includes('staging.') || hostname.includes('-staging.')) {
      console.log('Environment detected as staging due to hostname');
      return 'staging';
    }
  }
  
  // Default to production for everything else (including preview domains)
  console.log('Environment detected as production (default)');
  return 'production';
};

export const config = {
  staging: {
    supabase: {
      url: "https://lawshaoxrsxucrxjfbeu.supabase.co",
      anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhd3NoYW94cnN4dWNyeGpmYmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNDQwOTUsImV4cCI6MjA2MzgyMDA5NX0.FSFx0K-9jrqjbwi2MvIeqyeMALej1uxpy9Ms1plx1kk"
    },
    quickbooks: {
      environment: 'sandbox'
    }
  },
  production: {
    supabase: {
      url: "https://emxstmqwnozhwbpippon.supabase.co",
      anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVteHN0bXF3bm96aHdicGlwcG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwODQzMDksImV4cCI6MjA2MjY2MDMwOX0.yrrNvJlTu5NtWCUc7NPOpVoqkCgNE5c3paaZ_wB79Q8"
    },
    quickbooks: {
      environment: 'production'
    }
  }
};

export const getCurrentConfig = () => {
  const env = getEnvironment();
  console.log(`Environment detected: ${env}`);
  return config[env];
};

export const isProduction = () => getEnvironment() === 'production';
export const isStaging = () => getEnvironment() === 'staging';
export const isDevelopment = () => false; // No longer supported

// Helper function to add staging prefix to paths - ONLY for external URLs
export const addStagingPrefix = (path: string) => {
  const env = getEnvironment();
  console.log('addStagingPrefix called with path:', path, 'environment:', env);
  
  // If not in staging, return the path as is
  if (!isStaging()) {
    console.log('Not in staging, returning path as-is:', path);
    return path;
  }
  
  // Handle empty path or root
  if (!path || path === '/') {
    console.log('Empty path or root, returning /staging');
    return '/staging';
  }
  
  // If the path already contains staging prefix, return as is to prevent double prefixing
  if (path.includes('/staging')) {
    console.log('Path already contains staging prefix, returning as-is:', path);
    return path;
  }
  
  // Otherwise, add the /staging prefix only if we're in staging and path doesn't have it
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const result = `/staging/${cleanPath}`.replace(/\/+/g, '/');
  console.log('Adding staging prefix, result:', result);
  return result;
};

// Helper function to remove staging prefix from paths
export const removeStagingPrefix = (path: string) => {
  if (path.startsWith('/staging')) {
    return path.substring(8) || '/';
  }
  return path;
};

// Helper function to get the base path for routing
export const getBasePath = () => {
  const env = getEnvironment();
  const basePath = env === 'staging' ? '/staging' : '';
  console.log(`Base path for environment ${env}: ${basePath}`);
  return basePath;
};

// Navigation function for React Router - DON'T add prefixes since basename handles it
export const navigateWithEnvironment = (path: string) => {
  const env = getEnvironment();
  console.log('navigateWithEnvironment called with path:', path, 'environment:', env);
  
  // When using React Router with basename, we should NOT add prefixes manually
  // React Router handles the basename automatically
  
  // Clean the path to remove any existing staging prefixes
  let cleanPath = path;
  if (path.startsWith('/staging/')) {
    cleanPath = path.substring(8); // Remove '/staging'
    console.log('Removed staging prefix from path, clean path:', cleanPath);
  } else if (path === '/staging') {
    cleanPath = '/';
    console.log('Converted /staging to root path');
  }
  
  // Ensure path starts with /
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  
  console.log('Final navigation path (React Router will handle basename):', cleanPath);
  return cleanPath;
};

// Helper function for external URLs that need full paths with staging prefix
export const getFullUrlPath = (path: string) => {
  const env = getEnvironment();
  console.log('getFullUrlPath called with path:', path, 'environment:', env);
  
  if (env === 'staging') {
    return addStagingPrefix(path);
  }
  
  return path;
};

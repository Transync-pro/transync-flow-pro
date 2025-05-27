// Environment configuration for staging and production only
export type Environment = 'staging' | 'production';

export const getEnvironment = (): Environment => {
  // Check for staging path prefix first
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;
    
    // Check if URL is exactly /staging or starts with /staging/
    if (pathname === '/staging' || pathname.startsWith('/staging/')) {
      // If it's exactly /staging, redirect to /staging/
      if (pathname === '/staging') {
        window.history.replaceState(null, '', '/staging/');
      }
      return 'staging';
    }
    
    // Check for explicit staging domains (but not the main preview domain)
    if (hostname.includes('staging.') || hostname.includes('-staging.')) {
      return 'staging';
    }
  }
  
  // Default to production for everything else (including preview domains)
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

// Helper function to add staging prefix to paths
export const addStagingPrefix = (path: string) => {
  // If not in staging, return the path as is
  if (!isStaging()) return path;
  
  // Handle empty path or root
  if (!path || path === '/') return '/staging';
  
  // If the path is already correctly prefixed, return as is
  if (path === '/staging' || path.startsWith('/staging/')) {
    return path;
  }
  
  // Otherwise, add the /staging prefix
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `/staging/${cleanPath}`.replace(/\/+/g, '/');
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
  console.log(`Base path for environment ${env}: ${env === 'staging' ? '/staging' : ''}`);
  return env === 'staging' ? '/staging' : '';
};

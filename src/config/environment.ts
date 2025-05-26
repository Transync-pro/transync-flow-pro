
// Environment configuration for staging and production only
export type Environment = 'staging' | 'production';

export const getEnvironment = (): Environment => {
  // Check for staging path prefix
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    
    // Check if URL starts with /staging
    if (pathname.startsWith('/staging')) {
      return 'staging';
    }
    
    // Everything else is production
    return 'production';
  }
  
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
  return config[env];
};

export const isProduction = () => getEnvironment() === 'production';
export const isStaging = () => getEnvironment() === 'staging';
export const isDevelopment = () => false; // No longer supported

// Helper function to get the base path for routing
export const getBasePath = () => {
  return isStaging() ? '/staging' : '';
};

// Helper function to add staging prefix to paths
export const addStagingPrefix = (path: string) => {
  const basePath = getBasePath();
  if (basePath && !path.startsWith(basePath)) {
    return `${basePath}${path}`;
  }
  return path;
};

// Helper function to remove staging prefix from paths
export const removeStagingPrefix = (path: string) => {
  if (path.startsWith('/staging')) {
    return path.substring(8) || '/';
  }
  return path;
};

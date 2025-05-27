
// Environment configuration for staging and production only
export type Environment = 'staging' | 'production';

export const getEnvironment = (): Environment => {
  // Check for staging domain or path prefix
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // Check if hostname is staging domain
    if (hostname === 'staging.proadvisors.art') {
      return 'staging';
    }
    
    // Check if URL starts with /staging (fallback for preview environments)
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
    },
    domain: 'staging.proadvisors.art'
  },
  production: {
    supabase: {
      url: "https://emxstmqwnozhwbpippon.supabase.co",
      anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVteHN0bXF3bm96aHdicGlwcG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwODQzMDksImV4cCI6MjA2MjY2MDMwOX0.yrrNvJlTu5NtWCUc7NPOpVoqkCgNE5c3paaZ_wB79Q8"
    },
    quickbooks: {
      environment: 'production'
    },
    domain: 'proadvisors.art'
  }
};

export const getCurrentConfig = () => {
  const env = getEnvironment();
  return config[env];
};

export const isProduction = () => getEnvironment() === 'production';
export const isStaging = () => getEnvironment() === 'staging';
export const isDevelopment = () => false; // No longer supported

// Helper function to get the current domain
export const getCurrentDomain = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Use custom domains if available
    if (hostname === 'staging.proadvisors.art' || hostname === 'proadvisors.art') {
      return hostname;
    }
    
    // Fallback to preview domain for development
    return window.location.origin;
  }
  
  // Server-side fallback
  const env = getEnvironment();
  return `https://${config[env].domain}`;
};

// Helper function to get the base path for routing
export const getBasePath = () => {
  // For custom domains, no base path needed
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'staging.proadvisors.art' || hostname === 'proadvisors.art') {
      return '';
    }
  }
  
  // Fallback for preview environments
  return isStaging() ? '/staging' : '';
};

// Helper function to add staging prefix to paths (only for preview environments)
export const addStagingPrefix = (path: string) => {
  const basePath = getBasePath();
  if (!basePath) return path;
  
  // Remove leading/trailing slashes for consistency
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  
  // If path is just '/', return basePath
  if (!cleanPath) return basePath;
  
  // Otherwise, combine basePath and path with a single slash
  return `${basePath}/${cleanPath}`;
};

// Helper function to remove staging prefix from paths
export const removeStagingPrefix = (path: string) => {
  if (path.startsWith('/staging')) {
    return path.substring(8) || '/';
  }
  return path;
};

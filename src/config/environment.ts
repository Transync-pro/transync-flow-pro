
// Environment configuration for staging and production
export type Environment = 'staging' | 'production';

export const getEnvironment = (): Environment => {
  if (typeof window === 'undefined') {
    return 'production'; // Default to production for server-side rendering
  }
  
  const hostname = window.location.hostname;
  
  // Check if hostname contains 'staging'
  if (hostname.includes('staging')) {
    return 'staging';
  }
  
  // Default to production
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

// Environment detection helpers
export const isProduction = () => getEnvironment() === 'production';
export const isStaging = () => getEnvironment() === 'staging';
// Development environment is no longer supported
export const isDevelopment = () => false;

// Base path is always root since we're using subdomains
export const getBasePath = () => '';

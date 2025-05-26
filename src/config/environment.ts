
// Environment configuration for staging and production
export type Environment = 'development' | 'staging' | 'production';

export const getEnvironment = (): Environment => {
  // Check for explicit environment variable first
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Check for staging domain patterns
    if (hostname.includes('staging') || hostname.includes('stage')) {
      return 'staging';
    }
    
    // Check for localhost/development
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('stage')) {
      return 'development';
    }
    
    // Everything else is production
    return 'production';
  }
  
  return 'development';
};

export const config = {
  development: {
    supabase: {
      url: "https://lawshaoxrsxucrxjfbeu.supabase.co",
      anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhd3NoYW94cnN4dWNyeGpmYmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNDQwOTUsImV4cCI6MjA2MzgyMDA5NX0.FSFx0K-9jrqjbwi2MvIeqyeMALej1uxpy9Ms1plx1kk"
    },
    quickbooks: {
      environment: 'sandbox'
    }
  },
  staging: {
    supabase: {
      // These will need to be updated when staging Supabase project is created
      url: "https://lawshaoxrsxucrxjfbeu.supabase.co", // Temporary - replace with staging project
      anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhd3NoYW94cnN4dWNyeGpmYmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNDQwOTUsImV4cCI6MjA2MzgyMDA5NX0.FSFx0K-9jrqjbwi2MvIeqyeMALej1uxpy9Ms1plx1kk" // Temporary
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
      environment: 'production' // Will be production for live environment
    }
  }
};

export const getCurrentConfig = () => {
  const env = getEnvironment();
  return config[env];
};

export const isProduction = () => getEnvironment() === 'production';
export const isStaging = () => getEnvironment() === 'staging';
export const isDevelopment = () => getEnvironment() === 'development';

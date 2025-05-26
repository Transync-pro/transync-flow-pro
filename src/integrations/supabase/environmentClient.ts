import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getCurrentConfig, getEnvironment } from '@/config/environment';

// Get environment-specific configuration
const envConfig = getCurrentConfig();
const environment = getEnvironment();

// Create a custom storage handler that works with the base path
const customStorage = {
  getItem: (key: string) => {
    // If we're in staging, prefix the storage keys
    const storageKey = environment === 'staging' ? `staging_${key}` : key;
    return window.localStorage.getItem(storageKey);
  },
  setItem: (key: string, value: string) => {
    const storageKey = environment === 'staging' ? `staging_${key}` : key;
    window.localStorage.setItem(storageKey, value);
  },
  removeItem: (key: string) => {
    const storageKey = environment === 'staging' ? `staging_${key}` : key;
    window.localStorage.removeItem(storageKey);
  },
};

// Create Supabase client with environment-specific settings
export const supabase = createClient<Database>(
  envConfig.supabase.url,
  envConfig.supabase.anonKey,
  {
    auth: {
      storage: typeof window !== 'undefined' ? customStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      // Add headers if needed for your Supabase project
      headers: {
        'X-Environment': environment,
      },
    },
  }
);

// Log the environment for debugging
if (typeof window !== 'undefined') {
  console.log('Environment:', environment);
  console.log('Supabase URL:', envConfig.supabase.url);
}

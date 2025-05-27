import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getCurrentConfig } from '@/config/environment';

// Get environment-specific configuration
const envConfig = getCurrentConfig();

if (!envConfig?.supabase?.url || !envConfig?.supabase?.anonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment settings.');
}

// Create a single Supabase client for the entire app with environment-specific settings
export const supabase = createClient<Database>(
  envConfig.supabase.url,
  envConfig.supabase.anonKey,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
);

// Log the environment being used for debugging
console.log('Supabase client initialized with environment:', envConfig);

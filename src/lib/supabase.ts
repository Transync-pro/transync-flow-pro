import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { getCurrentConfig } from '@/config/environment';

declare global {
  interface Window {
    __SUPABASE_CLIENT__?: any;
  }
}

// Get environment-specific configuration
const envConfig = getCurrentConfig();

if (!envConfig?.supabase?.url || !envConfig?.supabase?.anonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment settings.');
}

// Create a singleton Supabase client for the browser
const createSupabaseClient = () => {
  // In development, always create a new client
  if (process.env.NODE_ENV === 'development') {
    return createClient<Database>(
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
  }

  // In production, use a singleton pattern
  if (typeof window !== 'undefined') {
    if (!window.__SUPABASE_CLIENT__) {
      window.__SUPABASE_CLIENT__ = createClient<Database>(
        envConfig.supabase.url,
        envConfig.supabase.anonKey,
        {
          auth: {
            storage: window.localStorage,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
          },
        }
      );
    }
    return window.__SUPABASE_CLIENT__;
  }

  // For server-side rendering
  return createClient<Database>(
    envConfig.supabase.url,
    envConfig.supabase.anonKey
  );
};

export const supabase = createSupabaseClient();

// Log the environment being used for debugging
console.log('Supabase client initialized with environment:', envConfig);

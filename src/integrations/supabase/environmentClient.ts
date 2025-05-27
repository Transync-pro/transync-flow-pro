
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getCurrentConfig } from '@/config/environment';

// Get environment-specific configuration
const envConfig = getCurrentConfig();

// Create Supabase client with environment-specific settings
export const supabase = createClient<Database>(
  envConfig.supabase.url,
  envConfig.supabase.anonKey,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'transync-flow-pro-auth', // Add unique storage key to avoid conflicts
    }
  }
);

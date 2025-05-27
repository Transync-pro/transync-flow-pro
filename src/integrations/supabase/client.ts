// This file is now deprecated. Please use @/lib/supabase instead.
// This file is kept for backward compatibility.

import { supabase } from '@/lib/supabase';
import type { Database } from './types';

export { supabase };
export type { Database };

// Note: The Supabase client is now a singleton managed in @/lib/supabase.ts
// This ensures only one instance is created and used throughout the application.
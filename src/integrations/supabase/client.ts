// This file is re-exporting the environment-specific Supabase client
// to maintain backward compatibility with existing imports

export { supabase } from './environmentClient';

export type { Database } from './types';
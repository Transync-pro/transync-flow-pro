
import { supabase } from "@/integrations/supabase/client";

interface QuickbooksConnection {
  id: string;
  user_id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  created_at: string;
  expires_at: string;
  company_name?: string;
}

// Enhanced connection cache with optimized TTL
const connectionCache = new Map<string, {data: QuickbooksConnection | null, timestamp: number}>();
const CACHE_TTL = 60000; // Shortened to 1 minute for better reliability
const EXISTENCE_CACHE_TTL = 30000; // Shortened to 30 seconds for existence checks

// Get the current user's QuickBooks connection with enhanced caching
export const getQBConnection = async (): Promise<QuickbooksConnection | null> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;
  
  const userId = userData.user.id;
  const now = Date.now();
  
  // Check cache first
  const cached = connectionCache.get(userId);
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }
  
  // Not in cache or expired, fetch from DB
  const { data, error } = await supabase
    .from('quickbooks_connections')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  // Update cache
  connectionCache.set(userId, {
    data: data as QuickbooksConnection || null,
    timestamp: now
  });
  
  if (error || !data) return null;
  return data as QuickbooksConnection;
};

// Check if a connection needs token refresh
export const needsTokenRefresh = (expiresAt: string): boolean => {
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  // Return true if token expires in less than 5 minutes
  return (expiryDate.getTime() - now.getTime()) < 5 * 60 * 1000;
};

// Update connection with new tokens after refresh
export async function updateConnectionTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: string
): Promise<void> {
  const { error } = await supabase
    .from('quickbooks_connections')
    .update({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt
    })
    .eq('user_id', userId);
  
  // Invalidate cache
  clearConnectionCache(userId);
  
  if (error) {
    throw new Error(`Failed to update tokens: ${error.message}`);
  }
}

// Optimized connection check for RouteGuard - improved reliability
export const checkQBConnectionExists = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  // Check cache first with shorter TTL for existence checks
  const now = Date.now();
  const cached = connectionCache.get(userId);
  
  if (cached && (now - cached.timestamp < EXISTENCE_CACHE_TTL)) {
    return cached.data !== null;
  }
  
  try {
    // Use a direct count query that's faster and more reliable
    const { count, error } = await supabase
      .from('quickbooks_connections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // Store result
    const exists = (count || 0) > 0;
    
    // Update cache with the result
    connectionCache.set(userId, {
      data: exists ? {} as QuickbooksConnection : null, // Placeholder
      timestamp: now
    });
    
    if (error) {
      console.error("Error checking QuickBooks connection existence:", error);
      return false;
    }
    
    return exists;
  } catch (error) {
    console.error("Exception checking QuickBooks connection:", error);
    return false;
  }
}

// Clear connection cache (use when disconnecting)
export const clearConnectionCache = (userId?: string): void => {
  if (userId) {
    console.log(`Clearing connection cache for user ${userId}`);
    connectionCache.delete(userId);
  } else {
    console.log('Clearing entire connection cache');
    connectionCache.clear();
  }
};

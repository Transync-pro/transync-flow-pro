
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

// Add connection cache for performance
const connectionCache = new Map<string, {data: QuickbooksConnection | null, timestamp: number}>();
const CACHE_TTL = 10000; // 10 seconds

// Get the current user's QuickBooks connection with caching
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
  connectionCache.delete(userId);
  
  if (error) {
    throw new Error(`Failed to update tokens: ${error.message}`);
  }
}

// Check if a QuickBooks connection exists for the user with optimized caching
export const checkQBConnectionExists = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  // Check cache first
  const now = Date.now();
  const cached = connectionCache.get(userId);
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.data !== null;
  }
  
  try {
    const { count, error } = await supabase
      .from('quickbooks_connections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // Fast path optimization - we just need to know if it exists
    const exists = (count || 0) > 0;
    
    // Store in cache even if we don't have the full connection data
    if (!cached) {
      connectionCache.set(userId, {
        data: exists ? {} as QuickbooksConnection : null, // Placeholder if exists
        timestamp: now
      });
    }
    
    if (error) {
      console.error("Error checking QuickBooks connection existence:", error);
      return false;
    }
    
    return exists;
  } catch (error) {
    console.error("Exception checking QuickBooks connection:", error);
    return false;
  }
};

// Clear connection cache (use when disconnecting)
export const clearConnectionCache = (userId?: string): void => {
  if (userId) {
    connectionCache.delete(userId);
  } else {
    connectionCache.clear();
  }
};


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
const CACHE_TTL = 30000; // Shortened to 30 seconds for better reliability
const EXISTENCE_CACHE_TTL = 15000; // Shortened to 15 seconds for existence checks

// Clear connection cache (use when disconnecting or auth state changes)
export const clearConnectionCache = (userId?: string): void => {
  if (userId) {
    console.log(`Clearing connection cache for user ${userId}`);
    connectionCache.delete(userId);
  } else {
    console.log('Clearing entire connection cache');
    connectionCache.clear();
  }
  
  // Also clear any session storage items related to connection
  sessionStorage.removeItem('qb_connection_data');
  sessionStorage.removeItem('qb_connection_success');
  sessionStorage.removeItem('qb_connection_company');
  sessionStorage.removeItem('qb_redirected_to_authenticate');
  sessionStorage.removeItem('qb_connecting_user');
  sessionStorage.removeItem('qb_connection_in_progress');
  
  console.log('Connection cache and session storage cleared', userId ? `for user ${userId}` : 'for all users');
};

// Get the current auth user's QuickBooks connection with enhanced caching
export const getQBConnection = async (): Promise<QuickbooksConnection | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      console.log('No authenticated user found');
      return null;
    }
    
    const userId = userData.user.id;
    const now = Date.now();
    
    // Check cache first
    const cached = connectionCache.get(userId);
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      console.log('Using cached connection data');
      return cached.data;
    }
    
    console.log(`Fetching QB connection for user ${userId} from database`);
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
    
    if (error) {
      console.error("Error fetching QuickBooks connection:", error);
      return null;
    }
    
    return data as QuickbooksConnection || null;
  } catch (error) {
    console.error("Exception in getQBConnection:", error);
    return null;
  }
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

// Optimized and improved connection check for RouteGuard
export const checkQBConnectionExists = async (userId: string): Promise<boolean> => {
  if (!userId) {
    console.log('No user ID provided for connection check');
    return false;
  }
  
  try {
    // Check cache first with shorter TTL for existence checks
    const now = Date.now();
    const cached = connectionCache.get(userId);
    
    if (cached && (now - cached.timestamp < EXISTENCE_CACHE_TTL)) {
      console.log('Using cached connection existence data');
      return cached.data !== null;
    }
    
    console.log(`Checking QB connection existence for user ${userId} directly in database`);
    // Use a direct count query that's faster and more reliable
    const { count, error } = await supabase
      .from('quickbooks_connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) {
      console.error("Error checking QuickBooks connection existence:", error);
      return false;
    }
    
    // Store result
    const exists = (count || 0) > 0;
    console.log(`QuickBooks connection exists for user ${userId}: ${exists}`);
    
    // Update cache with the result
    connectionCache.set(userId, {
      data: exists ? {} as QuickbooksConnection : null, // Placeholder
      timestamp: now
    });
    
    return exists;
  } catch (error) {
    console.error("Exception checking QuickBooks connection:", error);
    return false;
  }
};

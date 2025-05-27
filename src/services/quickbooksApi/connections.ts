
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
  updated_at: string;
}

// No connection cache - always query database directly

// Clear session storage items related to connection state
export const clearConnectionCache = (userId?: string): void => {
  console.log('Clearing connection session storage', userId ? `for user ${userId}` : 'for all users');
  
  // Clear all session storage items related to connection
  const qbItems = [
    'qb_connection_data',
    'qb_connection_success',
    'qb_connection_company',
    'qb_redirected_to_authenticate',
    'qb_connecting_user',
    'qb_connection_in_progress',
    'qb_connection_verified',
    'qb_connection_timestamp',
    'qb_auth_timestamp',
    'processed_qb_codes',      // Added this item which was missing
    'qb_auth_success',         // Added this item which was missing
    'qb_connect_user',         // Added this item which was missing
    'qb_redirect_after_connect', // Added this item which was missing
    'qb_redirect_timestamp'     // Added to prevent redirect loops
  ];
  
  qbItems.forEach(key => sessionStorage.removeItem(key));
  
  console.log('Connection session storage cleared', userId ? `for user ${userId}` : 'for all users');
};

// Initialize QuickBooks authentication
export const initQBAuth = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke("quickbooks-auth", {
      body: {
        path: "authorize",
        userId: userId
      }
    });

    if (error) {
      throw new Error(`Failed to initialize QB auth: ${error.message}`);
    }
  } catch (error) {
    console.error("Error initializing QB auth:", error);
    throw error;
  }
};

// Disconnect from QuickBooks
export const disconnectQB = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('quickbooks_connections')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to disconnect QB: ${error.message}`);
    }

    // Clear connection cache
    clearConnectionCache(userId);
  } catch (error) {
    console.error("Error disconnecting QB:", error);
    throw error;
  }
};

// Refresh QuickBooks token
export const refreshQBToken = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke("quickbooks-auth", {
      body: {
        path: "refresh",
        userId: userId
      }
    });

    if (error) {
      throw new Error(`Failed to refresh QB token: ${error.message}`);
    }
  } catch (error) {
    console.error("Error refreshing QB token:", error);
    throw error;
  }
};

// Get the current auth user's QuickBooks connection - always query database directly
export const getQBConnection = async (userId?: string): Promise<QuickbooksConnection | null> => {
  try {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        console.log('No authenticated user found');
        return null;
      }
      targetUserId = userData.user.id;
    }
    
    console.log(`Fetching QB connection for user ${targetUserId} from database`);
    // Always fetch fresh data from DB
    const { data, error } = await supabase
      .from('quickbooks_connections')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();
    
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

// Temporary forced connection state for transitions (authentication/disconnection)
let forcedConnectionState: { userId: string; connected: boolean; expireTime: number } | null = null;

// Force connection state for a limited time (used during authentication and disconnection)
export const forceConnectionState = (userId: string, connected: boolean, durationMs: number = 5000): void => {
  forcedConnectionState = {
    userId,
    connected,
    expireTime: Date.now() + durationMs
  };
  console.log(`Forced QB connection state for user ${userId} to ${connected ? 'connected' : 'disconnected'} for ${durationMs}ms`);
};

// Clear forced connection state
export const clearForcedConnectionState = (): void => {
  forcedConnectionState = null;
  console.log('Cleared forced QB connection state');
};

// Direct connection check for RouteGuard - no caching but respects forced state
export const checkQBConnectionExists = async (userId: string): Promise<boolean> => {
  if (!userId) {
    console.log('No user ID provided for connection check');
    return false;
  }
  
  // Check if we have a forced connection state that hasn't expired
  if (forcedConnectionState && 
      forcedConnectionState.userId === userId && 
      forcedConnectionState.expireTime > Date.now()) {
    console.log(`Using forced connection state for user ${userId}: ${forcedConnectionState.connected}`);
    return forcedConnectionState.connected;
  }
  
  // If forced state expired, clear it
  if (forcedConnectionState && forcedConnectionState.expireTime <= Date.now()) {
    console.log('Forced connection state expired, clearing');
    forcedConnectionState = null;
  }
  
  try {
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
    
    // Return result directly without caching
    const exists = (count || 0) > 0;
    console.log(`QuickBooks connection exists for user ${userId}: ${exists}`);
    
    return exists;
  } catch (error) {
    console.error("Exception checking QuickBooks connection:", error);
    return false;
  }
};

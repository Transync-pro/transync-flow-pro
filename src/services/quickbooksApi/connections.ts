
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

// No connection cache - always query database directly

// Clear session storage items related to connection state
export const clearConnectionCache = (userId?: string): void => {
  console.log('Clearing connection session storage', userId ? `for user ${userId}` : 'for all users');
  
  // Clear all session storage items related to connection
  sessionStorage.removeItem('qb_connection_data');
  sessionStorage.removeItem('qb_connection_success');
  sessionStorage.removeItem('qb_connection_company');
  sessionStorage.removeItem('qb_redirected_to_authenticate');
  sessionStorage.removeItem('qb_connecting_user');
  sessionStorage.removeItem('qb_connection_in_progress');
  sessionStorage.removeItem('qb_connection_verified');
  sessionStorage.removeItem('qb_connection_timestamp');
  sessionStorage.removeItem('qb_auth_timestamp');
  
  console.log('Connection session storage cleared', userId ? `for user ${userId}` : 'for all users');
};

// Get the current auth user's QuickBooks connection - always query database directly
export const getQBConnection = async (): Promise<QuickbooksConnection | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      console.log('No authenticated user found');
      return null;
    }
    
    const userId = userData.user.id;
    
    console.log(`Fetching QB connection for user ${userId} from database`);
    // Always fetch fresh data from DB
    const { data, error } = await supabase
      .from('quickbooks_connections')
      .select('*')
      .eq('user_id', userId)
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

// Direct connection check for RouteGuard - no caching
export const checkQBConnectionExists = async (userId: string): Promise<boolean> => {
  if (!userId) {
    console.log('No user ID provided for connection check');
    return false;
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

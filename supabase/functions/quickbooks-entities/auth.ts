
import { supabase } from "./connection.ts";

// Get user's QuickBooks connection details
export const getQBConnection = async (userId: string) => {
  const { data, error } = await supabase
    .from('quickbooks_connections')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching QuickBooks connection:', error);
    return null;
  }
  
  return data;
};

// Check if token needs refresh
export const checkAndRefreshToken = async (userId: string) => {
  try {
    const connection = await getQBConnection(userId);
    if (!connection) {
      throw new Error('No QuickBooks connection found');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const expiresAt = new Date(connection.expires_at);
    const now = new Date();
    
    if ((expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000) {
      console.log('Access token expired or about to expire, refreshing...');
      
      // Call the quickbooks-auth function to refresh the token
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: {
          path: 'refresh',
          userId,
          refreshToken: connection.refresh_token
        }
      });
      
      if (error || data?.error) {
        throw new Error(error?.message || data?.error || 'Failed to refresh token');
      }
      
      // Get the updated connection
      return await getQBConnection(userId);
    }
    
    return connection;
  } catch (error) {
    console.error('Error checking/refreshing token:', error);
    throw error;
  }
};

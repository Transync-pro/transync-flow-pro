
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

// Get the current user's QuickBooks connection
export const getQBConnection = async (): Promise<QuickbooksConnection | null> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;
  
  const { data, error } = await supabase
    .from('quickbooks_connections')
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle(); // Use maybeSingle instead of single to avoid 406 errors
  
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
  
  if (error) {
    throw new Error(`Failed to update tokens: ${error.message}`);
  }
}

// Check if a QuickBooks connection exists for the user
export const checkQBConnectionExists = async (userId: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('quickbooks_connections')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);
    
    if (error) {
      console.error("Error checking QuickBooks connection existence:", error);
      return false;
    }
    
    return (count || 0) > 0;
  } catch (error) {
    console.error("Exception checking QuickBooks connection:", error);
    return false;
  }
};

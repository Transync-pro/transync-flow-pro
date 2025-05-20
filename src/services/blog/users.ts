
import { supabase } from "@/integrations/supabase/client";

/**
 * Check the role of the current user
 */
export async function checkUserRole(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id);
    
  if (error || !data || data.length === 0) {
    console.error("Error checking user role:", error);
    return null;
  }
  
  return data[0].role;
}

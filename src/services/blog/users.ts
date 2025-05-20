
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

/**
 * Create admin user if it doesn't exist
 */
export async function createAdminUser(email: string, password: string): Promise<{ success: boolean; message: string }> {
  try {
    // Check if user exists
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (signUpError) {
      // If error is "User already registered", try to get the user
      if (signUpError.message.includes("User already registered")) {
        // Sign in to get user
        const { data: { user: existingUser }, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          return { 
            success: false, 
            message: "User exists but password is incorrect. Please try again with the correct password."
          };
        }
        
        // We found the user, check if they have admin role already
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', existingUser?.id)
          .single();
          
        if (existingRole) {
          return { 
            success: true, 
            message: "Admin user already exists and has admin role."
          };
        }
        
        // Create admin role for existing user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([
            { user_id: existingUser?.id, role: 'admin' }
          ]);
          
        if (roleError) {
          console.error("Role creation error:", roleError);
          return { 
            success: false, 
            message: `Failed to assign admin role to existing user: ${roleError.message}`
          };
        }
        
        return { 
          success: true, 
          message: "Admin role assigned to existing user successfully."
        };
      } else {
        // Other signup error
        return { 
          success: false, 
          message: `Failed to create admin user: ${signUpError.message}`
        };
      }
    }
    
    // User created, add admin role
    if (user) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          { user_id: user.id, role: 'admin' }
        ]);
        
      if (roleError) {
        console.error("Role creation error:", roleError);
        return { 
          success: false, 
          message: `Failed to assign admin role: ${roleError.message}`
        };
      }
      
      return { 
        success: true, 
        message: "Admin user created successfully."
      };
    }
    
    return {
      success: false,
      message: "Failed to create admin user due to unknown error."
    };
    
  } catch (error) {
    console.error("Error creating admin user:", error);
    return { 
      success: false, 
      message: `Error: ${error.message || "Unknown error occurred"}`
    };
  }
}

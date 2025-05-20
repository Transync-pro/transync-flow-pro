import { supabase } from "@/integrations/supabase/client";

/**
 * Check the role of the current user
 */
export async function checkUserRole(): Promise<string | null> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error("Session error or no session:", sessionError?.message || "No session");
      return null;
    }
    
    console.log("Checking role for user ID:", session.user.id);
    
    // First, check if user is admin using the database function
    const { data: isAdmin, error: adminCheckError } = await supabase
      .rpc('is_admin_user', { user_id: session.user.id });
      
    if (adminCheckError) {
      console.error("Error checking admin status:", adminCheckError);
      // Continue to check for other roles even if admin check fails
    } else if (isAdmin) {
      console.log("User is an admin");
      return 'admin';
    }
    
    // If not admin, check for other roles
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();
      
    if (roleError) {
      console.error("Error checking user role:", roleError);
      return null;
    }
    
    console.log("User role:", roleData?.role || 'no role');
    return roleData?.role || null;
  } catch (error) {
    console.error("Unexpected error checking user role:", error);
    return null;
  }
}

/**
 * Create admin user if it doesn't exist
 */
export async function createAdminUser(email: string, password: string): Promise<{ success: boolean; message: string }> {
  try {
    // First try to sign up a new user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    
    // Handle sign up results
    if (signUpError) {
      // If user already exists, try to sign in
      if (signUpError.message.includes("User already registered")) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          return { 
            success: false, 
            message: "User exists but password is incorrect. Please try again with the correct password."
          };
        }
        
        const userId = signInData.user?.id;
        
        // Check if user already has admin role
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (existingRole) {
          return { 
            success: true, 
            message: "Admin user already exists and has admin role."
          };
        }
        
        // Assign admin role to existing user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([
            { user_id: userId, role: 'admin' }
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
    const userId = signUpData.user?.id;
    
    if (userId) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          { user_id: userId, role: 'admin' }
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

/**
 * Verify if the current user is an admin
 * This provides a more direct way to check admin status
 */
export async function isUserAdmin(): Promise<boolean> {
  try {
    console.log("Starting admin check...");
    const role = await checkUserRole();
    const isAdmin = role === 'admin';
    console.log(`Admin check complete. Role: ${role}, Is Admin: ${isAdmin}`);
    return isAdmin;
  } catch (error) {
    console.error("Failed to check if user is admin:", error);
    return false;
  }
}

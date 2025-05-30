import { supabase } from "@/integrations/supabase/environmentClient";

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
    
    // Use the RPC function to check admin status
    const { data: isAdmin, error: adminCheckError } = await supabase
      .rpc('is_user_admin', { user_id: session.user.id });
      
    if (adminCheckError) {
      console.error("Error checking admin status:", adminCheckError);
      return null;
    }
    
    if (isAdmin) {
      console.log("User is an admin");
      return 'admin';
    }
    
    console.log("User is not an admin");
    return null;
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
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    console.log("isUserAdmin: session", session);
    if (!session || !session.user) {
      console.log("No active session found");
      return false;
    }
    
    // Use the RPC function directly for better reliability
    const { data: isAdmin, error } = await supabase
      .rpc('is_user_admin', { user_id: session.user.id });
    
    if (error) {
      console.error("Admin check failed:", error.message);
      return false;
    }
    
    console.log(`Admin check complete. Is Admin: ${isAdmin}`);
    return isAdmin === true;
  } catch (error) {
    console.error("Failed to check if user is admin:", error);
    return false;
  }
}


import React, { createContext, useContext, useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/environmentClient";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { processLoginAttempt } from "@/services/loginSecurity";
import { clearConnectionCache } from "@/services/quickbooksApi/connections";
import { navigateWithEnvironment } from "@/config/environment";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: object) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Handle initial session and setup auth state listener
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        const previousUserId = user?.id;
        const currentUserId = currentSession?.user?.id;
        
        console.log('Auth state change event:', event, 'currentUserId:', currentUserId);
        
        // Update session and user state
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Clear connection cache if user changed or signed out
        if (previousUserId !== currentUserId) {
          console.log(`User changed from ${previousUserId} to ${currentUserId}, clearing connection cache`);
          clearConnectionCache();
        }
        
        // Handle auth events with staging-aware navigation
        if (event === 'SIGNED_IN') {
          // Clear connection cache on login to ensure fresh data
          clearConnectionCache();
          console.log('Connection cache cleared on login');
          
          // If there's a user ID, check for QB connection in the background
          if (currentUserId) {
            // We'll check this asynchronously without waiting
            import('@/services/quickbooksApi/connections')
              .then(({ checkQBConnectionExists }) => {
                checkQBConnectionExists(currentUserId)
                  .then(exists => {
                    console.log(`QB connection check during login: ${exists ? 'connected' : 'not connected'}`);
                    if (exists) {
                      // Set a flag that we can use in RouteGuard to prevent unnecessary redirects
                      sessionStorage.setItem('qb_connection_verified', 'true');
                      sessionStorage.setItem('qb_connection_timestamp', Date.now().toString());
                    }
                  })
                  .catch(err => console.error('Error checking QB connection during login:', err));
              })
              .catch(err => console.error('Error importing checkQBConnectionExists:', err));
          }
          
          toast({
            title: "Signed in successfully",
            description: "Welcome back!"
          });
          
          // Use environment-aware navigation
          const dashboardPath = navigateWithEnvironment('/dashboard');
          console.log('Navigating to dashboard with path:', dashboardPath);
          
          setTimeout(() => {
            navigate(dashboardPath);
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          // Thoroughly clear all connection cache and session storage on logout
          clearConnectionCache();
          console.log('Connection cache cleared on logout');
          
          // Clear any additional session storage items related to QB
          sessionStorage.removeItem('qb_connection_verified');
          sessionStorage.removeItem('qb_connection_timestamp');
          sessionStorage.removeItem('qb_auth_timestamp');
          
          const loginPath = navigateWithEnvironment('/login');
          console.log('Navigating to login with path:', loginPath);
          navigate(loginPath);
        } else if (event === 'USER_UPDATED') {
          const emailVerified = currentSession?.user?.email_confirmed_at;
          if (emailVerified) {
            toast({
              title: "Email Verified",
              description: "Your email has been successfully verified."
            });
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, user?.id]);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      clearConnectionCache();
      
      const redirectPath = navigateWithEnvironment('/dashboard');
      console.log('Google OAuth redirect path:', redirectPath);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
        }
      });
      
      if (error) {
        toast({
          title: "Google Sign In Failed",
          description: "There was an error signing in with Google.",
          variant: "destructive"
        });
        console.error("Error signing in with Google:", error);
      }
    } catch (error) {
      toast({
        title: "Google Sign In Failed",
        description: "There was an error signing in with Google.",
        variant: "destructive"
      });
      console.error("Error signing in with Google:", error);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const canProceed = await processLoginAttempt(email, false);
      
      if (!canProceed) {
        toast({
          title: "Login temporarily unavailable",
          description: "Please try again later.",
          variant: "destructive"
        });
        return;
      }
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await processLoginAttempt(email, false);
        
        toast({
          title: "Sign in failed",
          description: "The email and password entered do not match.",
          variant: "destructive"
        });
        
        console.error("Error signing in:", error);
        return;
      }

      await processLoginAttempt(email, true);

      toast({
        title: "Sign in successful",
        description: "Welcome back!"
      });

      // Use environment-aware navigation
      const dashboardPath = navigateWithEnvironment('/dashboard');
      console.log('Manual sign in - navigating to dashboard with path:', dashboardPath);
      navigate(dashboardPath);
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "The email and password entered do not match.",
        variant: "destructive"
      });
      
      console.error("Error signing in:", error);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata?: object) => {
    try {
      const verifyPath = navigateWithEnvironment('/verify');
      console.log('Sign up redirect path:', verifyPath);
      
      const redirectTo = `${window.location.origin}${verifyPath}`;

      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: redirectTo
        },
      });

      if (error) {
        throw error;
      }

      if (data?.user?.identities?.length === 0) {
        toast({
          title: "Account already exists",
          description: "Please login instead or reset your password.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Account created",
        description: "Please check your email to verify your account."
      });

      navigate(verifyPath);
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
      console.error("Error signing up:", error);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      toast({
        title: "Signed out successfully"
      });
      
      // onAuthStateChange will handle navigation
    } catch (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
      console.error("Error signing out:", error);
    }
  };

  const value = {
    session,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

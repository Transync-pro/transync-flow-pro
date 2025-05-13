
import React, { createContext, useContext, useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: object) => Promise<void>;
  signOut: () => Promise<void>;
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
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Handle auth events
        if (event === 'SIGNED_IN') {
          // Don't navigate here - that's handled by the sign-in function
        } else if (event === 'SIGNED_OUT') {
          navigate('/login');
        } else if (event === 'USER_UPDATED') {
          // Check if email was just verified
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
  }, [navigate]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sign in successful",
        description: "Welcome back!"
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
      console.error("Error signing in:", error);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata?: object) => {
    try {
      // Get the verification redirect URL based on current environment
      const redirectTo = `${window.location.origin}/verify`;

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

      // Check if email verification is required
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

      // Navigate to verification page
      navigate('/verify');
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

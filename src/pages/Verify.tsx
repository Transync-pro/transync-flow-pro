
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/environmentClient";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

const Verify = () => {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  
  useEffect(() => {
    async function handleEmailVerification() {
      try {
        // Get email verification token from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        
        if (accessToken) {
          // Exchange the tokens for a session
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ""
          });
          
          if (error) throw error;
          
          if (data?.user) {
            setEmail(data.user.email);
          }
        }
        
        // Check if the user is already authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmail(session.user.email);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError(err.message);
      } finally {
        setVerifying(false);
      }
    }
    
    handleEmailVerification();
  }, []);

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <h1 className="text-2xl font-bold">Verifying your email</h1>
            <p className="text-gray-600 text-center">
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-full bg-red-100 p-3">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Verification Failed</h1>
            <p className="text-gray-600 text-center">
              {error}
            </p>
            <Link to="/login">
              <Button>Go to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center space-y-4">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Email Verified!</h1>
          <p className="text-gray-600 text-center">
            {email ? (
              <>Your email <span className="font-semibold">{email}</span> has been successfully verified.</>
            ) : (
              <>Your email has been successfully verified.</>
            )}
          </p>
          <div className="pt-4">
            <Link to="/login">
              <Button>Continue to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;

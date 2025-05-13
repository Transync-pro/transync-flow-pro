
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Verify = () => {
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // Check if we're coming from an email verification link
        const hash = location.hash;
        if (hash && hash.includes('access_token')) {
          // Handle the auth redirect (automatically sets session)
          const { data, error } = await supabase.auth.getSessionFromUrl();
          
          if (error) {
            console.error("Verification error:", error);
            setVerificationStatus('error');
            return;
          }
          
          if (data && data.session) {
            console.log("Email verified successfully");
            setVerificationStatus('success');
            return;
          }
        }
        
        // If user accessed the page directly, check if they're already verified
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setVerificationStatus('success');
        } else {
          // If no hash and no session, redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error("Error during verification:", error);
        setVerificationStatus('error');
      }
    };

    handleVerification();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
            <CardDescription>
              {verificationStatus === 'loading' ? 'Verifying your email...' : 
               verificationStatus === 'success' ? 'Your email has been verified!' : 
               'There was a problem verifying your email.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center py-6">
            {verificationStatus === 'loading' && (
              <div className="w-12 h-12 border-4 border-t-transyncpro-button rounded-full animate-spin"></div>
            )}
            
            {verificationStatus === 'success' && (
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            )}
            
            {verificationStatus === 'error' && (
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
            )}
            
            <p className="text-center mt-4">
              {verificationStatus === 'success' 
                ? "Your email has been successfully verified. You can now proceed to login and start using TransyncPro."
                : verificationStatus === 'error'
                ? "We couldn't verify your email. Please try clicking the verification link again or request a new verification email."
                : "Verifying your email address..."}
            </p>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            {verificationStatus === 'success' && (
              <Button 
                className="w-full bg-transyncpro-button hover:bg-transyncpro-button/90"
                asChild
              >
                <Link to="/login">Continue to Login</Link>
              </Button>
            )}
            
            {verificationStatus === 'error' && (
              <div className="flex flex-col w-full gap-2">
                <Button 
                  className="w-full bg-transyncpro-button hover:bg-transyncpro-button/90"
                  asChild
                >
                  <Link to="/login">Back to Login</Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  asChild
                >
                  <Link to="/signup">Sign Up Again</Link>
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default Verify;

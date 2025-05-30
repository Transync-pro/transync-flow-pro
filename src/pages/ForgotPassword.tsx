
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/environmentClient";
import PageLayout from "@/components/PageLayout";
import { ArrowLeft, Mail } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // Apply consistent delay before any processing to prevent timing attacks
    const startTime = Date.now();
    const minProcessingTime = 2000; // 2 seconds minimum

    try {
      // Always attempt to send reset email - Supabase will handle non-existent emails gracefully
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      // Ensure minimum processing time has elapsed
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minProcessingTime) {
        await new Promise(resolve => setTimeout(resolve, minProcessingTime - elapsedTime));
      }

      // Always show success message regardless of whether email exists
      setIsEmailSent(true);
      toast({
        title: "Reset email sent",
        description: "If the supplied email exists, a password reset email has been sent to the email address associated with that account.",
      });
    } catch (error: any) {
      // Ensure minimum processing time even for errors
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minProcessingTime) {
        await new Promise(resolve => setTimeout(resolve, minProcessingTime - elapsedTime));
      }

      // Show the same success message even on error to prevent enumeration
      setIsEmailSent(true);
      toast({
        title: "Reset email sent",
        description: "If the supplied email exists, a password reset email has been sent to the email address associated with that account.",
      });
      
      // Log error for debugging but don't expose to user
      console.error("Password reset error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Check your email</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                If the supplied email exists, a password reset email has been sent to:
              </p>
              <p className="font-medium text-gray-900 mb-6">{email}</p>
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsEmailSent(false)}
              >
                Try again
              </Button>
              <Link to="/login" className="w-full">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Reset your password</CardTitle>
            <p className="text-center text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
              <Link to="/login" className="w-full">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ForgotPassword;

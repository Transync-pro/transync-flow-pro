import { useEffect, useState } from "react";
import { isUserAdmin } from "@/services/blog/users";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import PageLayout from "@/components/PageLayout";

const TestAdmin = () => {
  const [status, setStatus] = useState<string>("Checking...");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminChecking, setIsAdminChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      setIsAdminChecking(true);
      try {
        const adminStatus = await isUserAdmin();
        console.log("TestAdmin: Is user admin:", adminStatus);
        
        if (!adminStatus) {
          console.log("TestAdmin: User is not admin, redirecting to homepage");
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin area.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        setIsAdmin(true);
        setStatus(adminStatus ? "✅ You are an admin!" : "❌ You are not an admin");
      } catch (error: any) {
        console.error("TestAdmin: Error checking admin status:", error);
        toast({
          title: "Error",
          description: "Failed to verify admin permissions",
          variant: "destructive"
        });
        navigate('/');
        return;
      } finally {
        setIsAdminChecking(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  if (isAdminChecking) {
    return (
      <PageLayout>
        <div className="py-16 max-w-7xl mx-auto px-4 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
          <p className="text-center text-gray-600">Verifying admin access...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Admin Status Check</h1>
        <p className="text-lg">{status}</p>
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Debug Info:</h2>
          <pre className="text-sm bg-gray-800 text-white p-2 rounded overflow-auto">
            {JSON.stringify({
              timestamp: new Date().toISOString(),
              path: window.location.pathname,
              isAdmin
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TestAdmin;

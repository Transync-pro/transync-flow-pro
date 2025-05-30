import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import BlogImport from "@/components/Admin/BlogImport";
import { isUserAdmin } from "@/services/blog/users";
import { toast } from "@/components/ui/use-toast";

const BlogImportPage = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminChecking, setIsAdminChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      setIsAdminChecking(true);
      try {
        const adminStatus = await isUserAdmin();
        console.log("BlogImportPage: Is user admin:", adminStatus);
        
        if (!adminStatus) {
          console.log("BlogImportPage: User is not admin, redirecting to homepage");
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin area.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error("BlogImportPage: Error checking admin status:", error);
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
    <PageLayout>
      <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">WordPress XML Import</h1>
        <p className="text-gray-600 mb-8">
          Import your blog posts from a WordPress XML export file. Images will be automatically downloaded 
          and stored in our system, and all content will be properly formatted.
        </p>
        <BlogImport />
      </div>
    </PageLayout>
  );
};

export default BlogImportPage;

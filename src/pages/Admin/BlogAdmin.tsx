import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { checkUserRole, isUserAdmin } from "@/services/blog/users";
import type { BlogPost } from "@/types/blog";
import BlogAdminHeader from "@/components/Admin/BlogAdminHeader";
import BlogPostsTable from "@/components/Admin/BlogPostsTable";
import BlogPostForm from "@/components/Admin/BlogPostForm";
import SampleDataGenerator from "@/components/Admin/SampleDataGenerator";

const BlogAdmin = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminChecking, setIsAdminChecking] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<null | BlogPost>(null);
  const navigate = useNavigate();

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  
  useEffect(() => {
    const checkAdmin = async () => {
      console.log("BlogAdmin: Checking admin status");
      setIsAdminChecking(true);
      
      try {
        const adminStatus = await isUserAdmin();
        console.log("BlogAdmin: Is user admin:", adminStatus);
        
        if (!adminStatus) {
          console.log("BlogAdmin: User is not admin, redirecting to homepage");
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin area.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        setIsAdmin(true);
        fetchPosts();
      } catch (error) {
        console.error("BlogAdmin: Error checking admin status:", error);
        toast({
          title: "Error",
          description: "Failed to verify admin permissions",
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setIsAdminChecking(false);
      }
    };
    
    checkAdmin();
  }, [navigate]);
  
  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('published_date', { ascending: false });
        
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreatePost = () => {
    setSelectedPost(null);
    resetForm();
    setIsDialogOpen(true);
  };
  
  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    // Populate form
    setTitle(post.title);
    setSlug(post.slug);
    setSummary(post.summary);
    setContent(post.content);
    setFeaturedImage(post.featured_image);
    setAuthor(post.author);
    setCategory(post.category);
    setIsFeatured(post.is_featured);
    setMetaDescription(post.meta_description);
    setFocusKeyword(post.focus_keyword);
    setIsDialogOpen(true);
  };
  
  const handleDeletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Blog post deleted successfully"
      });
      
      // Refresh posts
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive"
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !slug || !summary || !content || !featuredImage || !author || !category || !metaDescription || !focusKeyword) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }
    
    const postData = {
      title,
      slug,
      summary,
      content,
      featured_image: featuredImage,
      author,
      category,
      is_featured: isFeatured,
      meta_description: metaDescription,
      focus_keyword: focusKeyword,
      updated_date: new Date().toISOString()
    };
    
    try {
      let response;
      
      if (selectedPost) {
        // Update post
        response = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', selectedPost.id);
      } else {
        // Insert new post
        response = await supabase
          .from('blog_posts')
          .insert([{
            ...postData,
            published_date: new Date().toISOString()
          }]);
      }
      
      if (response.error) throw response.error;
      
      toast({
        title: "Success",
        description: selectedPost ? "Blog post updated successfully" : "Blog post created successfully"
      });
      
      // Close dialog and refresh posts
      setIsDialogOpen(false);
      fetchPosts();
    } catch (error) {
      console.error("Error saving post:", error);
      toast({
        title: "Error",
        description: "Failed to save blog post",
        variant: "destructive"
      });
    }
  };
  
  const resetForm = () => {
    setTitle("");
    setSlug("");
    setSummary("");
    setContent("");
    setFeaturedImage("");
    setAuthor("");
    setCategory("");
    setIsFeatured(false);
    setMetaDescription("");
    setFocusKeyword("");
  };
  
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

  if (!isAdmin) {
    return (
      <PageLayout>
        <div className="py-16 max-w-7xl mx-auto px-4">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access the admin area.
            </AlertDescription>
          </Alert>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BlogAdminHeader onCreatePost={handleCreatePost} />
        
        <div className="mb-8">
          <SampleDataGenerator />
        </div>
        
        <BlogPostsTable 
          posts={posts}
          loading={loading}
          onEditPost={handleEditPost}
          onDeletePost={handleDeletePost}
        />
        
        <BlogPostForm 
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          post={selectedPost}
          title={title}
          setTitle={setTitle}
          slug={slug}
          setSlug={setSlug}
          summary={summary}
          setSummary={setSummary}
          content={content}
          setContent={setContent}
          featuredImage={featuredImage}
          setFeaturedImage={setFeaturedImage}
          author={author}
          setAuthor={setAuthor}
          category={category}
          setCategory={setCategory}
          isFeatured={isFeatured}
          setIsFeatured={setIsFeatured}
          metaDescription={metaDescription}
          setMetaDescription={setMetaDescription}
          focusKeyword={focusKeyword}
          setFocusKeyword={setFocusKeyword}
          onSubmit={handleSubmit}
        />
      </div>
    </PageLayout>
  );
};

export default BlogAdmin;

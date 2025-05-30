import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/environmentClient";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Pagination } from "@/components/ui/pagination";
import type { BlogPost } from "@/types/blog";
import BlogAdminHeader from "@/components/Admin/BlogAdminHeader";
import BlogPostsTable from "@/components/Admin/BlogPostsTable";
import BlogPostForm from "@/components/Admin/BlogPostForm";
import { isUserAdmin } from "@/services/blog/users";

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

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPosts, setTotalPosts] = useState(0);

  // Multi-select states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
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
        fetchPosts(page);
      } catch (error) {
        console.error("BlogAdmin: Error checking admin status:", error);
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
    // eslint-disable-next-line
  }, [navigate]);

  const fetchPosts = async (pageNum = 0) => {
    setLoading(true);
    try {
      const from = pageNum * pageSize;
      const to = from + pageSize - 1;
      
      // First get the count for pagination
      const { count, error: countError } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      // Then fetch the data for the current page
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('published_date', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      
      setPosts(data || []);
      setTotalPosts(count || 0);
      setSelectedIds([]);
      setSelectAll(false);
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
        .update({ status: 'trashed' })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Blog post moved to trash"
      });
      fetchPosts(page);
    } catch (error) {
      console.error("Error trashing post:", error);
      toast({
        title: "Error",
        description: "Failed to move blog post to trash",
        variant: "destructive"
      });
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: 'trash' | 'draft') => {
    if (selectedIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ status: action === 'trash' ? 'trashed' : 'draft' })
        .in('id', selectedIds);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `${selectedIds.length} posts moved to ${action === 'trash' ? 'trash' : 'drafts'}`
      });
      
      fetchPosts(page);
    } catch (error) {
      console.error("Bulk action error:", error);
      toast({
        title: "Error",
        description: `Failed to move posts to ${action === 'trash' ? 'trash' : 'drafts'}`,
        variant: "destructive"
      });
    }
  };

  // Multi-select logic
  const handleSelectPost = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
      setSelectAll(false);
    } else {
      setSelectedIds([...selectedIds, id]);
      if (selectedIds.length + 1 === posts.length) {
        setSelectAll(true);
      }
    }
  };
  
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(posts.map((p) => p.id));
      setSelectAll(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent, statusOverride?: 'draft' | 'published') => {
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
      updated_date: new Date().toISOString(),
      status: statusOverride || 'published'
    };
    
    try {
      let response;
      if (selectedPost) {
        response = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', selectedPost.id);
      } else {
        response = await supabase
          .from('blog_posts')
          .insert([{ ...postData, published_date: new Date().toISOString() }]);
      }
      
      if (response.error) throw response.error;
      
      toast({
        title: "Success",
        description: selectedPost 
          ? "Blog post updated successfully" 
          : "Blog post created successfully"
      });
      
      setIsDialogOpen(false);
      fetchPosts(page);
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

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalPosts / pageSize);

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
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BlogAdminHeader onCreatePost={handleCreatePost} />
        
        <div className="mb-4 flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleBulkAction('trash')} 
            disabled={selectedIds.length === 0}
          >
            Move to Trash
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleBulkAction('draft')} 
            disabled={selectedIds.length === 0}
          >
            Save to Drafts
          </Button>
          <span className="ml-4 text-sm text-gray-500">
            {selectedIds.length} selected
          </span>
        </div>
        
        <BlogPostsTable 
          posts={posts}
          loading={loading}
          onEditPost={handleEditPost}
          onDeletePost={handleDeletePost}
          selectedIds={selectedIds}
          onSelectPost={handleSelectPost}
          selectAll={selectAll}
          onSelectAll={handleSelectAll}
        />
        
        {totalPosts > pageSize && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
        
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
          onSaveDraft={(e) => handleSubmit(e, 'draft')}
          onPublish={(e) => handleSubmit(e, 'published')}
        />
      </div>
    </PageLayout>
  );
};

export default BlogAdmin;


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import { toast } from "@/components/ui/use-toast";
import type { BlogPost } from "@/types/blog";
import BlogAdminHeader from "@/components/Admin/BlogAdminHeader";
import BlogPostsTable from "@/components/Admin/BlogPostsTable";
import BlogPostForm from "@/components/Admin/BlogPostForm";

const BlogAdmin = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Admin check is handled by RouteGuard
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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPosts, setTotalPosts] = useState(0);

  // Multi-select states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchPosts(page);
    // eslint-disable-next-line
  }, [page]);

  const fetchPosts = async (pageNum = 1) => {
    setLoading(true);
    try {
      const from = (pageNum - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact' })
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
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Blog post deleted successfully"
      });
      fetchPosts(page);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete blog post",
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
        description: `Selected posts moved to ${action === 'trash' ? 'Trash' : 'Drafts'}`
      });
      fetchPosts(page);
    } catch (error) {
      console.error("Bulk action error:", error);
      toast({
        title: "Error",
        description: `Failed to move posts to ${action === 'trash' ? 'Trash' : 'Drafts'}`,
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
      if (selectedIds.length + 1 === posts.length) setSelectAll(true);
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
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
        description: selectedPost ? "Blog post updated successfully" : "Blog post created successfully"
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

  // Pagination controls
  const totalPages = Math.ceil(totalPosts / pageSize);

  return (
    <PageLayout>
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BlogAdminHeader onCreatePost={handleCreatePost} />
        <div className="mb-4 flex items-center gap-2">
          <Button variant="outline" onClick={() => handleBulkAction('trash')} disabled={selectedIds.length === 0}>Move to Trash</Button>
          <Button variant="outline" onClick={() => handleBulkAction('draft')} disabled={selectedIds.length === 0}>Save to Drafts</Button>
          <span className="ml-4 text-sm text-gray-500">{selectedIds.length} selected</span>
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
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <div className="space-x-2">
            <Button variant="ghost" disabled={page === 1} onClick={() => handlePageChange(page - 1)}>Previous</Button>
            {[...Array(totalPages)].map((_, idx) => (
              <Button key={idx} variant={page === idx + 1 ? 'default' : 'outline'} onClick={() => handlePageChange(idx + 1)}>{idx + 1}</Button>
            ))}
            <Button variant="ghost" disabled={page === totalPages} onClick={() => handlePageChange(page + 1)}>Next</Button>
          </div>
        </div>
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


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2, Search, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { checkUserRole } from "@/services/blogService";
import type { BlogPost, BlogTag } from "@/types/blog";

const BlogAdmin = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<null | BlogPost>(null);
  const [confirmDelete, setConfirmDelete] = useState<null | string>(null);
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
      const role = await checkUserRole();
      
      if (role !== 'admin') {
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
      setPosts(data);
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
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    
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
      setConfirmDelete(null);
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
  
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Blog Management</h1>
            <p className="text-gray-600">Create and manage your blog posts</p>
          </div>
          
          <Button onClick={handleCreatePost} className="flex items-center gap-2">
            <Plus size={16} />
            Create New Post
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">No blog posts found</TableCell>
                  </TableRow>
                ) : (
                  filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{post.author}</TableCell>
                      <TableCell>{post.category}</TableCell>
                      <TableCell>{format(new Date(post.published_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{post.is_featured ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEditPost(post)}>
                          <Edit size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant={confirmDelete === post.id ? "destructive" : "ghost"} 
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPost ? 'Edit Blog Post' : 'Create Blog Post'}
            </DialogTitle>
            <DialogDescription>
              {selectedPost ? 'Update the blog post details below.' : 'Fill in the blog post details below.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!selectedPost) {
                        // Generate slug from title
                        setSlug(e.target.value.toLowerCase()
                          .replace(/[^\w\s]/gi, '')
                          .replace(/\s+/g, '-'));
                      }
                    }} 
                    placeholder="Blog post title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="slug">
                    Slug
                    <span className="text-gray-500 text-sm ml-2">(URL path)</span>
                  </Label>
                  <Input 
                    id="slug" 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)} 
                    placeholder="blog-post-slug"
                  />
                </div>
                
                <div>
                  <Label htmlFor="author">Author</Label>
                  <Input 
                    id="author" 
                    value={author} 
                    onChange={(e) => setAuthor(e.target.value)} 
                    placeholder="Author name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input 
                    id="category" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    placeholder="Blog category"
                  />
                </div>
                
                <div>
                  <Label htmlFor="featuredImage">Featured Image URL</Label>
                  <Input 
                    id="featuredImage" 
                    value={featuredImage} 
                    onChange={(e) => setFeaturedImage(e.target.value)} 
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isFeatured" 
                    checked={isFeatured} 
                    onCheckedChange={(checked) => setIsFeatured(checked as boolean)} 
                  />
                  <Label htmlFor="isFeatured">Feature this post</Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea 
                    id="summary" 
                    value={summary} 
                    onChange={(e) => setSummary(e.target.value)} 
                    placeholder="Brief summary of the blog post"
                    className="h-20"
                  />
                </div>
                
                <div>
                  <Label htmlFor="metaDescription">
                    Meta Description
                    <span className="text-gray-500 text-sm ml-2">(SEO)</span>
                  </Label>
                  <Textarea 
                    id="metaDescription" 
                    value={metaDescription} 
                    onChange={(e) => setMetaDescription(e.target.value)} 
                    placeholder="SEO meta description (150-160 characters recommended)"
                    className="h-20"
                  />
                </div>
                
                <div>
                  <Label htmlFor="focusKeyword">
                    Focus Keyword
                    <span className="text-gray-500 text-sm ml-2">(SEO)</span>
                  </Label>
                  <Input 
                    id="focusKeyword" 
                    value={focusKeyword} 
                    onChange={(e) => setFocusKeyword(e.target.value)} 
                    placeholder="Main keyword for SEO"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="content">Content (HTML)</Label>
              <Textarea 
                id="content" 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Blog post content in HTML format"
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button type="submit">
                {selectedPost ? 'Update Post' : 'Create Post'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default BlogAdmin;

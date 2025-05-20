
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { BlogPost } from "@/types/blog";

interface BlogPostFormProps {
  isOpen: boolean;
  onClose: () => void;
  post: BlogPost | null;
  title: string;
  setTitle: (title: string) => void;
  slug: string;
  setSlug: (slug: string) => void;
  summary: string;
  setSummary: (summary: string) => void;
  content: string;
  setContent: (content: string) => void;
  featuredImage: string;
  setFeaturedImage: (url: string) => void;
  author: string;
  setAuthor: (author: string) => void;
  category: string;
  setCategory: (category: string) => void;
  isFeatured: boolean;
  setIsFeatured: (isFeatured: boolean) => void;
  metaDescription: string;
  setMetaDescription: (metaDescription: string) => void;
  focusKeyword: string;
  setFocusKeyword: (focusKeyword: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const BlogPostForm: React.FC<BlogPostFormProps> = ({
  isOpen,
  onClose,
  post,
  title,
  setTitle,
  slug,
  setSlug,
  summary,
  setSummary,
  content,
  setContent,
  featuredImage,
  setFeaturedImage,
  author,
  setAuthor,
  category,
  setCategory,
  isFeatured,
  setIsFeatured,
  metaDescription,
  setMetaDescription,
  focusKeyword,
  setFocusKeyword,
  onSubmit,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {post ? 'Edit Blog Post' : 'Create Blog Post'}
          </DialogTitle>
          <DialogDescription>
            {post ? 'Update the blog post details below.' : 'Fill in the blog post details below.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!post) {
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
              {post ? 'Update Post' : 'Create Post'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BlogPostForm;


import { supabase } from "@/integrations/supabase/client";
import type { BlogPost, BlogTag, SeoData } from "@/types/blog";

export async function getAllBlogPosts() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      blog_posts_tags (
        tag_id,
        blog_tags (
          id,
          name
        )
      )
    `)
    .order('published_date', { ascending: false });

  if (error) {
    console.error("Error fetching blog posts:", error);
    throw new Error(error.message);
  }

  // Process data to format tags correctly
  const processedData: BlogPost[] = [];
  const postMap = new Map();

  data.forEach(post => {
    const postId = post.id;
    
    if (!postMap.has(postId)) {
      const blogPost: BlogPost = {
        ...post,
        tags: [],
        // Ensure proper typing for JSON fields
        seo_data: post.seo_data ? JSON.parse(JSON.stringify(post.seo_data)) : {},
        content_blocks: post.content_blocks ? JSON.parse(JSON.stringify(post.content_blocks)) : [],
      };
      
      postMap.set(postId, blogPost);
      processedData.push(blogPost);
    }
    
    const currentPost = postMap.get(postId);
    
    // Add tags if they exist
    if (post.blog_posts_tags && Array.isArray(post.blog_posts_tags)) {
      post.blog_posts_tags.forEach(tagEntry => {
        if (tagEntry.blog_tags) {
          const tagExists = currentPost.tags?.some(tag => tag.id === tagEntry.blog_tags.id);
          
          if (!tagExists) {
            currentPost.tags?.push({
              id: tagEntry.blog_tags.id,
              name: tagEntry.blog_tags.name
            });
          }
        }
      });
    }
  });

  return processedData;
}

export async function getFeaturedBlogPosts() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      blog_posts_tags (
        tag_id,
        blog_tags (
          id,
          name
        )
      )
    `)
    .eq('is_featured', true)
    .order('published_date', { ascending: false });

  if (error) {
    console.error("Error fetching featured blog posts:", error);
    throw new Error(error.message);
  }

  // Process data to format tags correctly
  const processedData: BlogPost[] = [];
  const postMap = new Map();

  data.forEach(post => {
    const postId = post.id;
    
    if (!postMap.has(postId)) {
      const blogPost: BlogPost = {
        ...post,
        tags: [],
        // Ensure proper typing for JSON fields
        seo_data: post.seo_data ? JSON.parse(JSON.stringify(post.seo_data)) : {},
        content_blocks: post.content_blocks ? JSON.parse(JSON.stringify(post.content_blocks)) : [],
      };
      
      postMap.set(postId, blogPost);
      processedData.push(blogPost);
    }
    
    const currentPost = postMap.get(postId);
    
    // Add tags if they exist
    if (post.blog_posts_tags && Array.isArray(post.blog_posts_tags)) {
      post.blog_posts_tags.forEach(tagEntry => {
        if (tagEntry.blog_tags) {
          const tagExists = currentPost.tags?.some(tag => tag.id === tagEntry.blog_tags.id);
          
          if (!tagExists) {
            currentPost.tags?.push({
              id: tagEntry.blog_tags.id,
              name: tagEntry.blog_tags.name
            });
          }
        }
      });
    }
  });

  return processedData;
}

export async function getBlogPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      blog_posts_tags (
        tag_id,
        blog_tags (
          id,
          name
        )
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error(`Error fetching blog post with slug ${slug}:`, error);
    return null;
  }

  // Process tags to the correct format
  const tags = data.blog_posts_tags.map((tagEntry: any) => ({
    id: tagEntry.blog_tags.id,
    name: tagEntry.blog_tags.name
  }));

  const blogPost: BlogPost = {
    ...data,
    tags,
    // Ensure proper typing for JSON fields
    seo_data: data.seo_data ? JSON.parse(JSON.stringify(data.seo_data)) : {},
    content_blocks: data.content_blocks ? JSON.parse(JSON.stringify(data.content_blocks)) : [],
  };
  
  // Remove the raw join table data
  delete blogPost.blog_posts_tags;

  return blogPost;
}

export async function getBlogCategories() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('category')
    .order('category');

  if (error) {
    console.error("Error fetching blog categories:", error);
    throw new Error(error.message);
  }

  // Use a Set to get unique categories
  const categories = [...new Set(data.map(item => item.category))];
  return categories;
}

export async function getBlogTags() {
  const { data, error } = await supabase
    .from('blog_tags')
    .select('*')
    .order('name');

  if (error) {
    console.error("Error fetching blog tags:", error);
    throw new Error(error.message);
  }

  return data as BlogTag[];
}

export async function getRelatedPosts(postId: string, categoryName: string, limit = 3) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, summary, featured_image, category, published_date')
    .eq('category', categoryName)
    .neq('id', postId)
    .limit(limit);

  if (error) {
    console.error("Error fetching related posts:", error);
    return [];
  }

  return data;
}

export async function checkUserRole() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id);
    
  if (error || !data || data.length === 0) {
    console.error("Error checking user role:", error);
    return null;
  }
  
  return data[0].role;
}

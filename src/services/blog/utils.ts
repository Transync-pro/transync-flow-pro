
import type { BlogPost, BlogTag } from "@/types/blog";

/**
 * Process and format blog post data from Supabase
 * @param posts Raw blog post data from Supabase
 * @returns Processed blog posts with formatted tags
 */
export function processBlogPosts(posts: any[]): BlogPost[] {
  const processedData: BlogPost[] = [];
  const postMap = new Map();

  posts.forEach(post => {
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
      post.blog_posts_tags.forEach((tagEntry: any) => {
        if (tagEntry.blog_tags) {
          const tagExists = currentPost.tags?.some((tag: BlogTag) => tag.id === tagEntry.blog_tags.id);
          
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

/**
 * Process a single blog post and format its tags
 * @param data Raw blog post data from Supabase
 * @returns Processed blog post with formatted tags
 */
export function processSingleBlogPost(data: any): BlogPost | null {
  if (!data) return null;
  
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

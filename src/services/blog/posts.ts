
import { supabase } from "@/integrations/supabase/environmentClient";
import type { BlogPost } from "@/types/blog";
import { processBlogPosts, processSingleBlogPost } from "./utils";

/**
 * Get all blog posts
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    // Use the security definer function to avoid RLS issues
    const { data, error } = await supabase
      .rpc('get_blog_posts');

    if (error) {
      console.error("Error fetching blog posts:", error);
      throw new Error(error.message);
    }

    // We still need to fetch the tags for each post
    const postsWithTags = await addTagsToPosts(data);
    return processBlogPosts(postsWithTags);
  } catch (error) {
    console.error("Error in getAllBlogPosts:", error);
    throw error;
  }
}

/**
 * Get featured blog posts
 */
export async function getFeaturedBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_blog_posts');

    if (error) {
      console.error("Error fetching featured blog posts:", error);
      throw new Error(error.message);
    }

    // Filter for featured posts
    const featuredPosts = data.filter(post => post.is_featured);
    
    // We still need to fetch the tags for each post
    const postsWithTags = await addTagsToPosts(featuredPosts);
    return processBlogPosts(postsWithTags);
  } catch (error) {
    console.error("Error in getFeaturedBlogPosts:", error);
    throw error;
  }
}

/**
 * Get a blog post by slug
 * @param slug The blog post slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_blog_posts');

    if (error) {
      console.error(`Error fetching blog posts:`, error);
      throw new Error(error.message);
    }

    // Find the post with matching slug
    const post = data.find(p => p.slug === slug);
    
    if (!post) {
      return null;
    }

    // Fetch tags for this post
    const { data: tagsData, error: tagsError } = await supabase
      .rpc('get_blog_posts_tags');

    if (tagsError) {
      console.error("Error fetching blog post tags:", tagsError);
      throw new Error(tagsError.message);
    }

    // Filter tags for this post
    const postTags = tagsData.filter(tag => tag.post_id === post.id);

    // Fetch tag details
    const { data: tagDetails, error: tagDetailsError } = await supabase
      .rpc('get_blog_tags');

    if (tagDetailsError) {
      console.error("Error fetching blog tags:", tagDetailsError);
      throw new Error(tagDetailsError.message);
    }

    // Add tags to the post
    const postWithTags = {
      ...post,
      blog_posts_tags: postTags.map(pt => ({
        tag_id: pt.tag_id,
        blog_tags: tagDetails.find((t: any) => t.id === pt.tag_id) || null
      }))
    };

    return processSingleBlogPost(postWithTags);
  } catch (error) {
    console.error(`Error in getBlogPostBySlug:`, error);
    return null;
  }
}

/**
 * Get related posts for a blog post
 * @param postId The ID of the current post
 * @param categoryName The category to match
 * @param limit Maximum number of related posts to return
 */
export async function getRelatedPosts(postId: string, categoryName: string, limit = 3): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_blog_posts');

    if (error) {
      console.error("Error fetching related posts:", error);
      return [];
    }

    // Filter posts by category and exclude current post
    const relatedPosts = data
      .filter(post => post.category === categoryName && post.id !== postId)
      .slice(0, limit)
      .map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        featured_image: post.featured_image,
        category: post.category,
        published_date: post.published_date
      }));

    return relatedPosts;
  } catch (error) {
    console.error("Error in getRelatedPosts:", error);
    return [];
  }
}

/**
 * Helper function to add tags to posts
 * @param posts Array of posts to add tags to
 */
async function addTagsToPosts(posts: any[]): Promise<any[]> {
  if (!posts || posts.length === 0) {
    return [];
  }

  try {
    // Fetch all post-tag relationships
    const { data: tagsRelData, error: tagsRelError } = await supabase
      .rpc('get_blog_posts_tags');

    if (tagsRelError) {
      console.error("Error fetching blog post tags relationships:", tagsRelError);
      return posts;
    }

    // Fetch all tags
    const { data: tagsData, error: tagsError } = await supabase
      .rpc('get_blog_tags');

    if (tagsError) {
      console.error("Error fetching blog tags:", tagsError);
      return posts;
    }

    // Add tags to each post
    return posts.map(post => {
      const postTagRelations = tagsRelData.filter((rel: any) => rel.post_id === post.id);
      
      return {
        ...post,
        blog_posts_tags: postTagRelations.map((rel: any) => ({
          tag_id: rel.tag_id,
          blog_tags: tagsData.find((tag: any) => tag.id === rel.tag_id) || null
        }))
      };
    });
  } catch (error) {
    console.error("Error adding tags to posts:", error);
    return posts;
  }
}

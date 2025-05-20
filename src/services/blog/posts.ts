
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost } from "@/types/blog";
import { processBlogPosts, processSingleBlogPost } from "./utils";

/**
 * Get all blog posts
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
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

  return processBlogPosts(data);
}

/**
 * Get featured blog posts
 */
export async function getFeaturedBlogPosts(): Promise<BlogPost[]> {
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

  return processBlogPosts(data);
}

/**
 * Get a blog post by slug
 * @param slug The blog post slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
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

  return processSingleBlogPost(data);
}

/**
 * Get related posts for a blog post
 * @param postId The ID of the current post
 * @param categoryName The category to match
 * @param limit Maximum number of related posts to return
 */
export async function getRelatedPosts(postId: string, categoryName: string, limit = 3): Promise<any[]> {
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

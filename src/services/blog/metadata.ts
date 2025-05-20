
import { supabase } from "@/integrations/supabase/client";
import type { BlogTag } from "@/types/blog";

/**
 * Get unique blog categories
 */
export async function getBlogCategories(): Promise<string[]> {
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

/**
 * Get all blog tags
 */
export async function getBlogTags(): Promise<BlogTag[]> {
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


import { supabase } from "@/integrations/supabase/client";
import type { BlogTag } from "@/types/blog";

/**
 * Get unique blog categories
 */
export async function getBlogCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_blog_posts');

    if (error) {
      console.error("Error fetching blog categories:", error);
      throw new Error(error.message);
    }

    // Use a Set to get unique categories
    const categories = [...new Set(data.map((item: any) => item.category))];
    return categories;
  } catch (error) {
    console.error("Error in getBlogCategories:", error);
    throw error;
  }
}

/**
 * Get all blog tags
 */
export async function getBlogTags(): Promise<BlogTag[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_blog_tags');

    if (error) {
      console.error("Error fetching blog tags:", error);
      throw new Error(error.message);
    }

    return data as BlogTag[];
  } catch (error) {
    console.error("Error in getBlogTags:", error);
    throw error;
  }
}

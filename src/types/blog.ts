
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  featured_image: string;
  author: string;
  category: string;
  published_date: string;
  updated_date: string;
  is_featured: boolean;
  meta_title?: string;
  meta_description: string;
  canonical_url?: string;
  focus_keyword: string;
  social_image_url?: string;
  seo_data?: Record<string, any>;
  content_blocks?: any[];
  tags?: BlogTag[];
  // This will be removed during processing but is needed for TypeScript
  blog_posts_tags?: any[];
}

export interface BlogTag {
  id: string;
  name: string;
}

export interface SeoData {
  title: string;
  description: string;
  canonical?: string;
  keywords: string[];
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
}

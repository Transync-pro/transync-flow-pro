
import { supabase } from "@/integrations/supabase/client";
import { parseStringPromise } from "xml2js";
import { DOMParser } from "xmldom";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";
import type { BlogPost } from "@/types/blog";

/**
 * WordPress post data structure after extraction
 */
interface WordPressPost {
  id: string;
  title: string;
  content: string;
  summary: string;
  pubDate: string;
  author: string;
  category: string;
  featuredImage: string | null;
  link: string | null;
  postName: string;
  status: string;
  metaDescription?: string;
  focusKeyword?: string;
  images: string[];
}

/**
 * Import job tracking interface
 */
interface ImportJob {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filePath: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    total: number;
    imported: number;
    failed: number;
  };
  errors: Array<{
    postId?: string;
    title?: string;
    message: string;
  }>;
}

/**
 * Create a new import job
 */
export const createImportJob = async (
  filePath: string, 
  userId: string
): Promise<ImportJob | null> => {
  try {
    const { data, error } = await supabase
      .from('blog_import_jobs')
      .insert({
        file_path: filePath,
        user_id: userId,
        stats: { total: 0, imported: 0, failed: 0 },
        errors: []
      })
      .select('*')
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      filePath: data.file_path,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      stats: data.stats,
      errors: data.errors
    };
  } catch (error) {
    console.error("Error creating import job:", error);
    return null;
  }
};

/**
 * Get import job by ID
 */
export const getImportJobById = async (jobId: string): Promise<ImportJob | null> => {
  try {
    const { data, error } = await supabase
      .from('blog_import_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    if (!data) return null;
    
    return {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      filePath: data.file_path,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      stats: data.stats,
      errors: data.errors
    };
  } catch (error) {
    console.error("Error fetching import job:", error);
    return null;
  }
};

/**
 * Get all import jobs
 */
export const getAllImportJobs = async (): Promise<ImportJob[]> => {
  try {
    const { data, error } = await supabase
      .from('blog_import_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(job => ({
      id: job.id,
      userId: job.user_id,
      status: job.status,
      filePath: job.file_path,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      stats: job.stats,
      errors: job.errors
    }));
  } catch (error) {
    console.error("Error fetching import jobs:", error);
    return [];
  }
};

/**
 * Update import job status and stats
 */
export const updateImportJobStatus = async (
  jobId: string, 
  status: ImportJob['status'],
  stats?: ImportJob['stats'],
  errors?: ImportJob['errors']
): Promise<boolean> => {
  try {
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };
    
    if (stats) updateData.stats = stats;
    if (errors) updateData.errors = errors;
    
    const { error } = await supabase
      .from('blog_import_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating import job:", error);
    return false;
  }
};

/**
 * Process WordPress XML file and extract post data
 */
export const processWordPressXml = async (xmlContent: string): Promise<WordPressPost[]> => {
  try {
    const result = await parseStringPromise(xmlContent, { explicitArray: false });
    const rss = result.rss;
    const channel = rss.channel;
    const items = Array.isArray(channel.item) ? channel.item : [channel.item];
    
    const posts: WordPressPost[] = [];
    
    for (const item of items) {
      // Filter for actual posts (not attachments or other content types)
      if (item['wp:post_type'] !== 'post' || item['wp:status'] !== 'publish') {
        continue;
      }
      
      // Extract post data
      const post: WordPressPost = {
        id: item['wp:post_id'],
        title: item.title || 'Untitled',
        content: item['content:encoded'] || '',
        summary: item['excerpt:encoded'] || '',
        pubDate: new Date(item.pubDate).toISOString(),
        author: item['dc:creator'] || 'Unknown',
        category: extractPrimaryCategory(item),
        featuredImage: null,
        link: item.link || null,
        postName: item['wp:post_name'] || '',
        status: item['wp:status'] || 'draft',
        images: extractImages(item['content:encoded'] || ''),
      };
      
      // Extract Yoast SEO metadata if present
      const postmeta = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : [item['wp:postmeta']];
      if (postmeta) {
        for (const meta of postmeta) {
          if (meta['wp:meta_key'] === '_yoast_wpseo_metadesc') {
            post.metaDescription = meta['wp:meta_value'] || '';
          }
          if (meta['wp:meta_key'] === '_yoast_wpseo_focuskw') {
            post.focusKeyword = meta['wp:meta_value'] || '';
          }
        }
      }
      
      posts.push(post);
    }
    
    return posts;
  } catch (error) {
    console.error("Error processing WordPress XML:", error);
    return [];
  }
};

/**
 * Extract primary category from WordPress post
 */
function extractPrimaryCategory(item: any): string {
  if (!item.category) return 'Uncategorized';
  
  if (Array.isArray(item.category)) {
    // Try to find a category that's not "Uncategorized"
    const nonDefaultCategory = item.category.find(
      (cat: any) => 
        cat._ && 
        cat._.toLowerCase() !== 'uncategorized' && 
        cat.$?.domain === 'category'
    );
    
    if (nonDefaultCategory) {
      return nonDefaultCategory._ || 'Uncategorized';
    }
    
    // If no proper category found, return the first one
    return item.category[0]._ || item.category[0] || 'Uncategorized';
  }
  
  return item.category._ || item.category || 'Uncategorized';
}

/**
 * Extract all image URLs from content
 */
function extractImages(content: string): string[] {
  try {
    const images: string[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${content}</div>`, 'text/html');
    const imgTags = doc.getElementsByTagName('img');
    
    for (let i = 0; i < imgTags.length; i++) {
      const src = imgTags[i].getAttribute('src');
      if (src) images.push(src);
    }
    
    return images;
  } catch (error) {
    console.error("Error extracting images:", error);
    return [];
  }
}

/**
 * Download image and upload to Supabase storage
 */
export const processImage = async (imageUrl: string, jobId: string): Promise<string | null> => {
  try {
    // Skip if URL is already pointing to our storage
    if (imageUrl.includes(window.location.hostname)) {
      return imageUrl;
    }

    // Generate a unique filename
    const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${jobId}/${fileName}`;
    
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: blob.type });
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('blog-images')
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: urlData } = supabase
      .storage
      .from('blog-images')
      .getPublicUrl(filePath);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error processing image:", error, imageUrl);
    return null;
  }
};

/**
 * Replace image URLs in content
 */
export const replaceImageUrls = async (content: string, imageMap: Record<string, string>): Promise<string> => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${content}</div>`, 'text/html');
    const imgTags = doc.getElementsByTagName('img');
    
    for (let i = 0; i < imgTags.length; i++) {
      const src = imgTags[i].getAttribute('src');
      if (src && imageMap[src]) {
        imgTags[i].setAttribute('src', imageMap[src]);
      }
    }
    
    // Extract the HTML content from the div
    return doc.documentElement.innerHTML;
  } catch (error) {
    console.error("Error replacing image URLs:", error);
    return content;
  }
};

/**
 * Convert WordPress post to blog post format
 */
const convertToBlogPost = (wpPost: WordPressPost, imageMap: Record<string, string>): Partial<BlogPost> => {
  return {
    title: wpPost.title,
    slug: wpPost.postName || wpPost.title.toLowerCase().replace(/\s+/g, '-'),
    summary: wpPost.summary || wpPost.content.substring(0, 200),
    content: wpPost.content,
    featured_image: wpPost.featuredImage || Object.values(imageMap)[0] || 'https://placehold.co/600x400?text=Blog+Post',
    author: wpPost.author,
    category: wpPost.category,
    is_featured: false,
    meta_description: wpPost.metaDescription || wpPost.summary || wpPost.content.substring(0, 160),
    focus_keyword: wpPost.focusKeyword || '',
    seo_data: {
      original_url: wpPost.link,
      wp_post_id: wpPost.id
    }
  };
};

/**
 * Check if post already exists
 */
export const checkPostExists = async (wpPostId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('blog_import_mappings')
      .select('id')
      .eq('wp_post_id', wpPostId)
      .maybeSingle();
      
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error("Error checking if post exists:", error);
    return false;
  }
};

/**
 * Process a single WordPress post
 */
export const processWordPressPost = async (
  wpPost: WordPressPost,
  jobId: string
): Promise<{ success: boolean; postId?: string; error?: string }> => {
  try {
    // Check if post already exists
    const postExists = await checkPostExists(wpPost.id);
    if (postExists) {
      return { 
        success: false, 
        error: `Post with WordPress ID ${wpPost.id} already imported` 
      };
    }
    
    // Process all images in the post
    const imageMap: Record<string, string> = {};
    for (const imageUrl of wpPost.images) {
      const newUrl = await processImage(imageUrl, jobId);
      if (newUrl) {
        imageMap[imageUrl] = newUrl;
      }
    }
    
    // If there's a featured image, process it too
    if (wpPost.featuredImage) {
      const newFeaturedImage = await processImage(wpPost.featuredImage, jobId);
      if (newFeaturedImage) {
        imageMap[wpPost.featuredImage] = newFeaturedImage;
        wpPost.featuredImage = newFeaturedImage;
      }
    } else if (wpPost.images.length > 0 && imageMap[wpPost.images[0]]) {
      // Use the first image as featured if none was specified
      wpPost.featuredImage = imageMap[wpPost.images[0]];
    }
    
    // Replace image URLs in content
    const updatedContent = await replaceImageUrls(wpPost.content, imageMap);
    wpPost.content = updatedContent;
    
    // Convert to blog post format
    const blogPost = convertToBlogPost(wpPost, imageMap);
    
    // Insert into database
    const { data: insertedPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert([blogPost])
      .select('id')
      .single();
      
    if (insertError) throw insertError;
    
    // Create mapping record
    const { error: mappingError } = await supabase
      .from('blog_import_mappings')
      .insert([{
        job_id: jobId,
        wp_post_id: wpPost.id,
        blog_post_id: insertedPost.id,
        original_url: wpPost.link
      }]);
      
    if (mappingError) throw mappingError;
    
    return { success: true, postId: insertedPost.id };
  } catch (error: any) {
    console.error("Error processing WordPress post:", error);
    return { 
      success: false, 
      error: error.message || "Unknown error processing post" 
    };
  }
};

/**
 * Import WordPress XML content
 */
export const importWordPressXml = async (
  xmlContent: string,
  userId: string,
  filePath: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: boolean; jobId: string; message: string }> => {
  try {
    // Create import job
    const job = await createImportJob(filePath, userId);
    if (!job) {
      throw new Error("Failed to create import job");
    }

    // Start processing in the background
    setTimeout(async () => {
      try {
        // Parse XML content
        const wpPosts = await processWordPressXml(xmlContent);
        
        // Update job with total count
        await updateImportJobStatus(job.id, 'processing', {
          total: wpPosts.length,
          imported: 0,
          failed: 0
        }, []);
        
        // Process each post
        let importedCount = 0;
        let failedCount = 0;
        const errors = [];
        
        for (let i = 0; i < wpPosts.length; i++) {
          const post = wpPosts[i];
          const result = await processWordPressPost(post, job.id);
          
          if (result.success) {
            importedCount++;
          } else {
            failedCount++;
            errors.push({
              postId: post.id,
              title: post.title,
              message: result.error || "Unknown error"
            });
          }
          
          // Update progress
          if (onProgress) {
            onProgress(i + 1, wpPosts.length);
          }
          
          // Update job stats every 5 posts
          if (i % 5 === 0 || i === wpPosts.length - 1) {
            await updateImportJobStatus(job.id, 'processing', {
              total: wpPosts.length,
              imported: importedCount,
              failed: failedCount
            }, errors);
          }
        }
        
        // Update job status to completed
        await updateImportJobStatus(job.id, 'completed', {
          total: wpPosts.length,
          imported: importedCount,
          failed: failedCount
        }, errors);
        
      } catch (error: any) {
        console.error("Error in import process:", error);
        await updateImportJobStatus(job.id, 'failed', undefined, [{
          message: error.message || "Unknown error in import process"
        }]);
      }
    }, 100);

    return {
      success: true,
      jobId: job.id,
      message: "Import job created successfully and processing has begun"
    };
  } catch (error: any) {
    console.error("Error importing WordPress XML:", error);
    return {
      success: false,
      jobId: "",
      message: error.message || "Unknown error"
    };
  }
};

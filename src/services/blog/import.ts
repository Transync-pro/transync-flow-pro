import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";
import type { BlogPost } from "@/types/blog";
import { logError } from "@/utils/errorLogger";

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
    const initialStats = { total: 0, imported: 0, failed: 0 };
    const initialErrors: Array<{postId?: string; title?: string; message: string}> = [];
    
    const { data, error } = await supabase
      .from('blog_import_jobs')
      .insert({
        file_path: filePath,
        user_id: userId,
        stats: initialStats,
        errors: initialErrors
      })
      .select('*')
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      status: data.status as ImportJob['status'],
      filePath: data.file_path,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      stats: data.stats as ImportJob['stats'],
      errors: data.errors as ImportJob['errors']
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
      status: data.status as ImportJob['status'],
      filePath: data.file_path,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      stats: data.stats as ImportJob['stats'],
      errors: data.errors as ImportJob['errors']
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
      status: job.status as ImportJob['status'],
      filePath: job.file_path,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      stats: job.stats as ImportJob['stats'],
      errors: job.errors as ImportJob['errors']
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
}
/**
 * Process WordPress XML file and extract post data
 * Using a browser-compatible approach for XML parsing
 */
export const processWordPressXml = async (xmlContent: string): Promise<WordPressPost[]> => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("XML parsing error");
    }
    const posts: WordPressPost[] = [];
    const items = xmlDoc.getElementsByTagName("item");
    const attachmentMap: Record<string, string> = {};
    console.log(`Found ${items.length} items in WordPress XML`);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // Helper to get namespaced element text
      const getNsText = (tag: string) => {
        const el = item.getElementsByTagName(tag)[0];
        return el ? el.textContent || '' : '';
      };
      // Check if it's a post and published
      const postType = getNsText("wp:post_type");
      const postStatus = getNsText("wp:status");
      if (postType === 'attachment') {
        // Build attachment map
        const attachmentId = getNsText("wp:post_id");
        const attachmentUrl = getNsText("link");
        attachmentMap[attachmentId] = attachmentUrl;
      } else if (postType !== 'post' || postStatus !== 'publish') {
        continue;
      }
      // Extract post data
      const post: WordPressPost = {
        id: getNsText("wp:post_id"),
        title: getNsText("title") || 'Untitled',
        content: getNsText("content:encoded") || '',
        summary: getNsText("excerpt:encoded") || '',
        pubDate: new Date(getNsText("pubDate") || '').toISOString(),
        author: getNsText("dc:creator") || 'Unknown',
        category: extractPrimaryCategoryDOM(item),
        featuredImage: null,
        link: getNsText("link") || null,
        postName: getNsText("wp:post_name") || '',
        status: postStatus || 'draft',
        images: extractImagesFromContent(getNsText("content:encoded") || ''),
      };
      // Extract Yoast SEO metadata if present
      const postmetaElements = item.getElementsByTagName("wp:postmeta");
      for (let j = 0; j < postmetaElements.length; j++) {
        const metaKey = postmetaElements[j].getElementsByTagName("wp:meta_key")[0]?.textContent || '';
        const metaValue = postmetaElements[j].getElementsByTagName("wp:meta_value")[0]?.textContent || '';
        if (metaKey === '_yoast_wpseo_metadesc') {
          post.metaDescription = metaValue || '';
        }
        if (metaKey === '_yoast_wpseo_focuskw') {
          post.focusKeyword = metaValue || '';
        }
        if (metaKey === '_thumbnail_id') {
          const thumbnailId = metaValue;
          post.featuredImage = attachmentMap[thumbnailId] || null;
        }
      }
      posts.push(post);
    }
    console.log(`Processed ${posts.length} posts from WordPress XML`);
    return posts;
  } catch (error) {
    console.error("Error processing WordPress XML:", error);
    logError("Failed to process WordPress XML", {
      source: "WordPress Import",
      context: { error }
    });
    return [];
  }
};
function getElementTextContent(parent: Element, selector: string): string {
  try {
    // Try both querySelector and getElementsByTagName for compatibility
    let element = parent.querySelector(selector);
    if (!element && selector.includes(':')) {
      // Try without escaping colon
      element = parent.querySelector(selector.replace('\\:', ':'));
    }
    if (!element && selector.includes(':')) {
      // Try getElementsByTagName for namespaced elements
      element = parent.getElementsByTagName(selector.replace('\\:', ':'))[0];
    }
    return element ? element.textContent || '' : '';
  } catch (error) {
    return '';
  }
}

/**
 * Extract primary category from WordPress post using DOM API
 */
function extractPrimaryCategoryDOM(item: Element): string {
  try {
    const categories = item.querySelectorAll("category");
    if (categories.length === 0) return 'Uncategorized';
    
    // Try to find a category that's not "Uncategorized"
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const domain = cat.getAttribute('domain');
      const text = cat.textContent || '';
      
      if (domain === 'category' && text.toLowerCase() !== 'uncategorized') {
        return text;
      }
    }
    
    // If no proper category found, return the first one
    return categories[0].textContent || 'Uncategorized';
  } catch (error) {
    return 'Uncategorized';
  }
}

/**
 * Extract all image URLs from content using DOM API
 */
function extractImagesFromContent(content: string): string[] {
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
 * This now returns a complete BlogPost object with all required fields
 */
const convertToBlogPost = (wpPost: WordPressPost, imageMap: Record<string, string>): Omit<BlogPost, 'id' | 'tags' | 'blog_posts_tags'> => {
  const currentDate = new Date().toISOString();
  
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
    published_date: wpPost.pubDate || currentDate,
    updated_date: currentDate,
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
    
    // Convert to blog post format - ensuring all required fields are present
    const blogPost = convertToBlogPost(wpPost, imageMap);
    
    // Insert into database
    const { data: insertedPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert(blogPost)
      .select('id')
      .single();
      
    if (insertError) throw insertError;
    
    // Create mapping record
    const { error: mappingError } = await supabase
      .from('blog_import_mappings')
      .insert({
        job_id: jobId,
        wp_post_id: wpPost.id,
        blog_post_id: insertedPost.id,
        original_url: wpPost.link
      });
      
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

    console.log("Import job created:", job.id);

    // Start processing in the background
    setTimeout(async () => {
      try {
        console.log("Starting XML processing");
        // Parse XML content
        const wpPosts = await processWordPressXml(xmlContent);
        console.log(`Extracted ${wpPosts.length} posts from WordPress XML`);
        
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
          console.log(`Processing post ${i+1}/${wpPosts.length}: ${post.title}`);
          
          const result = await processWordPressPost(post, job.id);
          
          if (result.success) {
            importedCount++;
            console.log(`Successfully imported post: ${post.title}`);
          } else {
            failedCount++;
            console.error(`Failed to import post: ${post.title}`, result.error);
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
        
        console.log("Import completed:", {
          total: wpPosts.length,
          imported: importedCount,
          failed: failedCount
        });
        
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

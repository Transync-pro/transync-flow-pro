
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getBlogPostBySlug, getRelatedPosts } from "@/services/blogService";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, ArrowLeft, Tag } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import SeoHead from "@/components/Blog/SeoHead";
import { type BlogPost } from "@/types/blog";
import NotFound from "@/pages/NotFound";

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPostData = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const postData = await getBlogPostBySlug(slug);
        
        if (!postData) {
          setNotFound(true);
          return;
        }
        
        setPost(postData);
        
        // Fetch related posts
        const related = await getRelatedPosts(postData.id, postData.category);
        setRelatedPosts(related);
      } catch (error) {
        console.error("Error fetching blog post:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPostData();
  }, [slug]);
  
  if (notFound) {
    return <NotFound />;
  }

  if (loading || !post) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-64 w-full mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        </div>
      </PageLayout>
    );
  }
  
  // Format the date
  const formattedDate = format(new Date(post.published_date), 'MMMM d, yyyy');
  
  // Prepare SEO data
  const seoData = {
    title: post.meta_title || post.title,
    description: post.meta_description,
    canonical: post.canonical_url,
    keywords: [post.focus_keyword, ...(post.tags?.map(tag => tag.name) || [])],
    og_image: post.social_image_url || post.featured_image,
    ...post.seo_data
  };

  return (
    <PageLayout>
      <SeoHead seo={seoData} slug={slug} />
      
      <article className="bg-white">
        {/* Hero Section with Featured Image */}
        <div 
          className="w-full bg-center bg-cover h-[40vh] relative" 
          style={{ backgroundImage: `url(${post.featured_image})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">{post.title}</h1>
              <div className="flex flex-wrap items-center text-white gap-4 mb-2">
                <div className="flex items-center">
                  <User size={16} className="mr-1" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1" />
                  <span>{formattedDate}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{post.category}</Badge>
                {post.tags?.map(tag => (
                  <Badge key={tag.id} variant="outline" className="bg-white/10">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Button variant="ghost" asChild className="mb-8 flex items-center">
            <Link to="/blog">
              <ArrowLeft size={16} className="mr-2" />
              Back to Blog
            </Link>
          </Button>
          
          <div 
            className="prose prose-lg max-w-none" 
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          
          {/* Tags Section */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 border-t pt-6">
              <div className="flex items-center flex-wrap gap-2">
                <Tag size={20} className="text-gray-600" />
                <span className="font-medium">Tags:</span>
                {post.tags.map(tag => (
                  <Badge key={tag.id} variant="outline">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="bg-gray-50 py-12">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map(related => (
                  <div key={related.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <Link to={`/blog/${related.slug}`}>
                      <img 
                        src={related.featured_image} 
                        alt={related.title} 
                        className="w-full h-40 object-cover"
                        loading="lazy" 
                      />
                    </Link>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2">
                        <Link to={`/blog/${related.slug}`}>{related.title}</Link>
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{related.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </article>
    </PageLayout>
  );
};

export default BlogDetail;


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { getAllBlogPosts, getBlogCategories } from "@/services/blogService"; 
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import BlogPost from "@/components/Blog/BlogPost";
import type { BlogPost as BlogPostType } from "@/types/blog";
import SeoHead from "@/components/Blog/SeoHead";

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [blogPosts, setBlogPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  
  useEffect(() => {
    const fetchBlogData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const fetchedCategories = await getBlogCategories();
        setCategories(["All", ...fetchedCategories]);
        
        // Fetch blog posts
        const posts = await getAllBlogPosts();
        setBlogPosts(posts);
      } catch (error) {
        console.error("Error fetching blog data:", error);
        toast({
          title: "Error loading blog",
          description: "Failed to load blog posts. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogData();
  }, []);

  // Filter blog posts by search query and category
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Split posts into featured and regular
  const featuredPosts = filteredPosts.filter(post => post.is_featured);
  const regularPosts = filteredPosts.filter(post => !post.is_featured);
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Subscription successful",
      description: "Thank you for subscribing to our newsletter!",
    });
    setEmail("");
  };
  
  // SEO data for the blog index page
  const seoData = {
    title: "TransyncPro Blog - QuickBooks Data Management & Accounting Tips",
    description: "Expert tips, tutorials, and insights on QuickBooks data management and accounting best practices.",
    keywords: ["QuickBooks", "Accounting", "Data Management", "TransyncPro", "Tutorials"],
  };

  return (
    <PageLayout>
      <SeoHead seo={seoData} />
      
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">TransyncPro Blog</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Expert tips, tutorials, and insights on QuickBooks data management and accounting best practices.
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex items-center justify-between">
            <div className="relative mb-4 md:mb-0 md:w-1/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {loading ? (
                <>
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                </>
              ) : (
                categories.map(category => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    onClick={() => setActiveCategory(category)}
                    className={activeCategory === category ? "bg-transyncpro-button hover:bg-transyncpro-button/90" : ""}
                  >
                    {category}
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {loading ? (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-64 mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </section>
      ) : (
        featuredPosts.length > 0 && (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold gradient-text mb-8">Featured Articles</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                {featuredPosts.map(post => (
                  <BlogPost key={post.id} post={post} featured />
                ))}
              </div>
            </div>
          </section>
        )
      )}

      {/* Regular Posts */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold gradient-text mb-8">Latest Articles</h2>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : regularPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map(post => (
                <BlogPost key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No articles found matching your search criteria.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold gradient-text mb-6">Subscribe to Our Newsletter</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Get the latest QuickBooks tips, accounting best practices, and TransyncPro updates delivered to your inbox.
          </p>
          
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Your email address" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow"
            />
            <Button 
              type="submit"
              className="bg-transyncpro-button hover:bg-transyncpro-button/90 text-white whitespace-nowrap"
            >
              Subscribe
            </Button>
          </form>
          
          <p className="text-xs text-gray-500 mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default Blog;

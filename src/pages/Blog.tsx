
import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import { getAllBlogPosts, getBlogCategories } from "@/services/blog"; 
import { toast } from "@/components/ui/use-toast";
import type { BlogPost as BlogPostType } from "@/types/blog";
import SeoHead from "@/components/Blog/SeoHead";
import BlogHero from "@/components/Blog/BlogHero";
import BlogSearch from "@/components/Blog/BlogSearch";
import BlogFeaturedPosts from "@/components/Blog/BlogFeaturedPosts";
import BlogPostsList from "@/components/Blog/BlogPostsList";
import BlogNewsletter from "@/components/Blog/BlogNewsletter";
import AdminCreator from "@/components/Blog/AdminCreator";

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [blogPosts, setBlogPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  
  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveCategory("All");
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
      
      <BlogHero 
        title="TransyncPro Blog" 
        description="Expert tips, tutorials, and insights on QuickBooks data management and accounting best practices." 
      />

      <div className="bg-white pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
          <AdminCreator />
        </div>
      </div>

      <BlogSearch 
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categories={categories}
        loading={loading}
      />

      <BlogFeaturedPosts 
        featuredPosts={featuredPosts}
        loading={loading}
      />

      <BlogPostsList 
        posts={regularPosts}
        loading={loading}
        onClearFilters={handleClearFilters}
      />

      <BlogNewsletter />
    </PageLayout>
  );
};

export default Blog;

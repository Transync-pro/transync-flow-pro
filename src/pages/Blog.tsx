
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  
  const categories = ["All", "QuickBooks Tips", "Data Management", "Tutorials", "News", "Case Studies"];
  
  const blogPosts = [
    {
      id: 1,
      title: "10 Time-Saving QuickBooks Hacks for Busy Accountants",
      summary: "Discover how to streamline your QuickBooks workflow with these expert tips that can save you hours every week.",
      category: "QuickBooks Tips",
      author: "Sarah Johnson",
      date: "May 10, 2025",
      image: "https://images.unsplash.com/photo-1586473219010-2ffc57b0d282?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: true
    },
    {
      id: 2,
      title: "How to Clean Up Years of QuickBooks Data Without Losing Your Mind",
      summary: "Learn the systematic approach to cleaning up historical QuickBooks data while maintaining data integrity and audit trails.",
      category: "Data Management",
      author: "Michael Chen",
      date: "May 5, 2025",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: false
    },
    {
      id: 3,
      title: "Step-by-Step: Importing Customer Data from Excel to QuickBooks",
      summary: "Follow this detailed tutorial on how to properly format and import customer records from Excel into QuickBooks.",
      category: "Tutorials",
      author: "Aisha Patel",
      date: "April 28, 2025",
      image: "https://images.unsplash.com/photo-1484807352052-23338990c6c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: false
    },
    {
      id: 4,
      title: "TransyncPro Announces Integration with Shopify",
      summary: "We're excited to announce our newest integration that connects your Shopify store directly to QuickBooks.",
      category: "News",
      author: "David Wilson",
      date: "April 22, 2025",
      image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: false
    },
    {
      id: 5,
      title: "How Williams Manufacturing Cut Data Entry Time by 85%",
      summary: "Case study: See how a mid-sized manufacturing company transformed their accounting processes with TransyncPro.",
      category: "Case Studies",
      author: "Sarah Johnson",
      date: "April 15, 2025",
      image: "https://images.unsplash.com/photo-1664575599736-c5197c684128?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: false
    },
    {
      id: 6,
      title: "Common QuickBooks Import Errors and How to Fix Them",
      summary: "Troubleshooting guide for the most frequent errors encountered when importing data into QuickBooks.",
      category: "QuickBooks Tips",
      author: "Michael Chen",
      date: "April 8, 2025",
      image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: false
    },
    {
      id: 7,
      title: "Best Practices for QuickBooks Chart of Accounts",
      summary: "Expert advice on structuring your chart of accounts for better reporting and financial clarity.",
      category: "QuickBooks Tips",
      author: "Aisha Patel",
      date: "April 1, 2025",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: true
    },
    {
      id: 8,
      title: "QuickBooks Online vs Desktop: Which is Right for Your Business?",
      summary: "A comprehensive comparison to help you choose the best QuickBooks version for your specific needs.",
      category: "QuickBooks Tips",
      author: "David Wilson",
      date: "March 25, 2025",
      image: "https://images.unsplash.com/photo-1551135049-8a33b5883817?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: false
    }
  ];

  // Filter blog posts by search query and category
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Split posts into featured and regular
  const featuredPosts = filteredPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  return (
    <PageLayout>
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
              {categories.map(category => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => setActiveCategory(category)}
                  className={activeCategory === category ? "bg-transyncpro-button hover:bg-transyncpro-button/90" : ""}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold gradient-text mb-8">Featured Articles</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map(post => (
                <div key={post.id} className="flex flex-col bg-white rounded-xl shadow-md overflow-hidden card-hover h-full">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="h-60 w-full object-cover"
                  />
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-transyncpro-heading mb-3">{post.title}</h3>
                    <p className="text-gray-600 mb-4 flex-grow">{post.summary}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        By {post.author} • {post.date}
                      </div>
                      <Button variant="link" className="text-transyncpro-button p-0">
                        Read More
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Posts */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold gradient-text mb-8">Latest Articles</h2>
          
          {regularPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map(post => (
                <div key={post.id} className="flex flex-col bg-white rounded-xl shadow-sm overflow-hidden card-hover h-full">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="mb-3">
                      <span className="inline-block px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-transyncpro-heading mb-2">{post.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 flex-grow">{post.summary}</p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        {post.date}
                      </div>
                      <Button variant="link" className="text-transyncpro-button p-0 text-sm">
                        Read More
                      </Button>
                    </div>
                  </div>
                </div>
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
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Your email address" 
              className="flex-grow"
            />
            <Button className="bg-transyncpro-button hover:bg-transyncpro-button/90 text-white whitespace-nowrap">
              Subscribe
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default Blog;


import React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BlogPost from "@/components/Blog/BlogPost";
import type { BlogPost as BlogPostType } from "@/types/blog";

interface BlogPostsListProps {
  posts: BlogPostType[];
  loading: boolean;
  onClearFilters: () => void;
}

const BlogPostsList: React.FC<BlogPostsListProps> = ({ posts, loading, onClearFilters }) => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold gradient-text mb-8">Latest Articles</h2>
        
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <BlogPost key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No articles found matching your search criteria.</p>
            <Button 
              variant="outline" 
              onClick={onClearFilters}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogPostsList;

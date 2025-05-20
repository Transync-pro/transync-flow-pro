
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import BlogPost from "@/components/Blog/BlogPost";
import type { BlogPost as BlogPostType } from "@/types/blog";

interface BlogFeaturedPostsProps {
  featuredPosts: BlogPostType[];
  loading: boolean;
}

const BlogFeaturedPosts: React.FC<BlogFeaturedPostsProps> = ({ featuredPosts, loading }) => {
  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </section>
    );
  }
  
  if (featuredPosts.length === 0) {
    return null;
  }
  
  return (
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
  );
};

export default BlogFeaturedPosts;

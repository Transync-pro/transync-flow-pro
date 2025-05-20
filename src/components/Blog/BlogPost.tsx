
import { type BlogPost as BlogPostType } from "@/types/blog";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BlogPostProps {
  post: BlogPostType;
  featured?: boolean;
}

export default function BlogPost({ post, featured = false }: BlogPostProps) {
  const formattedDate = format(new Date(post.published_date), 'MMMM d, yyyy');
  
  return (
    <div className={`flex flex-col bg-white rounded-xl shadow-md overflow-hidden card-hover h-full ${featured ? '' : 'shadow-sm'}`}>
      <Link to={`/blog/${post.slug}`}>
        <img 
          src={post.featured_image} 
          alt={post.title} 
          className={`w-full object-cover ${featured ? 'h-60' : 'h-48'}`}
          loading="lazy"
        />
      </Link>
      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-4">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            {post.category}
          </span>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.tags.slice(0, 2).map(tag => (
                <Badge key={tag.id} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
              {post.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{post.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
        <h3 className={`${featured ? 'text-xl' : 'text-lg'} font-semibold text-transyncpro-heading mb-3`}>
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className={`text-gray-600 ${featured ? '' : 'text-sm'} mb-4 flex-grow`}>{post.summary}</p>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className={`${featured ? 'text-sm' : 'text-xs'} text-gray-500`}>
            By {post.author} • {formattedDate}
          </div>
          <Button variant="link" asChild className="text-transyncpro-button p-0">
            <Link to={`/blog/${post.slug}`}>Read More</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

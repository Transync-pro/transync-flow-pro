
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogSearchProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  categories: string[];
  loading: boolean;
}

const BlogSearch: React.FC<BlogSearchProps> = ({ 
  searchQuery, 
  onSearchChange, 
  activeCategory, 
  setActiveCategory, 
  categories, 
  loading 
}) => {
  return (
    <section className="py-8 bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex items-center justify-between">
          <div className="relative mb-4 md:mb-0 md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={onSearchChange}
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
  );
};

export default BlogSearch;


import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Upload } from "lucide-react";

interface BlogAdminHeaderProps {
  onCreatePost: () => void;
}

const BlogAdminHeader: React.FC<BlogAdminHeaderProps> = ({ onCreatePost }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">Blog Management</h1>
        <p className="text-gray-600">Create and manage your blog posts</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Link to="/admin/blog/import">
          <Button 
            variant="outline"
            className="flex items-center gap-2 w-full"
          >
            <Upload size={16} />
            Import from WordPress
          </Button>
        </Link>
        <Button onClick={onCreatePost} className="flex items-center gap-2">
          <Plus size={16} />
          Create New Post
        </Button>
      </div>
    </div>
  );
};

export default BlogAdminHeader;

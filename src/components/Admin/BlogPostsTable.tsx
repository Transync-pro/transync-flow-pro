
import React, { useState } from "react";
import { format } from "date-fns";
import { Edit, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import type { BlogPost } from "@/types/blog";

interface BlogPostsTableProps {
  posts: any[];
  loading: boolean;
  onEditPost: (post: BlogPost) => void;
  onDeletePost: (id: string) => void;
  selectedIds: string[];
  onSelectPost: (id: string) => void;
  selectAll: boolean;
  onSelectAll: () => void;
}

const BlogPostsTable: React.FC<BlogPostsTableProps> = ({ 
  posts, 
  loading, 
  onEditPost, 
  onDeletePost, 
  selectedIds, 
  onSelectPost, 
  selectAll, 
  onSelectAll 
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDeletePost = (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    
    onDeletePost(id);
    setConfirmDelete(null);
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="search"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all posts"
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">No blog posts found</TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(post.id)}
                      onCheckedChange={() => onSelectPost(post.id)}
                      aria-label={`Select post ${post.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell>{post.category}</TableCell>
                  <TableCell>{format(new Date(post.published_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      post.status === 'published' ? 'bg-green-100 text-green-800' : 
                      post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>{post.is_featured ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => onEditPost(post)}>
                      <Edit size={16} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant={confirmDelete === post.id ? "destructive" : "ghost"} 
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BlogPostsTable;

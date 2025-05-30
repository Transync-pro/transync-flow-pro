
import React from "react";
import PageLayout from "@/components/PageLayout";
import BlogImport from "@/components/Admin/BlogImport";

const BlogImportPage = () => {
  return (
    <PageLayout>
      <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">WordPress XML Import</h1>
        <p className="text-gray-600 mb-8">
          Import your blog posts from a WordPress XML export file. Images will be automatically downloaded 
          and stored in our system, and all content will be properly formatted.
        </p>
        <BlogImport />
      </div>
    </PageLayout>
  );
};

export default BlogImportPage;

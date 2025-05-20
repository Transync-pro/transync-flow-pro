
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Upload, UploadCloud, CheckCircle, XCircle, FileUp, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { importWordPressXml, getAllImportJobs, getImportJobById } from "@/services/blog/import";

interface ImportJobDisplay {
  id: string;
  status: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    total: number;
    imported: number;
    failed: number;
  };
}

const BlogImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importJobs, setImportJobs] = useState<ImportJobDisplay[]>([]);
  const [activeTab, setActiveTab] = useState("upload");
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const { user } = useAuth();

  // Fetch import jobs on mount
  useEffect(() => {
    fetchImportJobs();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  // Start auto-refresh when there's an active import
  useEffect(() => {
    const hasActiveImport = importJobs.some(job => job.status === 'processing');
    
    if (hasActiveImport && !refreshInterval) {
      const interval = setInterval(() => {
        fetchImportJobs();
      }, 5000) as unknown as number;
      setRefreshInterval(interval);
    } else if (!hasActiveImport && refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [importJobs]);

  const fetchImportJobs = async () => {
    const jobs = await getAllImportJobs();
    setImportJobs(jobs.map(job => ({
      id: job.id,
      status: job.status,
      filePath: job.filePath,
      createdAt: new Date(job.createdAt).toLocaleString(),
      updatedAt: new Date(job.updatedAt).toLocaleString(),
      stats: job.stats
    })));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.xml')) {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid WordPress XML file",
        variant: "destructive"
      });
      setFile(null);
      e.target.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);

    try {
      // Upload file to Supabase storage
      const filePath = `imports/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase
        .storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Start import process
      setUploading(false);
      setImporting(true);
      
      // Read file content
      const fileContent = await file.text();
      
      // Start import process
      const importResult = await importWordPressXml(
        fileContent, 
        user.id, 
        filePath,
        (current, total) => {
          const progressPercentage = Math.round((current / total) * 100);
          setProgress(progressPercentage);
        }
      );
      
      if (!importResult.success) {
        throw new Error(importResult.message);
      }
      
      toast({
        title: "Import Started",
        description: "Your WordPress import has started and will continue in the background",
      });
      
      // Reset state
      setFile(null);
      setImporting(false);
      setProgress(0);
      
      // Refresh jobs list and switch to history tab
      fetchImportJobs();
      setActiveTab("history");
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred during the upload",
        variant: "destructive"
      });
      setUploading(false);
      setImporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
      case 'processing':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Processing</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Completed</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Failed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"><AlertCircle className="w-3 h-3 mr-1" /> Unknown</span>;
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">WordPress Import</CardTitle>
        <CardDescription>Import blog posts from a WordPress XML export file</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="wordpress-xml" className="block mb-2">WordPress XML File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  {file ? (
                    <div className="space-y-2">
                      <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-600">{file.name} ({Math.round(file.size / 1024)} KB)</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setFile(null)}
                        className="text-sm"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex flex-col items-center text-sm text-gray-600">
                        <Label htmlFor="wordpress-xml" className="cursor-pointer text-blue-600 hover:text-blue-500">
                          Click to upload
                        </Label>
                        <p>or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        WordPress XML export file only
                      </p>
                      <input
                        id="wordpress-xml"
                        name="wordpress-xml"
                        type="file"
                        accept=".xml"
                        className="sr-only"
                        onChange={handleFileChange}
                        disabled={uploading || importing}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Importing posts...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            {importJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No import jobs found
              </div>
            ) : (
              <div className="space-y-4">
                {importJobs.map((job) => (
                  <Card key={job.id}>
                    <CardHeader className="py-3">
                      <div className="flex justify-between">
                        <CardTitle className="text-sm font-medium">
                          {job.filePath.split('/').pop()}
                        </CardTitle>
                        {getStatusBadge(job.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="py-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-gray-500">Created:</p>
                          <p>{job.createdAt}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Updated:</p>
                          <p>{job.updatedAt}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-gray-500">Progress:</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={(job.stats.imported / (job.stats.total || 1)) * 100} className="h-2" />
                          <span className="text-xs whitespace-nowrap">
                            {job.stats.imported}/{job.stats.total} posts
                          </span>
                        </div>
                      </div>
                      {job.stats.failed > 0 && (
                        <p className="text-red-500 mt-2 text-xs">
                          Failed to import {job.stats.failed} posts
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchImportJobs()}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-gray-500">
          Imports blog posts and images from WordPress XML export files
        </p>
        {activeTab === "upload" && (
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading || importing}
          >
            {uploading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : importing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Import
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default BlogImport;

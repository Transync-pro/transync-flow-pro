
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { insertSampleBlogPosts } from "@/services/blog/sampleData";
import { AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SampleDataGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const handleGenerateSampleData = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      
      const response = await insertSampleBlogPosts();
      
      setResult(response);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Sample blog posts have been added successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add sample blog posts.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating sample data:", error);
      setResult({
        success: false,
        message: error.message || "An unexpected error occurred",
      });
      toast({
        title: "Error",
        description: "Failed to generate sample data. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-md p-4 bg-gray-50">
      <h3 className="text-lg font-medium">Sample Data Generator</h3>
      <p className="text-gray-600">
        Populate your blog with sample posts about QuickBooks and accounting topics.
      </p>
      
      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        onClick={handleGenerateSampleData} 
        disabled={isLoading}
      >
        {isLoading ? "Adding Sample Posts..." : "Generate Sample Posts"}
      </Button>
    </div>
  );
}


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";

const Import = () => {
  const navigate = useNavigate();
  
  return (
    <PageLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-semibold">Import Data</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Import QuickBooks Data</CardTitle>
              <CardDescription>
                This feature allows you to import data into QuickBooks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <img src="/placeholder.svg" alt="Import" className="w-24 h-24 mb-4" />
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-gray-500 max-w-md">
                  We're working on implementing data import capabilities. This feature 
                  will allow you to upload spreadsheets and CSVs to create or update 
                  records in your QuickBooks account.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
              <p className="text-sm text-gray-500">
                Check back soon for updates on this feature!
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Import;

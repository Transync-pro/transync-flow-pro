
import { useState } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import EntitySelection, { Entity } from "@/components/EntitySelection/EntitySelection";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon, ChevronsUpDown, FileUp, Play, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Types for the import workflow
type ImportStep = "select" | "configure" | "map" | "review" | "import";
type FieldMapping = {
  sourceField: string;
  targetField: string;
  isMatched: boolean;
  isRequired: boolean;
};
type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

const Import = () => {
  const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);
  const [step, setStep] = useState<ImportStep>("select");
  const [file, setFile] = useState<File | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [headerRow, setHeaderRow] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [importResults, setImportResults] = useState({ total: 0, success: 0, error: 0 });

  // Handle entity selection
  const handleEntitySelection = (entities: Entity[]) => {
    setSelectedEntities(entities);
    toast({
      title: "Entities Selected",
      description: `You've selected ${entities.length} entities for import.`,
    });
    setStep("configure");
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Simulate parsing CSV/Excel headers
      // In a real implementation, we would parse the actual file
      const mockHeaders = ["Name", "Email", "Phone", "Address", "City", "State", "Zip", "Country"];
      setHeaderRow(mockHeaders);
      
      // Generate mock field mappings
      const mockTargetFields = ["Name", "Email", "PhoneNumber", "StreetAddress", "City", "State", "PostalCode", "Country"];
      const mockMappings: FieldMapping[] = mockHeaders.map((header, index) => ({
        sourceField: header,
        targetField: mockTargetFields[index] || "",
        isMatched: header.toLowerCase() === mockTargetFields[index]?.toLowerCase(),
        isRequired: index < 3, // First three fields are required in this example
      }));
      setFieldMappings(mockMappings);

      // Mock preview data
      setPreviewData([
        { Name: "John Doe", Email: "john@example.com", Phone: "555-1234" },
        { Name: "Jane Smith", Email: "jane@example.com", Phone: "555-5678" },
        { Name: "Bob Johnson", Email: "bob@example.com", Phone: "555-9012" },
      ]);

      toast({
        title: "File Uploaded",
        description: `File "${selectedFile.name}" has been uploaded.`,
      });
    }
  };

  // Update field mapping
  const handleFieldMappingChange = (index: number, targetField: string) => {
    const updatedMappings = [...fieldMappings];
    updatedMappings[index] = {
      ...updatedMappings[index],
      targetField,
      isMatched: true,
    };
    setFieldMappings(updatedMappings);
  };

  // Continue to mapping step
  const handleContinueToMapping = () => {
    if (!file) {
      toast({
        title: "File Required",
        description: "Please upload a file to continue.",
        variant: "destructive",
      });
      return;
    }
    setStep("map");
  };

  // Continue to review step
  const handleContinueToReview = () => {
    const unmappedRequired = fieldMappings.filter(mapping => mapping.isRequired && !mapping.isMatched);
    if (unmappedRequired.length > 0) {
      toast({
        title: "Required Fields Not Mapped",
        description: `${unmappedRequired.length} required fields are not properly mapped.`,
        variant: "destructive",
      });
      return;
    }
    setStep("review");
  };

  // Start import process
  const handleStartImport = () => {
    setStep("import");
    
    // Simulate import process
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setImportProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        // Simulate results
        const mockResults = {
          total: 100,
          success: 93,
          error: 7
        };
        setImportResults(mockResults);
        setShowResultDialog(true);
      }
    }, 500);
  };

  // Handle import completion
  const handleImportComplete = () => {
    setShowResultDialog(false);
    setStep("select");
    setSelectedEntities([]);
    setFile(null);
    setHeaderRow([]);
    setFieldMappings([]);
    setPreviewData([]);
    setImportProgress(0);
    toast({
      title: "Import Completed",
      description: `Successfully imported ${importResults.success} of ${importResults.total} records.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Progress steps indicator */}
        {step !== "select" && (
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className={cn("text-sm font-medium", step === "configure" ? "text-primary" : "text-gray-500")}>Configure</span>
              <span className={cn("text-sm font-medium", step === "map" ? "text-primary" : "text-gray-500")}>Map Fields</span>
              <span className={cn("text-sm font-medium", step === "review" ? "text-primary" : "text-gray-500")}>Review</span>
              <span className={cn("text-sm font-medium", step === "import" ? "text-primary" : "text-gray-500")}>Import</span>
            </div>
            <Progress value={
              step === "configure" ? 25 :
              step === "map" ? 50 :
              step === "review" ? 75 :
              step === "import" ? 90 : 0
            } className="h-2" />
          </div>
        )}

        {step === "select" && (
          <EntitySelection
            title="Import Data"
            description="Select which QuickBooks entities you want to import data for."
            actionText="Continue to Import"
            onContinue={handleEntitySelection}
            actionColor="bg-blue-500 hover:bg-blue-600"
          />
        )}

        {step === "configure" && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Configure Import</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Selected Entities</h3>
              <div className="flex flex-wrap gap-2">
                {selectedEntities.map((entity) => (
                  <span
                    key={entity.id}
                    className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {entity.icon} {entity.name}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <Label htmlFor="file-upload" className="block text-sm font-medium mb-2">
                Upload File (CSV or Excel)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: CSV, Excel (.xlsx, .xls)
              </p>
            </div>
            
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-2">
                Date Range (Optional)
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        format(dateRange.from, "PPP")
                      ) : (
                        <span>Start Date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? (
                        format(dateRange.to, "PPP")
                      ) : (
                        <span>End Date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep("select")}
              >
                Back
              </Button>
              <Button 
                onClick={handleContinueToMapping}
                disabled={!file}
              >
                Continue to Field Mapping
              </Button>
            </div>
          </div>
        )}

        {step === "map" && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Map Fields</h2>
            <p className="mb-4 text-gray-600">
              Map your uploaded file columns to QuickBooks fields. Required fields are marked with an asterisk (*).
            </p>
            
            <div className="overflow-x-auto mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Your File Column</TableHead>
                    <TableHead className="w-1/3">QuickBooks Field</TableHead>
                    <TableHead className="w-1/3">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fieldMappings.map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell>{mapping.sourceField}</TableCell>
                      <TableCell>
                        <div className="relative">
                          <select 
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={mapping.targetField}
                            onChange={(e) => handleFieldMappingChange(index, e.target.value)}
                          >
                            <option value="">-- Select Field --</option>
                            <option value="Name">Name</option>
                            <option value="Email">Email</option>
                            <option value="PhoneNumber">Phone Number</option>
                            <option value="StreetAddress">Street Address</option>
                            <option value="City">City</option>
                            <option value="State">State</option>
                            <option value="PostalCode">Postal Code</option>
                            <option value="Country">Country</option>
                          </select>
                          <ChevronsUpDown className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {mapping.isRequired && !mapping.isMatched ? (
                          <span className="text-red-500 text-sm">Required field *</span>
                        ) : mapping.isMatched ? (
                          <span className="text-green-500 text-sm">Matched</span>
                        ) : (
                          <span className="text-gray-500 text-sm">Optional</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep("configure")}
              >
                Back
              </Button>
              <Button 
                onClick={handleContinueToReview}
              >
                Continue to Review
              </Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Review Import Data</h2>
            <p className="mb-4 text-gray-600">
              Review your data before starting the import. This preview shows the first few records.
            </p>
            
            <div className="overflow-x-auto mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(previewData[0] || {}).map((key) => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Object.values(row).map((value, valueIndex) => (
                        <TableCell key={valueIndex}>{value as string}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold text-blue-800">Import Summary</h3>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Entities: {selectedEntities.map(e => e.name).join(", ")}</li>
                <li>File: {file?.name}</li>
                <li>Total Records: {previewData.length} records to import</li>
                <li>Date Range: {dateRange.from ? format(dateRange.from, "PPP") : "All"} to {dateRange.to ? format(dateRange.to, "PPP") : "All"}</li>
              </ul>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep("map")}
              >
                Back
              </Button>
              <Button 
                onClick={handleStartImport}
              >
                Start Import
              </Button>
            </div>
          </div>
        )}

        {step === "import" && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Importing Data</h2>
            <p className="mb-6 text-gray-600">
              Please wait while your data is being imported. This process may take several minutes depending on the amount of data.
            </p>
            
            <div className="mb-6">
              <Progress value={importProgress} className="h-2" />
              <p className="mt-2 text-center text-sm text-gray-500">
                {importProgress}% Complete
              </p>
            </div>
            
            <div className="flex justify-center">
              <div className="animate-pulse flex items-center">
                <FileUp className="h-5 w-5 mr-2 text-blue-500" />
                <span className="text-blue-500">Processing records...</span>
              </div>
            </div>
          </div>
        )}

        {/* Results Dialog */}
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Completed</DialogTitle>
              <DialogDescription>
                Your import has been processed with the following results:
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md mb-2">
                <span className="font-medium">Total Records:</span>
                <span>{importResults.total}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-md mb-2">
                <span className="font-medium text-green-700">Successfully Imported:</span>
                <span className="text-green-700">{importResults.success}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-md">
                <span className="font-medium text-red-700">Failed:</span>
                <span className="text-red-700">{importResults.error}</span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleImportComplete}>
                Return to Dashboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Import;

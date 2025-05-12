
import { useState } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import EntitySelection, { Entity } from "@/components/EntitySelection/EntitySelection";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Calendar as CalendarIcon, Check, Download, FileDown } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ExportFormat = "csv" | "xlsx";
type ExportStep = "select" | "configure" | "format" | "export";
type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};
type Field = {
  id: string;
  name: string;
  selected: boolean;
  required: boolean;
};

const Export = () => {
  const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);
  const [step, setStep] = useState<ExportStep>("select");
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleEntitySelection = (entities: Entity[]) => {
    setSelectedEntities(entities);
    toast({
      title: "Entities Selected",
      description: `You've selected ${entities.length} entities for export.`,
    });
    
    // Generate mock fields based on selected entities
    const mockFields: Field[] = [];
    
    // Add common fields
    mockFields.push(
      { id: "id", name: "ID", selected: true, required: true },
      { id: "created_at", name: "Created Date", selected: true, required: true },
      { id: "modified_at", name: "Last Modified Date", selected: true, required: false }
    );
    
    // Add entity-specific fields
    entities.forEach(entity => {
      if (entity.name === "Customers") {
        mockFields.push(
          { id: "name", name: "Name", selected: true, required: true },
          { id: "company", name: "Company", selected: true, required: false },
          { id: "email", name: "Email", selected: true, required: false },
          { id: "phone", name: "Phone", selected: true, required: false },
          { id: "address", name: "Address", selected: false, required: false },
          { id: "balance", name: "Balance", selected: true, required: false }
        );
      } else if (entity.name === "Invoices") {
        mockFields.push(
          { id: "invoice_number", name: "Invoice Number", selected: true, required: true },
          { id: "customer_id", name: "Customer ID", selected: true, required: true },
          { id: "amount", name: "Amount", selected: true, required: true },
          { id: "due_date", name: "Due Date", selected: true, required: true },
          { id: "status", name: "Status", selected: true, required: false },
          { id: "items", name: "Line Items", selected: false, required: false }
        );
      } else if (entity.name === "Products & Services") {
        mockFields.push(
          { id: "name", name: "Name", selected: true, required: true },
          { id: "sku", name: "SKU", selected: true, required: false },
          { id: "description", name: "Description", selected: false, required: false },
          { id: "price", name: "Price", selected: true, required: true },
          { id: "cost", name: "Cost", selected: true, required: false },
          { id: "quantity", name: "Quantity on Hand", selected: true, required: false }
        );
      }
    });
    
    setAvailableFields(mockFields);
    setStep("configure");
  };

  const toggleFieldSelection = (fieldId: string) => {
    setAvailableFields(prevFields => 
      prevFields.map(field => 
        field.id === fieldId && !field.required 
          ? { ...field, selected: !field.selected } 
          : field
      )
    );
  };

  const handleContinueToFormat = () => {
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Date Range Required",
        description: "Please select a date range for the export.",
        variant: "destructive",
      });
      return;
    }
    setStep("format");
  };

  const handleStartExport = () => {
    setStep("export");
    
    // Simulate export process
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setExportProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setDownloadReady(true);
        setDownloadUrl("#"); // In a real app, this would be a URL to the exported file
        setShowDownloadDialog(true);
      }
    }, 300);
  };

  const handleDownload = () => {
    // In a real app, this would trigger the actual file download
    toast({
      title: "Export Downloaded",
      description: `Your ${exportFormat.toUpperCase()} file has been downloaded.`,
    });
    
    setShowDownloadDialog(false);
    setStep("select");
    setSelectedEntities([]);
    setDateRange({ from: undefined, to: undefined });
    setAvailableFields([]);
    setExportProgress(0);
    setDownloadReady(false);
    setDownloadUrl("");
  };

  const getStatusFilterOptions = () => {
    // Return status filter options based on the selected entity
    if (selectedEntities.some(e => e.name === "Invoices")) {
      return [
        { value: "all", label: "All Statuses" },
        { value: "paid", label: "Paid" },
        { value: "unpaid", label: "Unpaid" },
        { value: "overdue", label: "Overdue" }
      ];
    } else if (selectedEntities.some(e => e.name === "Bills")) {
      return [
        { value: "all", label: "All Statuses" },
        { value: "paid", label: "Paid" },
        { value: "unpaid", label: "Unpaid" },
        { value: "overdue", label: "Overdue" }
      ];
    }
    
    // Default options for other entities
    return [
      { value: "all", label: "All Statuses" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" }
    ];
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Progress steps indicator */}
        {step !== "select" && (
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className={cn("text-sm font-medium", step === "configure" ? "text-primary" : "text-gray-500")}>Configure</span>
              <span className={cn("text-sm font-medium", step === "format" ? "text-primary" : "text-gray-500")}>Format</span>
              <span className={cn("text-sm font-medium", step === "export" ? "text-primary" : "text-gray-500")}>Export</span>
            </div>
            <Progress value={
              step === "configure" ? 33 :
              step === "format" ? 66 :
              step === "export" ? 100 : 0
            } className="h-2" />
          </div>
        )}

        {step === "select" && (
          <EntitySelection
            title="Export Data"
            description="Select which QuickBooks entities you want to export data for."
            actionText="Continue to Export"
            onContinue={handleEntitySelection}
            actionColor="bg-purple-500 hover:bg-purple-600"
          />
        )}

        {step === "configure" && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Configure Export</h2>
            
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
              <Label className="block text-sm font-medium mb-2">
                Date Range
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
            
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-2">
                Field Selection
              </Label>
              <div className="bg-gray-50 p-4 rounded-md space-y-3 max-h-64 overflow-y-auto">
                {availableFields.map((field) => (
                  <div key={field.id} className="flex items-start space-x-2">
                    <Checkbox 
                      id={field.id} 
                      checked={field.selected}
                      onCheckedChange={() => toggleFieldSelection(field.id)}
                      disabled={field.required} 
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label 
                        htmlFor={field.id} 
                        className={cn(
                          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                          field.required && "after:content-['*'] after:ml-0.5 after:text-red-500"
                        )}
                      >
                        {field.name}
                      </Label>
                      {field.required && (
                        <p className="text-xs text-muted-foreground">Required field</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <Label htmlFor="status-filter" className="block text-sm font-medium mb-2">
                Status Filter (Optional)
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full" id="status-filter">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {getStatusFilterOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep("select")}
              >
                Back
              </Button>
              <Button 
                onClick={handleContinueToFormat}
              >
                Continue to Format
              </Button>
            </div>
          </div>
        )}

        {step === "format" && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Export Format</h2>
            <p className="mb-4 text-gray-600">
              Choose your preferred export format and finalize your export settings.
            </p>
            
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-2">
                Export Format
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-all",
                    exportFormat === "csv" 
                      ? "border-purple-500 bg-purple-50" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => setExportFormat("csv")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <FileDown className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">CSV</h3>
                        <p className="text-xs text-gray-500">Comma-separated values</p>
                      </div>
                    </div>
                    {exportFormat === "csv" && (
                      <Check className="h-5 w-5 text-purple-500" />
                    )}
                  </div>
                </div>
                
                <div 
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-all",
                    exportFormat === "xlsx" 
                      ? "border-purple-500 bg-purple-50" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => setExportFormat("xlsx")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-green-100 p-2 rounded-full">
                        <FileDown className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Excel</h3>
                        <p className="text-xs text-gray-500">XLSX spreadsheet format</p>
                      </div>
                    </div>
                    {exportFormat === "xlsx" && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-md">
              <h3 className="font-semibold text-purple-800">Export Summary</h3>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Entities: {selectedEntities.map(e => e.name).join(", ")}</li>
                <li>Date Range: {dateRange.from ? format(dateRange.from, "PPP") : ""} to {dateRange.to ? format(dateRange.to, "PPP") : ""}</li>
                <li>Fields: {availableFields.filter(f => f.selected).length} of {availableFields.length}</li>
                <li>Status Filter: {getStatusFilterOptions().find(o => o.value === statusFilter)?.label || "All"}</li>
                <li>Format: {exportFormat.toUpperCase()}</li>
              </ul>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep("configure")}
              >
                Back
              </Button>
              <Button 
                onClick={handleStartExport}
              >
                Start Export
              </Button>
            </div>
          </div>
        )}

        {step === "export" && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Exporting Data</h2>
            <p className="mb-6 text-gray-600">
              Please wait while your data is being exported. This process may take several minutes depending on the amount of data.
            </p>
            
            <div className="mb-6">
              <Progress value={exportProgress} className="h-2" />
              <p className="mt-2 text-center text-sm text-gray-500">
                {exportProgress}% Complete
              </p>
            </div>
            
            {!downloadReady ? (
              <div className="flex justify-center">
                <div className="animate-pulse flex items-center">
                  <FileDown className="h-5 w-5 mr-2 text-purple-500" />
                  <span className="text-purple-500">Preparing export...</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <Button onClick={() => setShowDownloadDialog(true)}>
                  <Download className="h-5 w-5 mr-2" />
                  Download {exportFormat.toUpperCase()}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Download Dialog */}
        <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Complete</DialogTitle>
              <DialogDescription>
                Your export has been successfully processed and is ready for download.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-6 bg-purple-50 rounded-md text-center">
                <FileDown className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-1">
                  {selectedEntities.map(e => e.name).join("-")}-export.{exportFormat}
                </h3>
                <p className="text-sm text-gray-600">
                  {exportFormat === "csv" ? "CSV File" : "Excel Spreadsheet"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDownloadDialog(false)}>
                Close
              </Button>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Export;

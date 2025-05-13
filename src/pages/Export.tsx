import { useState, useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import EntitySelection, { Entity } from "@/components/EntitySelection/EntitySelection";
import { toast } from "@/hooks/use-toast";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { queryQuickbooksData, convertToCSV, logOperation, flattenQuickbooksData } from "@/services/quickbooksApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Calendar as CalendarIcon, Check, Download, FileDown, AlertTriangle } from "lucide-react";
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

// Map UI entity names to QuickBooks API entity names
const entityMappings: Record<string, string> = {
  "Customers": "Customer",
  "Invoices": "Invoice",
  "Products & Services": "Item",
  "Bills": "Bill",
  "Payments": "Payment",
  "Vendors": "Vendor",
  "Employees": "Employee",
  "Accounts": "Account"
};

const Export = () => {
  const { getAccessToken, getRealmId, isConnected } = useQuickbooks();
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
  const [exportData, setExportData] = useState<any[]>([]);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEntitySelection = (entities: Entity[]) => {
    if (!isConnected) {
      toast({
        title: "QuickBooks Connection Required",
        description: "Please connect your QuickBooks account before exporting data.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedEntities(entities);
    toast({
      title: "Entities Selected",
      description: `You've selected ${entities.length} entities for export.`,
    });
    
    // Generate fields based on selected entities
    generateFieldsForEntities(entities);
    setStep("configure");
  };

  const generateFieldsForEntities = (entities: Entity[]) => {
    const fields: Field[] = [];
    
    // Add common fields
    fields.push(
      { id: "Id", name: "ID", selected: true, required: true },
      { id: "MetaData.CreateTime", name: "Created Date", selected: true, required: true },
      { id: "MetaData.LastUpdatedTime", name: "Last Modified Date", selected: true, required: false }
    );
    
    // Add entity-specific fields
    entities.forEach(entity => {
      const qbEntity = entityMappings[entity.name];
      
      if (qbEntity === "Customer") {
        fields.push(
          { id: "DisplayName", name: "Name", selected: true, required: true },
          { id: "CompanyName", name: "Company", selected: true, required: false },
          { id: "PrimaryEmailAddr.Address", name: "Email", selected: true, required: false },
          { id: "PrimaryPhone.FreeFormNumber", name: "Phone", selected: true, required: false },
          { id: "BillAddr.Line1", name: "Address", selected: false, required: false },
          { id: "Balance", name: "Balance", selected: true, required: false },
          { id: "Active", name: "Active", selected: true, required: false }
        );
      } else if (qbEntity === "Invoice") {
        fields.push(
          { id: "DocNumber", name: "Invoice Number", selected: true, required: true },
          { id: "CustomerRef.name", name: "Customer Name", selected: true, required: true },
          { id: "TotalAmt", name: "Amount", selected: true, required: true },
          { id: "DueDate", name: "Due Date", selected: true, required: true },
          { id: "Balance", name: "Balance", selected: true, required: false },
          { id: "PrivateNote", name: "Notes", selected: false, required: false }
        );
      } else if (qbEntity === "Item") {
        fields.push(
          { id: "Name", name: "Name", selected: true, required: true },
          { id: "Description", name: "Description", selected: false, required: false },
          { id: "UnitPrice", name: "Price", selected: true, required: true },
          { id: "PurchaseCost", name: "Cost", selected: true, required: false },
          { id: "QtyOnHand", name: "Quantity on Hand", selected: true, required: false },
          { id: "Type", name: "Type", selected: true, required: true },
          { id: "Active", name: "Active", selected: true, required: false }
        );
      }
    });
    
    setAvailableFields(fields);
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

  const handleContinueToFormat = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Date Range Required",
        description: "Please select a date range for the export.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      setExportError(null);
      
      // Get selected fields
      const selectedFieldIds = availableFields
        .filter(field => field.selected)
        .map(field => field.id);
      
      // Get QuickBooks data
      const accessToken = await getAccessToken();
      const realmId = await getRealmId();
      
      if (!accessToken || !realmId) {
        throw new Error("Failed to get QuickBooks authentication credentials");
      }
      
      // Build date condition for query
      const dateCondition = `MetaData.LastUpdatedTime >= '${format(dateRange.from, "yyyy-MM-dd")}' AND MetaData.LastUpdatedTime <= '${format(dateRange.to, "yyyy-MM-dd")}'`;
      
      // Add status filter if applicable
      let statusCondition = "";
      if (statusFilter !== "all") {
        if (selectedEntities.some(e => e.name === "Invoices")) {
          statusCondition = ` AND status = '${statusFilter}'`;
        } else if (selectedEntities.some(e => e.name === "Customers" || e.name === "Products & Services")) {
          statusCondition = statusFilter === "active" ? " AND Active = true" : " AND Active = false";
        }
      }
      
      // Combine conditions
      const conditions = dateCondition + statusCondition;
      
      // Fetch data for each entity
      const allData: any[] = [];
      
      for (const entity of selectedEntities) {
        const qbEntity = entityMappings[entity.name];
        const response = await queryQuickbooksData(
          accessToken,
          realmId,
          qbEntity,
          ["*"], // QuickBooks API ignores field selection in most cases, so we get all fields
          conditions,
          1000
        );
        
        // Extract the data array
        if (response.QueryResponse && response.QueryResponse[qbEntity]) {
          const entityData = response.QueryResponse[qbEntity];
          allData.push(...entityData);
        }
      }
      
      // Log the operation
      await logOperation(
        'export',
        selectedEntities.map(e => e.name).join(','),
        null,
        'success',
        { count: allData.length, dateRange, fields: selectedFieldIds }
      );
      
      // Store the data for later use
      setExportData(allData);
      
      // Move to next step
      setStep("format");
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setExportError(error.message);
      toast({
        title: "Export Error",
        description: error.message || "Failed to fetch data from QuickBooks",
        variant: "destructive",
      });
      
      // Log the error
      await logOperation(
        'export',
        selectedEntities.map(e => e.name).join(','),
        null,
        'error',
        { error: error.message, dateRange }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartExport = () => {
    setStep("export");
    
    // Generate the export file
    try {
      // Get selected fields for CSV columns
      const selectedFieldIds = availableFields
        .filter(field => field.selected)
        .map(field => field.id);
      
      // For CSV export
      if (exportFormat === "csv") {
        const csv = convertToCSV(exportData, selectedFieldIds);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
      } 
      // For Excel export, we'd need a library like xlsx
      else if (exportFormat === "xlsx") {
        // In a real implementation, use a library like xlsx
        // For now, we'll just use CSV as a fallback
        const csv = convertToCSV(exportData, selectedFieldIds);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
      }
      
      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setExportProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          setDownloadReady(true);
          setShowDownloadDialog(true);
        }
      }, 300);
    } catch (error: any) {
      console.error("Error creating export file:", error);
      toast({
        title: "Export Error",
        description: error.message || "Failed to create export file",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    // Trigger download
    if (downloadUrl) {
      const link = document.createElement('a');
      const fileName = `${selectedEntities.map(e => e.name).join('-')}-export.${exportFormat}`;
      
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Downloaded",
        description: `Your ${exportFormat.toUpperCase()} file has been downloaded.`,
      });
    }
    
    // Clean up
    setShowDownloadDialog(false);
    setStep("select");
    setSelectedEntities([]);
    setDateRange({ from: undefined, to: undefined });
    setAvailableFields([]);
    setExportProgress(0);
    setDownloadReady(false);
    setDownloadUrl("");
    setExportData([]);
  };

  const getStatusFilterOptions = () => {
    if (selectedEntities.some(e => e.name === "Invoices")) {
      return [
        { value: "all", label: "All Statuses" },
        { value: "Paid", label: "Paid" },
        { value: "Pending", label: "Pending" },
        { value: "Overdue", label: "Overdue" }
      ];
    } else if (selectedEntities.some(e => e.name === "Bills")) {
      return [
        { value: "all", label: "All Statuses" },
        { value: "Paid", label: "Paid" },
        { value: "Pending", label: "Pending" },
        { value: "Overdue", label: "Overdue" }
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
            
            {exportError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{exportError}</p>
                </div>
              </div>
            )}
            
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                    Fetching Data...
                  </>
                ) : "Continue to Format"}
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
                <li>Records: {exportData.length}</li>
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

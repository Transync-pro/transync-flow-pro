
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import EntitySelection, { Entity } from "@/components/EntitySelection/EntitySelection";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertTriangle, Calendar as CalendarIcon, Trash, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { 
  queryQuickbooksData, 
  deleteQuickbooksEntity, 
  logOperation 
} from "@/services/quickbooksApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Types for the delete workflow
type DeleteStep = "select" | "configure" | "confirm" | "delete";
type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};
type RecordData = {
  id: string;
  name: string;
  date: string;
  amount?: string;
  status?: string;
  [key: string]: any;  // Allow any other properties
};

const Delete = () => {
  const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);
  const [step, setStep] = useState<DeleteStep>("select");
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [recordCount, setRecordCount] = useState<number>(0);
  const [previewRecords, setPreviewRecords] = useState<RecordData[]>([]);
  const [recordsToDelete, setRecordsToDelete] = useState<RecordData[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [deleteProgress, setDeleteProgress] = useState<number>(0);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [deleteResults, setDeleteResults] = useState({ total: 0, success: 0, error: 0, skipped: 0 });
  const [confirmationText, setConfirmationText] = useState<string>("");
  
  // Get QuickBooks connection from context
  const { getAccessToken, getRealmId, isConnected } = useQuickbooks();
  
  const recordsPerPage = 5;

  const handleEntitySelection = (entities: Entity[]) => {
    if (!isConnected) {
      toast({
        title: "QuickBooks Connection Required",
        description: "Please connect to QuickBooks before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedEntities(entities);
    setShowWarningDialog(true);
  };

  const handleConfirmSelection = () => {
    setShowWarningDialog(false);
    toast({
      title: "Entities Selected",
      description: `You've selected ${selectedEntities.length} entities for deletion.`,
    });
    setStep("configure");
  };

  // Function to fetch records from QuickBooks based on date range
  const fetchRecordsInDateRange = async () => {
    try {
      const accessToken = await getAccessToken();
      const realmId = getRealmId();
      
      if (!accessToken || !realmId) {
        throw new Error("QuickBooks authentication failed");
      }
      
      if (!selectedEntities[0]) {
        throw new Error("No entity selected");
      }
      
      const entityName = selectedEntities[0].name.replace(/\s+&\s+/g, '');
      
      // Prepare date condition for the query
      let dateCondition = "";
      if (dateRange.from || dateRange.to) {
        if (dateRange.from && dateRange.to) {
          dateCondition = `MetaData.CreateTime >= '${format(dateRange.from, "yyyy-MM-dd")}' AND MetaData.CreateTime <= '${format(dateRange.to, "yyyy-MM-dd")}'`;
        } else if (dateRange.from) {
          dateCondition = `MetaData.CreateTime >= '${format(dateRange.from, "yyyy-MM-dd")}'`;
        } else if (dateRange.to) {
          dateCondition = `MetaData.CreateTime <= '${format(dateRange.to, "yyyy-MM-dd")}'`;
        }
      }
      
      // Query QuickBooks API
      const response = await queryQuickbooksData(
        accessToken,
        realmId,
        entityName,
        ['*'],
        dateCondition
      );
      
      // Transform response into our RecordData format
      let records: RecordData[] = [];
      const responseKey = `${entityName}`;
      
      if (response && response.QueryResponse && response.QueryResponse[responseKey]) {
        records = response.QueryResponse[responseKey].map((item: any) => {
          const record: RecordData = {
            id: item.Id,
            name: item.DisplayName || item.DocNumber || item.Name || `${entityName} #${item.Id}`,
            date: item.MetaData?.CreateTime ? format(new Date(item.MetaData.CreateTime), "PP") : 'Unknown',
          };
          
          // Add entity-specific fields
          if (entityName === "Invoice") {
            record.amount = item.TotalAmt ? `$${item.TotalAmt}` : undefined;
            record.status = item.Balance === 0 ? "Paid" : item.Balance === item.TotalAmt ? "Unpaid" : "Partial";
          } else if (entityName === "Item") {
            record.amount = item.UnitPrice ? `$${item.UnitPrice}` : undefined;
          }
          
          // Store the original item for later use
          record.original = item;
          
          return record;
        });
      }
      
      setRecordCount(records.length);
      setPreviewRecords(records);
      setRecordsToDelete(records);
      
      return records;
    } catch (error) {
      console.error("Error fetching QuickBooks records:", error);
      toast({
        title: "Error Fetching Records",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      return [];
    }
  };

  const handleDateRangeChange = async () => {
    const records = await fetchRecordsInDateRange();
    
    if (records.length === 0) {
      toast({
        title: "No Records Found",
        description: "No records match your criteria. Try adjusting your date range.",
        variant: "destructive",
      });
      return;
    }
    
    setStep("confirm");
  };

  const getPaginatedRecords = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return previewRecords.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(previewRecords.length / recordsPerPage);

  const handleStartDelete = async () => {
    // Check for confirmation text
    if (confirmationText !== "DELETE") {
      toast({
        title: "Confirmation Required",
        description: "Please type 'DELETE' to confirm this operation",
        variant: "destructive",
      });
      return;
    }
    
    setShowConfirmationDialog(false);
    setStep("delete");
    setDeleteProgress(0);
    
    try {
      const accessToken = await getAccessToken();
      const realmId = getRealmId();
      
      if (!accessToken || !realmId) {
        throw new Error("QuickBooks authentication failed");
      }
      
      const entityName = selectedEntities[0].name.replace(/\s+&\s+/g, '');
      const total = recordsToDelete.length;
      let success = 0;
      let error = 0;
      let skipped = 0;
      
      // Process records one by one
      for (let i = 0; i < total; i++) {
        try {
          const record = recordsToDelete[i];
          
          // Delete entity in QuickBooks
          await deleteQuickbooksEntity(
            accessToken,
            realmId,
            entityName,
            record.id
          );
          
          // Log successful operation
          await logOperation(
            'delete',
            entityName,
            record.id,
            'success',
            { record }
          );
          
          success++;
        } catch (err: any) {
          console.error("Error deleting record:", err);
          
          // Some entities can't be deleted if they're in use
          if (err.message && err.message.includes("in use")) {
            skipped++;
            
            // Log skipped operation
            await logOperation(
              'delete',
              entityName,
              recordsToDelete[i].id,
              'error',
              { record: recordsToDelete[i], error: err, reason: "Entity in use" }
            );
          } else {
            error++;
            
            // Log failed operation
            await logOperation(
              'delete',
              entityName,
              recordsToDelete[i].id,
              'error',
              { record: recordsToDelete[i], error: err }
            );
          }
        }
        
        // Update progress
        const progress = Math.round(((i + 1) / total) * 100);
        setDeleteProgress(progress);
      }
      
      // Show results
      setDeleteResults({ total, success, error, skipped });
      setShowResultDialog(true);
      
    } catch (error) {
      console.error("Delete process error:", error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Return to select step on critical error
      setStep("select");
    }
  };

  const handleDeleteComplete = () => {
    setShowResultDialog(false);
    setStep("select");
    setSelectedEntities([]);
    setDateRange({ from: undefined, to: undefined });
    setRecordCount(0);
    setPreviewRecords([]);
    setCurrentPage(1);
    setDeleteProgress(0);
    setConfirmationText("");
    toast({
      title: "Deletion Completed",
      description: `Successfully deleted ${deleteResults.success} of ${deleteResults.total} records.`,
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
              <span className={cn("text-sm font-medium", step === "confirm" ? "text-primary" : "text-gray-500")}>Preview</span>
              <span className={cn("text-sm font-medium", step === "delete" ? "text-primary" : "text-gray-500")}>Delete</span>
            </div>
            <Progress value={
              step === "configure" ? 33 :
              step === "confirm" ? 66 :
              step === "delete" ? 100 : 0
            } className="h-2" />
          </div>
        )}

        {step === "select" && (
          <EntitySelection
            title="Delete Data"
            description="Select which QuickBooks entities you want to delete data from."
            actionText="Continue to Delete"
            onContinue={handleEntitySelection}
            actionColor="bg-red-500 hover:bg-red-600"
          />
        )}

        {step === "configure" && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Configure Deletion</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Selected Entities</h3>
              <div className="flex flex-wrap gap-2">
                {selectedEntities.map((entity) => (
                  <span
                    key={entity.id}
                    className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-800 mr-2 mt-2"
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
            
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md mb-6">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-red-600 font-medium">
                    Warning: Deletion Operations Cannot Be Undone
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Please carefully configure your deletion criteria to avoid unintended data loss. This operation will permanently remove data from your QuickBooks account.
                  </p>
                </div>
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
                onClick={handleDateRangeChange}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Continue to Preview
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Preview Deletion</h2>
            <p className="mb-2 text-gray-600">
              Review the records that will be deleted. This operation cannot be undone.
            </p>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
              <p className="text-red-700 font-semibold flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {recordCount} records will be permanently deleted
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Preview Records</h3>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Date</TableHead>
                      {selectedEntities.some(e => ["Invoices", "Products & Services"].includes(e.name)) && (
                        <TableHead>Amount</TableHead>
                      )}
                      {selectedEntities.some(e => e.name === "Invoices") && (
                        <TableHead>Status</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedRecords().map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono">{record.id}</TableCell>
                        <TableCell>{record.name}</TableCell>
                        <TableCell>{record.date}</TableCell>
                        {selectedEntities.some(e => ["Invoices", "Products & Services"].includes(e.name)) && (
                          <TableCell>{record.amount}</TableCell>
                        )}
                        {selectedEntities.some(e => e.name === "Invoices") && (
                          <TableCell>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              record.status === "Paid" ? "bg-green-100 text-green-800" :
                              record.status === "Unpaid" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            )}>
                              {record.status}
                            </span>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {previewRecords.length > recordsPerPage && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={currentPage === i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
              
              <p className="mt-4 text-sm text-gray-500">
                Showing {getPaginatedRecords().length} of {previewRecords.length} preview records (total to be deleted: {recordCount})
              </p>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="font-semibold">Deletion Summary</h3>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Entities: {selectedEntities.map(e => e.name).join(", ")}</li>
                <li>Date Range: {dateRange.from ? format(dateRange.from, "PPP") : ""} to {dateRange.to ? format(dateRange.to, "PPP") : ""}</li>
                <li>Total Records to Delete: {recordCount}</li>
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
                onClick={() => setShowConfirmationDialog(true)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete Records
              </Button>
            </div>
          </div>
        )}

        {step === "delete" && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Deleting Data</h2>
            <p className="mb-6 text-gray-600">
              Please wait while your data is being deleted. This process may take several minutes depending on the amount of data.
            </p>
            
            <div className="mb-6">
              <Progress value={deleteProgress} className="h-2" />
              <p className="mt-2 text-center text-sm text-gray-500">
                {deleteProgress}% Complete
              </p>
            </div>
            
            <div className="flex justify-center">
              <div className="animate-pulse flex items-center">
                <Trash2 className="h-5 w-5 mr-2 text-red-500" />
                <span className="text-red-500">Processing deletion...</span>
              </div>
            </div>
          </div>
        )}

        {/* Warning Dialog */}
        <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Data Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                You're about to begin a process that could result in the permanent deletion of data from your QuickBooks account. 
                This action cannot be undone once completed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmSelection} className="bg-red-500 text-white hover:bg-red-600">
                I Understand, Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Final Confirmation Dialog */}
        <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Final Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to permanently delete {recordCount} records from your QuickBooks account. 
                <strong className="block mt-2 text-red-600">This action CANNOT be undone.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-3">
              <div className="p-3 bg-red-50 border border-red-300 rounded text-sm">
                <p className="font-semibold">Type DELETE to confirm:</p>
                <input 
                  type="text" 
                  className="mt-2 w-full p-2 border border-red-300 rounded"
                  placeholder="Type DELETE here"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleStartDelete} className="bg-red-500 text-white hover:bg-red-600">
                <Trash className="h-4 w-4 mr-2" />
                Permanently Delete Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Results Dialog */}
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deletion Completed</DialogTitle>
              <DialogDescription>
                Your deletion operation has been processed with the following results:
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md mb-2">
                <span className="font-medium">Total Records:</span>
                <span>{deleteResults.total}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-md mb-2">
                <span className="font-medium text-green-700">Successfully Deleted:</span>
                <span className="text-green-700">{deleteResults.success}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-md mb-2">
                <span className="font-medium text-yellow-700">Skipped:</span>
                <span className="text-yellow-700">{deleteResults.skipped}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-md">
                <span className="font-medium text-red-700">Failed:</span>
                <span className="text-red-700">{deleteResults.error}</span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleDeleteComplete}>
                Return to Dashboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Delete;

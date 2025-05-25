import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Trash2, AlertCircle, ChevronLeft, Calendar } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { logError } from "@/utils/errorLogger";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import "react-datepicker/dist/react-datepicker.css";
import { Pagination } from "@/components/ui/pagination";
import { getEntityColumns, getNestedValue } from "@/contexts/quickbooks/entityMapping";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";

const Delete = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAll, setSelectedAll] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | null, to: Date | null }>({ from: null, to: null });
  const [dateError, setDateError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [hasSelectedCurrentPage, setHasSelectedCurrentPage] = useState(false);

  const {
    selectedEntity,
    setSelectedEntity,
    selectedDateRange,
    setSelectedDateRange,
    entityState,
    fetchEntities,
    filterEntities,
    deleteEntity,
    deleteSelectedEntities,
    entityOptions,
    selectedEntityIds,
    setSelectedEntityIds,
    toggleEntitySelection,
    selectAllEntities,
    isDeleting,
    deleteProgress,
    getNestedValue: contextGetNestedValue
  } = useQuickbooksEntities();

  const currentEntityState = selectedEntity ? entityState[selectedEntity] : null;
  const filteredRecords = currentEntityState?.filteredRecords || [];
  const isLoading = currentEntityState?.isLoading || false;
  const error = currentEntityState?.error || null;

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = filteredRecords.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  // Handle date range change
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setSelectedDateRange({ from: dateRange.from, to: dateRange.to });
      setDateError(null);
    }
  }, [dateRange, setSelectedDateRange]);

  // Handle entity selection with explicit fetch
  const handleEntitySelect = (entity: string) => {
    setSelectedEntity(entity);
    setSelectedEntityIds([]);
    setSelectedAll(false);
    setHasSelectedCurrentPage(false);
    // Clear search and don't fetch automatically
    setSearchTerm("");
    setPageIndex(0);
  };

  // Get the connection check function from QuickBooks context
  const { checkConnection } = useQuickbooks();

  // Explicitly fetch data when requested by user
  const handleFetchData = async () => {
    try {
      if (!selectedEntity) {
        return;
      }
      if (!dateRange?.from || !dateRange?.to) {
        setDateError("Date range is required");
        toast({
          title: "Date Range Required",
          description: "Please select a date range before fetching data.",
          variant: "destructive",
        });
        return;
      }
      
      // Check QuickBooks connection before fetching data
      // This is a critical operation, so we use non-silent mode
      await checkConnection(true, false); // force=true, silent=false
      
      await fetchEntities();
    } catch (error) {
      logError(`Error fetching ${selectedEntity} data for deletion`, {
        source: "Delete",
        stack: error instanceof Error ? error.stack : undefined,
        context: { selectedEntity }
      });
    }
  };

  // Handle search input
  const handleSearch = () => {
    if (!selectedEntity) return;
    filterEntities(searchTerm);
    setPageIndex(0);
  };

  // Handle checkbox select/deselect all on current page
  const handleSelectAll = (checked: boolean) => {
    if (!checked) {
      // If unchecking, clear all selections
      setSelectedAll(false);
      setHasSelectedCurrentPage(false);
      setSelectedEntityIds([]);
      return;
    }

    // Select all records on current page
    const currentPageIds = paginatedRecords
      .filter(record => record.Id)
      .map(record => record.Id);
    
    setSelectedEntityIds(currentPageIds);
    setHasSelectedCurrentPage(true);
  };
  
  // Handle selecting all records across all pages
  const selectAllEntries = () => {
    setSelectedAll(true);
    const allIds = filteredRecords
      .filter(record => record.Id)
      .map(record => record.Id);
    
    setSelectedEntityIds(allIds);
    
    if (allIds.length > 0) {
      toast({
        title: "All Records Selected",
        description: `Selected all ${allIds.length} records.`,
      });
    }
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  // Handle actual deletion
  const handleDelete = async () => {
    try {
      // Check QuickBooks connection before deleting data
      // This is a critical operation, so we use non-silent mode
      await checkConnection(true, false); // force=true, silent=false
      
      await deleteSelectedEntities(selectedEntityIds);
      setSelectedEntityIds([]);
      setSelectedAll(false);
      setHasSelectedCurrentPage(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      logError(`Error deleting ${selectedEntity} entities`, {
        source: "Delete",
        stack: error instanceof Error ? error.stack : undefined,
        context: { selectedEntity, selectedEntityIds }
      });
    }
  };

  // Navigate back to dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
  };

  // Generate columns for the data table
  const generateColumns = (): ColumnDef<any>[] => {
    if (!selectedEntity || !filteredRecords.length) {
      return [];
    }

    // Add S. No. column as first column
    const columns: ColumnDef<any>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center">
            <Checkbox
              checked={selectedAll}
              onCheckedChange={(checked) => {
                handleSelectAll(!!checked);
              }}
              aria-label="Select all records"
            />
          </div>
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedEntityIds.includes(row.original.Id)}
            onCheckedChange={() => toggleEntitySelection(row.original.Id)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 70,
      },
      {
        accessorFn: (_, index) => pageIndex * pageSize + index + 1,
        header: "S. No.",
        size: 60,
      }
    ];

    // Get column definitions from our entity mapping
    const entityColumnConfigs = getEntityColumns(selectedEntity);
    
    // Convert the column configs to table columns
    const entityColumns: ColumnDef<any>[] = entityColumnConfigs.map(config => {
      return {
        accessorKey: config.field,
        header: () => (
          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
            {config.header}
          </div>
        ),
        cell: ({ row }) => {
          const value = config.accessor 
            ? config.accessor(row.original)
            : getNestedValue(row.original, config.field);
          
          let displayValue: string | number | React.ReactNode = "N/A";
          
          // Format dates
          if (typeof value === 'string' && 
              (config.field.includes('Date') || config.field.includes('Expiration') || config.field.includes('Time'))) {
            try {
              displayValue = new Date(value).toLocaleDateString();
            } catch (e) {
              displayValue = value || "N/A";
            }
          }
          // Format currency amounts
          else if ((typeof value === 'number' || !isNaN(parseFloat(value))) && 
              (config.field.includes('Amt') || config.field.includes('Balance') || 
               config.field.includes('Price') || config.field.includes('Amount'))) {
            try {
              displayValue = `$${parseFloat(value).toFixed(2)}`;
            } catch (e) {
              displayValue = value || "N/A";
            }
          }
          // Boolean values
          else if (typeof value === 'boolean') {
            displayValue = value ? "Yes" : "No";
          }
          else {
            displayValue = value || "N/A";
          }
          
          // Apply no-wrap styling
          return (
            <div className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={String(displayValue)}>
              {displayValue}
            </div>
          );
        },
      };
    });

    return [...columns, ...entityColumns];
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <DeleteConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={handleDelete}
          entityType={selectedEntity || ""}
          count={selectedEntityIds.length}
          isDeleting={isDeleting}
          progress={deleteProgress}
        />

        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            onClick={handleBackToDashboard} 
            className="flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-semibold">Delete QuickBooks Data</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Records to Delete</CardTitle>
            <CardDescription>
              Choose an entity type, fetch records, then select items to delete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Entity Type and Date Range side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Entity Type and Fetch Button */}
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="entity-type">Entity Type</Label>
                  <Select
                    value={selectedEntity || ""}
                    onValueChange={handleEntitySelect}
                  >
                    <SelectTrigger id="entity-type">
                      <SelectValue placeholder="Select an entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {entityOptions.map((entity) => (
                        <SelectItem key={entity.value} value={entity.value}>
                          {entity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={handleFetchData}
                  disabled={isLoading || !selectedEntity || !dateRange?.from || !dateRange?.to}
                  className={`w-fit flex items-center ${!selectedEntity || !dateRange?.from || !dateRange?.to ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isLoading ? "Loading Data..." : "Fetch Data"}
                </Button>
              </div>
              
              {/* Right Column - Date Range */}
              <div className="flex flex-col space-y-2">
                <Label>Date Range <span className="text-red-500">*</span></Label>
                
                <div className="flex flex-col gap-4">
                  {/* Start Date */}
                  <div className="w-full">
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            dateError && !dateRange?.from && "border-red-500"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            format(dateRange.from, "LLL dd, y")
                          ) : (
                            <span>Select start date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          initialFocus
                          mode="single"
                          defaultMonth={dateRange?.from || undefined}
                          selected={dateRange?.from || undefined}
                          onSelect={(date) => {
                            const newFrom = date || null;
                            let newTo = dateRange.to;
                            if (newFrom && newTo && newFrom > newTo) {
                              newTo = null;
                            }
                            setDateRange({ from: newFrom, to: newTo });
                            if (date) {
                              setStartDateOpen(false);
                            }
                          }}
                          numberOfMonths={1}
                          disabled={[{ after: new Date() }]}
                          className="p-3 pointer-events-auto"
                          captionLayout="dropdown"
                          fromYear={2000}
                          toYear={new Date().getFullYear()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* End Date */}
                  <div className="w-full">
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            dateError && !dateRange?.to && "border-red-500"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateRange?.to ? (
                            format(dateRange.to, "LLL dd, y")
                          ) : (
                            <span>Select end date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          initialFocus
                          mode="single"
                          defaultMonth={dateRange?.to || dateRange?.from || undefined}
                          selected={dateRange?.to || undefined}
                          onSelect={(date) => {
                            setDateRange({ from: dateRange.from, to: date || null });
                            if (date) {
                              setEndDateOpen(false);
                            }
                          }}
                          numberOfMonths={1}
                          disabled={[
                            { after: new Date() },
                            { before: dateRange.from || undefined }
                          ]}
                          className="p-3 pointer-events-auto"
                          captionLayout="dropdown"
                          fromYear={2000}
                          toYear={new Date().getFullYear()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {dateError && (
                  <p className="text-red-500 text-sm">{dateError}</p>
                )}
              </div>
            </div>
            
            {selectedEntity && !isLoading && filteredRecords.length > 0 && (
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleSearch}
                  className="flex items-center"
                >
                  <Search className="h-4 w-4" />
                  <span className="ml-2 hidden md:inline">Search</span>
                </Button>
              </div>
            )}
          </CardContent>
          {selectedEntityIds.length > 0 && (
            <CardFooter className="flex justify-between pt-4">
              <p className="text-sm text-gray-500">
                {selectedEntityIds.length} item(s) selected
              </p>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Selected
              </Button>
            </CardFooter>
          )}
        </Card>

        {filteredRecords.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {selectedEntity} Records
                  {` (${filteredRecords.length})`}
                  {selectedEntityIds.length > 0 && ` • ${selectedEntityIds.length} selected`}
                </CardTitle>
                
                {hasSelectedCurrentPage && !selectedAll && filteredRecords.length > paginatedRecords.length && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={selectAllEntries}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    Select all {filteredRecords.length} entries
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <DataTable
                  columns={generateColumns()}
                  data={paginatedRecords}
                  pageSize={pageSize}
                  className="w-full"
                />
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {pageIndex * pageSize + 1} to{" "}
                    {Math.min((pageIndex + 1) * pageSize, filteredRecords.length)} of{" "}
                    {filteredRecords.length} records
                  </div>
                  <div className="flex items-center space-x-3">
                    <Select
                      value={String(pageSize)}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setPageIndex(0);
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Page size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 / page</SelectItem>
                        <SelectItem value="25">25 / page</SelectItem>
                        <SelectItem value="50">50 / page</SelectItem>
                        <SelectItem value="100">100 / page</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Pagination
                      currentPage={pageIndex}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

// Helper to merge tailwind classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default Delete;

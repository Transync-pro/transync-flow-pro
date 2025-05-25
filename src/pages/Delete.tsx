import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Trash2, AlertCircle, ChevronLeft, Calendar } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { logError } from "@/utils/errorLogger";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Pagination } from "@/components/ui/pagination";
import { getEntityColumns } from "@/contexts/quickbooks/entityMapping";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { cn } from "@/lib/utils";

const Delete = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAll, setSelectedAll] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [dateError, setDateError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

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
    setSearchTerm("");
    setPageIndex(0);
  };

  // Get the connection check function from QuickBooks context
  const { checkConnection } = useQuickbooks();

  // Handle fetch data with error handling
  const handleFetchData = async () => {
    try {
      if (!selectedEntity) {
        toast({
          title: "Entity Required",
          description: "Please select an entity type before fetching data.",
          variant: "destructive",
        });
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
      
      // Check if start date is before end date
      if (dateRange.from > dateRange.to) {
        setDateError("Start date must be before end date");
        toast({
          title: "Invalid Date Range",
          description: "Start date must be before end date.",
          variant: "destructive",
        });
        return;
      }
      
      // Check QuickBooks connection before fetching data
      try {
        await checkConnection(true, false); // force=true, silent=false
      } catch (error) {
        toast({
          title: "Connection Error",
          description: "Failed to connect to QuickBooks. Please check your connection and try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      await fetchEntities();
      
      toast({
        title: "Data Fetched",
        description: `Successfully loaded ${selectedEntity} data.`,
        variant: "default",
      });
      
    } catch (error: any) {
      console.error(`Error in handleFetchData:`, error);
      
      const errorMessage = error?.message || 'An unknown error occurred';
      
      logError(`Error fetching ${selectedEntity || 'unknown'} data for deletion`, {
        source: "Delete",
        stack: error instanceof Error ? error.stack : undefined,
        context: { 
          selectedEntity,
          error: errorMessage,
          dateRange
        }
      });
      
      toast({
        title: "Error Fetching Data",
        description: `Failed to fetch ${selectedEntity || 'data'}: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Handle search input
  const handleSearch = () => {
    if (!selectedEntity) return;
    filterEntities(searchTerm);
    setPageIndex(0);
  };

  // Handle checkbox select all
  const handleSelectAll = (checked: boolean) => {
    setSelectedAll(checked);
    selectAllEntities(checked, filteredRecords);
    
    if (checked && filteredRecords.length > 0) {
      toast({
        title: "Selection Complete",
        description: `Selected all ${filteredRecords.length} records.`,
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
      if (!selectedEntity || selectedEntityIds.length === 0) {
        toast({
          title: "No Selection",
          description: "Please select at least one record to delete.",
          variant: "destructive",
        });
        return;
      }

      // Check QuickBooks connection before deleting data
      try {
        await checkConnection(true, false); // force=true, silent=false
      } catch (error) {
        toast({
          title: "Connection Error",
          description: "Failed to connect to QuickBooks. Please check your connection and try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      await deleteSelectedEntities(selectedEntityIds);
      
      // Clear selection after successful deletion
      setSelectedEntityIds([]);
      setSelectedAll(false);
      setShowDeleteConfirm(false);
      
      toast({
        title: "Deletion Successful",
        description: `Successfully deleted ${selectedEntityIds.length} ${selectedEntity} record(s).`,
        variant: "default",
      });
      
    } catch (error: any) {
      console.error(`Error in handleDelete:`, error);
      
      const errorMessage = error?.message || 'An unknown error occurred';
      
      logError(`Error deleting ${selectedEntity || 'unknown'} entities`, {
        source: "Delete",
        stack: error instanceof Error ? error.stack : undefined,
        context: { 
          selectedEntity,
          selectedEntityCount: selectedEntityIds.length,
          error: errorMessage
        }
      });
      
      toast({
        title: "Deletion Failed",
        description: `Failed to delete ${selectedEntity || 'selected'} records: ${errorMessage}`,
        variant: "destructive",
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
      },
      {
        id: "sno",
        header: "S. No.",
        cell: ({ row }) => row.index + 1 + pageIndex * pageSize,
        enableSorting: false,
      },
    ];

    // Get entity columns based on the selected entity
    const entityColumns = getEntityColumns(selectedEntity).map((column) => {
      return {
        id: column.field,
        header: column.header,
        accessorKey: column.field,
        cell: ({ row }) => {
          const value = row.original[column.field];
          return value !== undefined && value !== null ? String(value) : "";
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                
                <div className="pt-1">
                  <Button
                    onClick={handleFetchData}
                    disabled={!selectedEntity || !dateRange?.from || !dateRange?.to || isLoading}
                    className={cn(
                      "w-full flex items-center justify-center mt-1",
                      (!selectedEntity || !dateRange?.from || !dateRange?.to) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Fetch Data"
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 md:col-span-2">
                <Label>Date Range <span className="text-red-500">*</span></Label>
                
                <div className="flex flex-col gap-4">
                  <div className="w-full">
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
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
                            let newTo = dateRange?.to || null;
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
                  
                  <div className="w-full">
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
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
                            setDateRange({ from: dateRange?.from || null, to: date || null });
                            if (date) {
                              setEndDateOpen(false);
                            }
                          }}
                          numberOfMonths={1}
                          disabled={[
                            { after: new Date() },
                            { before: dateRange?.from }
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
              </div>
            </div>

            {dateError && (
              <p className="text-sm text-red-500 mt-2">{dateError}</p>
            )}

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

            {selectedEntity && isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading {selectedEntity} data...</span>
              </div>
            ) : error ? (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error loading {selectedEntity} data
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error.message || 'An unknown error occurred'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedEntity && filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchTerm
                    ? 'No records match your search criteria.'
                    : 'No records found for the selected entity and date range.'}
                </p>
              </div>
            ) : selectedEntity && filteredRecords.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Showing {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={String(pageSize)}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setPageIndex(0);
                      }}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Rows per page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="25">25 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                        <SelectItem value="100">100 per page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <DataTable
                    columns={generateColumns()}
                    data={paginatedRecords}
                    onSortingChange={() => {}}
                    onPaginationChange={() => {}}
                    pageCount={Math.ceil(filteredRecords.length / pageSize)}
                    state={{
                      pagination: {
                        pageIndex,
                        pageSize,
                      },
                    }}
                    manualPagination={false}
                    className="w-full"
                  />
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-gray-500">
                      Page {pageIndex + 1} of {totalPages}
                    </div>
                    <Pagination
                      currentPage={pageIndex}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Select an entity type and date range to view records
                </p>
              </div>
            )}
          </CardContent>

          {selectedEntity && selectedEntityIds.length > 0 && (
            <div className="border-t bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  {selectedEntityIds.length} record{selectedEntityIds.length !== 1 ? 's' : ''} selected
                </p>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

// Helper to merge tailwind classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default Delete;

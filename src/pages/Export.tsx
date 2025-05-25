
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Download, ChevronLeft, Calendar } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange as ReactDayPickerDateRange } from "react-day-picker";
import { EntityRecord } from "@/contexts/quickbooks/types";
import { getEntityColumns, getNestedValue } from "@/contexts/quickbooks/entityMapping";
import { Pagination } from "@/components/ui/pagination";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";

const Export = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fileName, setFileName] = useState("export");
  const [selectAllFields, setSelectAllFields] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedRecords, setSelectedRecords] = useState<Record<string, boolean>>({});
  const [selectAllRecords, setSelectAllRecords] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  
  const {
    selectedEntity,
    setSelectedEntity,
    selectedDateRange,
    setSelectedDateRange,
    entityState,
    fetchEntities,
    filterEntities,
    entityOptions,
    getNestedValue: contextGetNestedValue
  } = useQuickbooksEntities();

  const currentEntityState = selectedEntity ? entityState[selectedEntity] : null;
  const filteredRecords = currentEntityState?.filteredRecords || [];
  const isLoading = currentEntityState?.isLoading || false;
  const error = currentEntityState?.error || null;

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = filteredRecords.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  // Handle date range change - now required
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setSelectedDateRange({ from: dateRange.from, to: dateRange.to });
      setDateError(null);
    }
  }, [dateRange, setSelectedDateRange]);

  // Reset selected fields when entity changes
  useEffect(() => {
    setSelectedFields([]);
    setSelectAllFields(false);
    setPageIndex(0);
    setSelectedRecords({});
    setSelectAllRecords(false);
  }, [selectedEntity, entityState]);

  // Get entity records with applied filters
  const getEntityRecords = (): EntityRecord[] => {
    if (!selectedEntity || !entityState[selectedEntity]) return [];
    
    // If there are selected records, only return those
    if (Object.keys(selectedRecords).length > 0) {
      return entityState[selectedEntity].filteredRecords.filter(record => 
        record.Id && selectedRecords[record.Id]
      );
    }
    
    return entityState[selectedEntity].filteredRecords || [];
  };

  // Get available fields for the current entity
  const getAvailableFields = (): string[] => {
    if (!selectedEntity) return [];
    
    // Use the predefined entity columns from our mapping
    const columnConfigs = getEntityColumns(selectedEntity);
    return columnConfigs.map(config => config.field);
  };

  // Handle entity selection with explicit fetch
  const handleEntitySelect = (entity: string) => {
    setSelectedEntity(entity);
    setSelectedFields([]);
    setSelectAllFields(false);
    setSearchTerm("");
    setPageIndex(0);
    setSelectedRecords({});
    setSelectAllRecords(false);
  };

  // Get the connection check function from QuickBooks context
  const { checkConnection } = useQuickbooks();

  // Explicitly fetch data when requested by user
  const handleFetchData = async () => {
    try {
      if (!selectedEntity) return;
      
      // Check if date range is selected - now required
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
    } catch (error: any) {
      console.error(`Error fetching ${selectedEntity} data:`, error);
      toast({
        title: "Error",
        description: `Failed to fetch data: ${error.message}`,
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

  // Handle field selection
  const toggleFieldSelection = (field: string) => {
    setSelectedFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  // Handle select all fields
  const handleSelectAllFields = (checked: boolean) => {
    setSelectAllFields(checked);
    if (checked) {
      setSelectedFields(getAvailableFields());
    } else {
      setSelectedFields([]);
    }
  };

  // Handle record selection
  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecords(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

  // Handle select all records on current page
  const toggleSelectAllRecords = () => {
    const newSelectAll = !selectAllRecords;
    setSelectAllRecords(newSelectAll);
    
    // Select all records across all pages, not just current page
    const newSelectedRecords = { ...selectedRecords };
    
    filteredRecords.forEach(record => {
      if (record.Id) {
        newSelectedRecords[record.Id] = newSelectAll;
      }
    });
    
    setSelectedRecords(newSelectedRecords);
    
    // Show toast notification when selecting all
    if (newSelectAll && filteredRecords.length > 0) {
      toast({
        title: "Selection Complete",
        description: `Selected all ${filteredRecords.length} records.`,
      });
    }
  };

  // Count selected records
  const selectedRecordsCount = Object.values(selectedRecords).filter(Boolean).length;

  // Handle export to CSV
  const handleExport = async () => {
    try {
      if (!selectedEntity) {
        toast({
          title: "No Entity Selected",
          description: "Please select an entity type to export.",
          variant: "destructive",
        });
        return;
      }
      
      // Check QuickBooks connection before exporting data
      // This is a critical operation, so we use non-silent mode
      await checkConnection(true, false); // force=true, silent=false
      
      if (selectedFields.length === 0) {
        toast({
          title: "No Fields Selected",
          description: "Please select at least one field to export",
          variant: "destructive",
        });
        return;
      }
      
      const records = getEntityRecords();
      if (records.length === 0) {
        toast({
          title: "No Data Available",
          description: "No records to export",
          variant: "destructive",
        });
        return;
      }
      
      // Generate CSV
      const headers = selectedFields.map(field => {
        const displayName = field.replace(/([A-Z])/g, ' $1')
                               .replace(/^./, str => str.toUpperCase())
                               .trim();
        return displayName;
      });
      
      let csv = headers.join(',') + '\n';
      
      records.forEach(record => {
        const values = selectedFields.map(field => {
          const value = getNestedValue(record, field);
          // Format value for CSV
          if (value === null || value === undefined) return '';
          if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
          if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          return value;
        });
        csv += values.join(',') + '\n';
      });
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName || selectedEntity || 'export'}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `${records.length} records exported to CSV`,
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Error generating CSV file",
        variant: "destructive",
      });
    }
  };

  // Generate columns for the data table
  const generateColumns = (): ColumnDef<any>[] => {
    if (!selectedEntity || !filteredRecords.length) {
      return [];
    }

    // Add checkbox column as first column
    const columns: ColumnDef<any>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center">
            <Checkbox
              checked={selectAllRecords}
              onCheckedChange={toggleSelectAllRecords}
              aria-label="Select all records"
            />
            <span className="ml-2 text-xs text-muted-foreground">
              {selectAllRecords ? "All selected" : "Select all"}
            </span>
          </div>
        ),
        cell: ({ row }) => {
          const recordId = row.original.Id;
          return recordId ? (
            <Checkbox
              checked={!!selectedRecords[recordId]}
              onCheckedChange={() => toggleRecordSelection(recordId)}
              aria-label="Select row"
            />
          ) : null;
        },
        size: 40,
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
        header: config.header,
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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
  };

  return (
    <DashboardLayout>
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
          <h1 className="text-2xl font-semibold">Export QuickBooks Data</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Select Data to Export</CardTitle>
              <CardDescription>
                Choose an entity type and fetch records to export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col space-y-2 flex-grow">
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
                
                <div className="flex flex-col space-y-2 flex-grow">
                  <Label>Date Range <span className="text-red-500">*</span></Label>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Start Date */}
                    <div className="flex-1">
                      <Label className="text-sm text-muted-foreground mb-1 block">Start Date</Label>
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
                              if (date) {
                                setStartDateOpen(false);
                              }
                            }}
                          numberOfMonths={1}
                          className="p-3 pointer-events-auto"
                          captionLayout="dropdown"
                          fromYear={2000}
                          toYear={2030}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* End Date */}
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground mb-1 block">End Date</Label>
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
                          onSelect={(date) => { // date can be Date | undefined
                              setDateRange({ from: dateRange.from, to: date || null });
                              if (date) {
                                setEndDateOpen(false);
                              }
                            }}
                          numberOfMonths={1}
                          className="p-3 pointer-events-auto"
                          captionLayout="dropdown"
                          fromYear={2000}
                          toYear={2030}
                        />
                      </PopoverContent>
                    </Popover>
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

              {selectedEntity && (
                <Button
                  onClick={handleFetchData}
                  disabled={isLoading || !dateRange?.from || !dateRange?.to}
                  className="flex items-center"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isLoading ? "Loading Data..." : "Fetch Data"}
                </Button>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Configure your export settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="file-name">File Name</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="file-name"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Enter file name"
                  />
                  <span className="text-sm text-muted-foreground">.csv</span>
                </div>
              </div>
              
              {selectedRecordsCount > 0 && (
                <div className="bg-muted p-2 rounded-md text-sm">
                  <p>{selectedRecordsCount} record(s) selected for export</p>
                </div>
              )}
              
              {filteredRecords.length > 0 && (
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleExport}
                  disabled={selectedFields.length === 0}
                >
                  <Download className="h-4 w-4" />
                  {selectedRecordsCount > 0 
                    ? `Export ${selectedRecordsCount} Selected Record${selectedRecordsCount > 1 ? 's' : ''}`
                    : 'Export All Records'}
                </Button>
              )}
              
              {getAvailableFields().length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox 
                      id="select-all-fields" 
                      checked={selectAllFields}
                      onCheckedChange={handleSelectAllFields}
                    />
                    <Label htmlFor="select-all-fields">Select All Fields</Label>
                  </div>
                  <ScrollArea className="h-[200px] border rounded p-2">
                    <div className="space-y-2">
                      {getAvailableFields().map((field) => (
                        <div key={field} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`field-${field}`}
                            checked={selectedFields.includes(field)}
                            onCheckedChange={() => toggleFieldSelection(field)}
                          />
                          <Label htmlFor={`field-${field}`} className="text-sm">
                            {field.includes('.') || field.includes('[') 
                              ? field 
                              : field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedEntity || "Entity"} Records
              {filteredRecords.length > 0 && ` (${filteredRecords.length})`}
              {selectedRecordsCount > 0 && ` • ${selectedRecordsCount} selected`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="mt-4">Loading {selectedEntity} records...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center py-8 text-red-500">
                  <p className="mt-4">Error: {error}</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {selectedEntity
                    ? "No records found. Click 'Fetch Data' to load records."
                    : "Select an entity type to get started"}
                </div>
              ) : (
                <div className="min-h-[400px]">
                  <DataTable
                    columns={generateColumns()}
                    data={paginatedRecords}
                    pageSize={pageSize}
                    className="w-full"
                  />
                </div>
              )}
            </div>
            {filteredRecords.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {pageIndex * pageSize + 1} to{" "}
                  {Math.min((pageIndex + 1) * pageSize, filteredRecords.length)} of{" "}
                  {filteredRecords.length} records
                </div>
                <div className="flex items-center space-x-2">
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Export;

// Helper to merge tailwind classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

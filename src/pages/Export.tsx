
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Download, ChevronLeft, Calendar, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  const {
    selectedEntity,
    setSelectedEntity,
    selectedDateRange,
    setSelectedDateRange,
    entityState,
    fetchEntities,
    filterEntities,
    entityOptions,
  } = useQuickbooksEntities();

  const currentEntityState = selectedEntity ? entityState[selectedEntity] : null;
  const filteredRecords = currentEntityState?.filteredRecords || [];
  const isLoading = currentEntityState?.isLoading || false;
  const error = currentEntityState?.error || null;

  // Show export options when an entity is selected
  useEffect(() => {
    if (selectedEntity) {
      setShowExportOptions(true);
    } else {
      setShowExportOptions(false);
    }
  }, [selectedEntity]);

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
      
      // Check QuickBooks connection before fetching data
      await checkConnection(true, false); // force=true, silent=false
      
      await fetchEntities();
    } catch (error: any) {
      console.error(`Error fetching ${selectedEntity} data:`, error);
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

  const [hasSelectedCurrentPage, setHasSelectedCurrentPage] = useState(false);

  // Handle record selection
  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecords(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
    
    // If we're deselecting, make sure to reset the two-step state
    if (selectedRecords[recordId]) {
      setHasSelectedCurrentPage(false);
    }
  };

  // Handle select/deselect all records on current page
  const toggleSelectAllRecords = () => {
    // Check if all records are already selected (across all pages)
    const allSelected = filteredRecords.length > 0 && 
      filteredRecords.every(record => record.Id && selectedRecords[record.Id]);
    
    if (allSelected) {
      // If all records are selected, deselect everything
      setSelectedRecords({});
      setHasSelectedCurrentPage(false);
      setSelectAllRecords(false);
      
      toast({
        title: "All Records Deselected",
        description: `Deselected all ${filteredRecords.length} records.`,
      });
    } else if (hasSelectedCurrentPage) {
      // If current page is selected but not all records, deselect all
      setSelectedRecords({});
      setHasSelectedCurrentPage(false);
      setSelectAllRecords(false);
    } else {
      // Select all records on current page
      const newSelectedRecords = { ...selectedRecords };
      let selectedCount = 0;
      
      paginatedRecords.forEach(record => {
        if (record.Id) {
          newSelectedRecords[record.Id] = true;
          selectedCount++;
        }
      });
      
      setSelectedRecords(newSelectedRecords);
      setHasSelectedCurrentPage(true);
      // Set selectAllRecords to true to make the checkbox filled
      setSelectAllRecords(true);
    }
  };
  
  // Handle selecting/deselecting all records across all pages
  const selectAllEntries = () => {
    // Check if all records are already selected
    const allSelected = filteredRecords.length > 0 && 
      filteredRecords.every(record => record.Id && selectedRecords[record.Id]);
    
    if (allSelected) {
      // If all are already selected, deselect all
      setSelectedRecords({});
      setSelectAllRecords(false);
      setHasSelectedCurrentPage(false);
      
      toast({
        title: "All Records Deselected",
        description: `Deselected all ${filteredRecords.length} records.`,
      });
    } else {
      // Select all records across all pages
      const newSelectedRecords = { ...selectedRecords };
      let selectedCount = 0;
      
      filteredRecords.forEach(record => {
        if (record.Id) {
          newSelectedRecords[record.Id] = true;
          selectedCount++;
        }
      });
      
      setSelectedRecords(newSelectedRecords);
      setSelectAllRecords(true);
      // Hide the button by setting hasSelectedCurrentPage to false
      setHasSelectedCurrentPage(false);
      
      if (selectedCount > 0) {
        toast({
          title: "All Records Selected",
          description: `Selected all ${selectedCount} records.`,
        });
      }
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
        header: () => (
          <div className="flex items-center">
            <Checkbox
              checked={selectAllRecords}
              onCheckedChange={toggleSelectAllRecords}
              aria-label="Select all records"
            />
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
          <Card className="md:col-span-2 h-fit">
            <CardHeader>
              <CardTitle>Select Data to Export</CardTitle>
              <CardDescription>
                Choose an entity type and fetch records to export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <div className="flex flex-col space-y-2">
                  <Label>Date Range <span className="text-red-500">*</span></Label>
                  
                  <div className="flex flex-row gap-2">
                    {/* Start Date */}
                    <div className="flex-1">
                      <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-10",
                              dateError && !dateRange?.from && "border-red-500"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                              format(dateRange.from, "LLL dd, y")
                            ) : (
                              <span>Start date</span>
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
                    <div className="flex-1">
                      <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-10",
                              dateError && !dateRange?.to && "border-red-500"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {dateRange?.to ? (
                              format(dateRange.to, "LLL dd, y")
                            ) : (
                              <span>End date</span>
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

              <Button
                onClick={handleFetchData}
                disabled={isLoading || !selectedEntity || !dateRange?.from || !dateRange?.to}
                className={`flex items-center ${!selectedEntity || !dateRange?.from || !dateRange?.to ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isLoading ? "Loading Data..." : "Fetch Data"}
              </Button>

              {selectedEntity && !isLoading && filteredRecords.length > 0 && (
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pr-8"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 py-0 hover:bg-transparent"
                        onClick={() => {
                          setSearchTerm('');
                          filterEntities(''); // Reset to show all records
                        }}
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
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

          <Card className="transition-all duration-300 ease-in-out overflow-hidden">
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                {selectedEntity ? 'Configure your export settings' : 'Select an entity to configure export options'}
              </CardDescription>
            </CardHeader>
            <CardContent className={`space-y-4 transition-all duration-300 ease-in-out ${!showExportOptions ? 'opacity-50' : ''}`}>
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
              
              {/* Reserved space with smooth transition for selection message */}
              <div className="h-[40px] relative">
                <div 
                  className={`
                    absolute w-full 
                    transition-all duration-300 ease-in-out
                    ${selectedRecordsCount > 0 
                      ? 'opacity-100 transform-none' 
                      : 'opacity-0 transform -translate-y-1 pointer-events-none'}
                  `}
                >
                  <div className="bg-muted p-2 rounded-md text-sm">
                    <p>{selectedRecordsCount} record(s) selected for export</p>
                  </div>
                </div>
              </div>
              
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
            <div className="flex items-center gap-3 h-10"> {/* Fixed height to prevent UI shifts */}
              <CardTitle className="flex items-center">
                {selectedEntity || "Entity"} Records
                {filteredRecords.length > 0 && ` (${filteredRecords.length})`}
                {selectedRecordsCount > 0 && ` • ${selectedRecordsCount} selected`}
              </CardTitle>
              
              {/* Keep button close to title text */}
              <div className="ml-2">
                {hasSelectedCurrentPage && filteredRecords.length > paginatedRecords.length && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={selectAllEntries}
                    className="text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center gap-1 px-3 py-1 h-auto transition-all duration-200 shadow-sm border border-gray-200"
                  >
                    Select all {filteredRecords.length} entries
                  </Button>
                )}
              </div>
            </div>
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

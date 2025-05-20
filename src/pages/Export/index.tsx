import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { logOperation } from "@/utils/operationLogger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronLeft } from "lucide-react";
import { EntityRecord } from "@/contexts/quickbooks/types";
import { DateRange as ReactDayPickerDateRange } from "react-day-picker";

// Import components
import { EntitySelect } from "./EntitySelect";
import { FilterControls } from "./FilterControls";
import { ExportControls } from "./ExportControls";
import { FieldSelectionPanel } from "./FieldSelectionPanel";
import { ExportTable } from "./ExportTable";
import { formatDisplayName, getEntityColumns, getNestedValue } from "@/contexts/quickbooks/entityMapping";

const Export = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fileName, setFileName] = useState("export");
  const [dateRange, setDateRange] = useState<ReactDayPickerDateRange | undefined>(undefined);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedRecords, setSelectedRecords] = useState<Record<string, boolean>>({});
  const [selectAllRecords, setSelectAllRecords] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
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

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = filteredRecords.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  // Handle date range change
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setSelectedDateRange({ from: dateRange.from, to: dateRange.to });
    }
  }, [dateRange, setSelectedDateRange]);

  // Reset selected fields when entity changes
  useEffect(() => {
    setSelectedFields([]);
    setPageIndex(0);
    setSelectedRecords({});
    setSelectAllRecords(false);
    setSearchQuery("");
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
  
  // Filter fields based on search
  const getFilteredFields = (): string[] => {
    const fields = getAvailableFields();
    if (!searchQuery) return fields;
    
    return fields.filter(field => 
      formatDisplayName(field).toLowerCase().includes(searchQuery.toLowerCase())
    );
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
  const handleSelectAllFields = (select: boolean) => {
    if (select) {
      setSelectedFields(getAvailableFields());
    } else {
      setSelectedFields([]);
    }
  };

  // Handle entity selection with explicit fetch
  const handleEntitySelect = (entity: string) => {
    setSelectedEntity(entity);
    setSelectedFields([]);
    setSearchTerm("");
    setPageIndex(0);
    setSelectedRecords({});
    setSelectAllRecords(false);
  };

  // Explicitly fetch data when requested by user
  const handleFetchData = async () => {
    try {
      if (!selectedEntity) return;
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
    
    const newSelectedRecords = { ...selectedRecords };
    
    paginatedRecords.forEach(record => {
      if (record.Id) {
        newSelectedRecords[record.Id] = newSelectAll;
      }
    });
    
    setSelectedRecords(newSelectedRecords);
  };

  // Count selected records
  const selectedRecordsCount = Object.values(selectedRecords).filter(Boolean).length;

  // Export data
  const handleExport = async (format: "csv" | "json" = "csv") => {
    console.log('=== Starting export operation ===');
    let url: string | null = null;
    let link: HTMLAnchorElement | null = null;
    
    try {
      if (selectedFields.length === 0) {
        console.log('No fields selected for export');
        toast({
          title: "No Fields Selected",
          description: "Please select at least one field to export",
          variant: "destructive",
        });
        return;
      }
      
      const records = getEntityRecords();
      console.log(`Preparing to export ${records.length} records`);
      
      if (records.length === 0) {
        console.log('No records to export');
        toast({
          title: "No Data Available",
          description: "No records to export",
          variant: "destructive",
        });
        return;
      }

      // Process records based on selected fields
      console.log('Processing export data...');
      const exportData = handleExportData(records, selectedFields, format);
      
      // Log the export operation first
      try {
        console.log('Attempting to log export operation...');
        const logResult = await logOperation({
          operationType: 'export',
          entityType: selectedEntity || 'unknown',
          status: 'success',
          details: {
            format,
            recordCount: records.length,
            fields: selectedFields,
            timestamp: new Date().toISOString(),
            selectedOnly: Object.keys(selectedRecords).length > 0
          }
        });
        console.log('Export operation logged successfully:', logResult);
      } catch (logError) {
        console.error("Error logging export operation:", logError);
      }

      // Create download link
      console.log('Creating download link...');
      const fileExtension = format === "csv" ? "csv" : "json";
      const mimeType = format === "csv" ? "text/csv" : "application/json";
      const blob = new Blob([exportData], { type: `${mimeType};charset=utf-8;` });
      url = URL.createObjectURL(blob);
      link = document.createElement('a');
      link.href = url;
      link.download = `${fileName || selectedEntity || 'export'}.${fileExtension}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      console.log('Triggering download...');
      link.click();
      
      toast({
        title: "Export Successful",
        description: `${records.length} records exported to ${format.toUpperCase()}`,
      });
      
    } catch (error: any) {
      console.error("Export error:", error);
      
      try {
        console.log('Attempting to log export error...');
        await logOperation({
          operationType: 'export',
          entityType: selectedEntity || 'unknown',
          status: 'error',
          details: {
            error: error.message || 'Unknown error during export',
            format,
            timestamp: new Date().toISOString()
          }
        });
        console.log('Export error logged successfully');
      } catch (logError) {
        console.error("Error logging export error:", logError);
      }
      
      toast({
        title: "Export Failed",
        description: error.message || "An error occurred while exporting data",
        variant: "destructive",
      });
    } finally {
      // Cleanup
      if (link) {
        console.log('Cleaning up download resources...');
        // Use setTimeout to ensure the download has started before cleaning up
        setTimeout(() => {
          if (link && link.parentNode) {
            link.parentNode.removeChild(link);
          }
          if (url) {
            URL.revokeObjectURL(url);
          }
          console.log('Cleanup complete');
        }, 1000);
      }
      console.log('=== Export operation completed ===');
    }
  };

  // Handle export of selected records
  const handleExportSelected = (format: "csv" | "json") => (e: React.MouseEvent<HTMLButtonElement>) => {
    if (selectedRecordsCount === 0) {
      toast({
        title: "No Records Selected",
        description: "Please select at least one record to export",
        variant: "destructive",
      });
      return;
    }
    
    handleExport(format);
  };

  // Convert data to CSV or JSON
  const handleExportData = (records: EntityRecord[], fields: string[], format: "csv" | "json") => {
    if (format === "json") {
      const jsonData = records.map(record => {
        const item: Record<string, any> = {};
        fields.forEach(field => {
          const value = getNestedValue(record, field);
          // Use the display name for the field
          const displayName = formatDisplayName(field);
          item[displayName] = value;
        });
        return item;
      });
      return JSON.stringify(jsonData, null, 2);
    } else {
      // Generate CSV
      const headers = fields.map(field => formatDisplayName(field));
      let csv = headers.join(',') + '\n';
      
      records.forEach(record => {
        const values = fields.map(field => {
          const value = getNestedValue(record, field);
          // Format value for CSV
          if (value === null || value === undefined) return '';
          if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
          if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          return value;
        });
        csv += values.join(',') + '\n';
      });
      
      return csv;
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
  };

  return (
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
            <EntitySelect 
              selectedEntity={selectedEntity}
              entityOptions={entityOptions}
              onChange={handleEntitySelect}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />

            {selectedEntity && (
              <Button
                onClick={handleFetchData}
                disabled={isLoading}
                className="flex items-center"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isLoading ? "Loading Data..." : "Fetch Data"}
              </Button>
            )}

            {selectedEntity && !isLoading && filteredRecords.length > 0 && (
              <FilterControls
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSearch={handleSearch}
              />
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
              <label htmlFor="file-name" className="text-sm font-medium">
                File Name
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="file-name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter file name"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="text-sm text-muted-foreground">.csv/.json</span>
              </div>
            </div>
            
            {selectedRecordsCount > 0 && (
              <div className="bg-muted p-2 rounded-md text-sm">
                <p>{selectedRecordsCount} record(s) selected for export</p>
              </div>
            )}
            
            <ExportControls 
              onExportAll={handleExport}
              onExportSelected={handleExportSelected}
              isLoading={isLoading}
              hasData={filteredRecords.length > 0}
              hasSelection={selectedRecordsCount > 0}
            />
            
            {getAvailableFields().length > 0 && (
              <FieldSelectionPanel 
                availableFields={getAvailableFields()}
                selectedFields={selectedFields}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onFieldToggle={toggleFieldSelection}
                onSelectAll={handleSelectAllFields}
                filteredFields={getFilteredFields()}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <ExportTable 
        selectedEntity={selectedEntity}
        isLoading={isLoading}
        error={error}
        paginatedRecords={paginatedRecords}
        filteredRecords={filteredRecords}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={setPageSize}
        onPageChange={handlePageChange}
        selectedRecords={selectedRecords}
        selectAllRecords={selectAllRecords}
        toggleRecordSelection={toggleRecordSelection}
        toggleSelectAllRecords={toggleSelectAllRecords}
        selectedRecordsCount={selectedRecordsCount}
      />
    </div>
  );
};

export default Export;

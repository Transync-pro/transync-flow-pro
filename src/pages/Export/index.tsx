
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronLeft } from "lucide-react";
import { DateRange } from "react-day-picker";

// Import components
import { EntitySelect } from "./EntitySelect";
import { FilterControls } from "./FilterControls";
import { ExportControls } from "./ExportControls";
import { FieldSelectionPanel } from "./FieldSelectionPanel";
import { ExportTable } from "./ExportTable";
import { useExportData } from "./hooks/useExportData";
import { useExportFields } from "./hooks/useExportFields";
import { usePagination } from "./hooks/usePagination";

const Export = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [fileName, setFileName] = useState("export");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedRecords, setSelectedRecords] = useState<Record<string, boolean>>({});
  const [selectAllRecords, setSelectAllRecords] = useState(false);
  
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

  // Use custom hooks for better organization
  const { selectedFields, setSelectedFields, getAvailableFields, toggleFieldSelection, handleSelectAllFields, getFilteredFields, searchQuery, setSearchQuery } = useExportFields(selectedEntity, entityState);
  const { getEntityRecords, handleExportData, handleExport } = useExportData(selectedEntity, entityState, selectedFields, fileName, selectedRecords);
  const { pageSize, setPageSize, pageIndex, setPageIndex, paginatedRecords, totalPages } = usePagination(selectedEntity ? entityState[selectedEntity]?.filteredRecords || [] : []);

  const currentEntityState = selectedEntity ? entityState[selectedEntity] : null;
  const filteredRecords = currentEntityState?.filteredRecords || [];
  const isLoading = currentEntityState?.isLoading || false;
  const error = currentEntityState?.error || null;

  // Handle date range change
  useEffect(() => {
    if (dateRange) {
      setSelectedDateRange(dateRange);
    }
  }, [dateRange, setSelectedDateRange]);

  // Reset selected fields when entity changes
  useEffect(() => {
    setSelectedFields([]);
    setPageIndex(0);
    setSelectedRecords({});
    setSelectAllRecords(false);
    setSearchQuery("");
  }, [selectedEntity, entityState, setSelectedFields, setPageIndex, setSearchQuery]);

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

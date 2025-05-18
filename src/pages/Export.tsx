import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
import { format } from "date-fns";
import { logError } from "@/utils/errorLogger";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Filter, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { DataTable } from "@/components/DataTable";

// Import sub-components
import { EntitySelect } from "./Export/EntitySelect";
import { ExportControls } from "./Export/ExportControls";
import { FilterControls } from "./Export/FilterControls";
import { FieldSelectionPanel } from "./Export/FieldSelectionPanel";

// Type for entity records 
type EntityRecord = Record<string, any>;

const Export = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected, refreshConnection } = useQuickbooks();
  const { 
    selectedEntity,
    setSelectedEntity,
    selectedEntityIds,
    setSelectedEntityIds,
    toggleEntitySelection,
    selectAllEntities,
    entityState,
    fetchEntities,
    filterEntities,
    entityOptions
  } = useQuickbooksEntities();

  // Export settings state
  const [isLoading, setIsLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [filterField, setFilterField] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // State for selected fields for export
  useEffect(() => {
    if (selectedEntity && entityState[selectedEntity]?.records) {
      // Default to all fields when entity changes
      const allFields = getAvailableFields();
      setSelectedFields(allFields);
    }
  }, [selectedEntity, entityState]);

  // Get entity records with applied filters
  const getEntityRecords = () => {
    if (!selectedEntity || !entityState[selectedEntity]) return [];
    
    return entityState[selectedEntity].filteredRecords || [];
  };

  // Get available fields from the first record
  const getAvailableFields = () => {
    const records = getEntityRecords();
    if (records.length === 0) return [];
    
    const firstRecord = records[0];
    return Object.keys(firstRecord || {});
  };

  // Handle entity change
  const handleEntityChange = (entity: string) => {
    setSelectedEntity(entity);
    setSelectedEntityIds([]);
    setFilterValue("");
    setFilterField(null);
    loadEntityData(entity);
  };

  // Load entity data
  const loadEntityData = async (entity: string) => {
    if (!entity) return;
    
    setIsLoading(true);
    try {
      await fetchEntities(entity);
    } catch (error) {
      toast({
        title: "Error Loading Data",
        description: "Failed to load QuickBooks data. Please try again.",
        variant: "destructive",
      });
      logError(`Error loading ${entity} data`, {
        source: "Export",
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = () => {
    if (!selectedEntity || !filterField) return;
    
    // Fix: Pass only field and value to filterEntities, as the function signature requires
    filterEntities(selectedEntity, {
      field: filterField,
      value: filterValue
    });
  };

  // Convert records to CSV
  const convertToCSV = (records: EntityRecord[], fields: string[]) => {
    if (!records || records.length === 0) return "";
    
    const header = fields.join(',');
    const rows = records.map(record => {
      return fields.map(field => {
        // Handle different value types
        const value = record[field];
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return JSON.stringify(value).replace(/"/g, '""');
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(",");
    });
    
    return [header, ...rows].join("\n");
  };

  // Download all records as CSV or JSON
  const handleDownloadAll = (exportFormat: "csv" | "json") => {
    try {
      const records = getEntityRecords();
      if (!records || records.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There are no records to export.",
          variant: "destructive",
        });
        return;
      }
      
      const currentDate = format(new Date(), "yyyy-MM-dd");
      
      if (exportFormat === "csv") {
        const csv = convertToCSV(records, selectedFields);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${selectedEntity}_export_${currentDate}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Filter records to only include selected fields
        const filteredRecords = records.map(record => {
          const filteredRecord: Record<string, any> = {};
          selectedFields.forEach(field => {
            filteredRecord[field] = record[field];
          });
          return filteredRecord;
        });
        
        const json = JSON.stringify(filteredRecords, null, 2);
        const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${selectedEntity}_export_${currentDate}.json`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast({
        title: "Export Successful",
        description: `Exported ${records.length} records as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      logError(`Error exporting all records as ${exportFormat}`, {
        source: "Export",
        stack: error instanceof Error ? error.stack : undefined,
        context: { selectedEntity }
      });
      
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting data.",
        variant: "destructive",
      });
    }
  };

  // Handle export of selected records
  const handleExportSelected = (exportFormat: "csv" | "json") => (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      if (selectedEntityIds.length === 0) {
        toast({
          title: "No Records Selected",
          description: "Please select records to export.",
          variant: "destructive",
        });
        return;
      }
      
      const records = getEntityRecords();
      // TypeScript fix: Convert to expected type
      const selectedData = records.filter(record => 
        selectedEntityIds.includes(record.Id)
      );

      const currentDate = format(new Date(), "yyyy-MM-dd");
      
      if (exportFormat === "csv") {
        // Fix: Changed to use the convertToCSV function that accepts array data
        const csv = convertToCSV(selectedData, selectedFields);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `${selectedEntity}_selected_export_${currentDate}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Export as JSON
        const json = JSON.stringify(selectedData, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `${selectedEntity}_selected_export_${currentDate}.json`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Export Successful",
        description: `Exported ${selectedEntityIds.length} selected records as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      logError(`Error exporting selected records as ${exportFormat}`, {
        source: "Export",
        stack: error instanceof Error ? error.stack : undefined,
        context: { selectedEntity, selectedEntityIds }
      });
    }
  };

  // Handle field selection toggle
  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  // Select or deselect all fields
  const handleSelectAllFields = (select: boolean) => {
    if (select) {
      setSelectedFields(getAvailableFields());
    } else {
      setSelectedFields([]);
    }
  };

  // Check connection on mount
  useEffect(() => {
    refreshConnection();
  }, [refreshConnection]);

  // Filter fields by search query
  const filteredFields = getAvailableFields().filter(field => 
    field.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create data table props based on our app's data structure
  const createTableProps = () => {
    if (!selectedEntity || !entityState[selectedEntity]?.filteredRecords?.length) {
      return {
        data: [],
        columns: []
      };
    }

    return {
      data: entityState[selectedEntity]?.filteredRecords || [],
      fields: selectedFields,
      selectedIds: selectedEntityIds,
      onToggleSelect: toggleEntitySelection,
      onSelectAll: (select: boolean) => selectAllEntities(select, entityState[selectedEntity]?.filteredRecords)
    };
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-text">Export Data</h1>
          <p className="text-gray-600 mt-2">
            Export your QuickBooks data to CSV or JSON format
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Data to Export</CardTitle>
              <CardDescription>
                Choose an entity type and export format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <EntitySelect 
                selectedEntity={selectedEntity}
                entityOptions={entityOptions}
                onChange={handleEntityChange}
              />

              {selectedEntity && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowFilter(!showFilter)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        {showFilter ? "Hide Filter" : "Show Filter"}
                      </Button>
                    </div>

                    <div className="space-x-2 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadAll("csv")}
                        disabled={isLoading || !entityState[selectedEntity]?.records?.length}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export All as CSV
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadAll("json")}
                        disabled={isLoading || !entityState[selectedEntity]?.records?.length}
                      >
                        <FileJson className="h-4 w-4 mr-2" />
                        Export All as JSON
                      </Button>
                    </div>
                  </div>

                  {showFilter && (
                    <FilterControls 
                      filterField={filterField}
                      filterValue={filterValue}
                      availableFields={getAvailableFields()}
                      setFilterField={setFilterField}
                      setFilterValue={setFilterValue}
                      onApplyFilter={handleFilterChange}
                    />
                  )}

                  <Tabs defaultValue="data">
                    <TabsList className="mb-4">
                      <TabsTrigger value="data">Data Preview</TabsTrigger>
                      <TabsTrigger value="fields">Field Selection</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="data">
                      {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="mt-2 text-sm text-gray-500">Loading data...</p>
                        </div>
                      ) : !entityState[selectedEntity]?.records?.length ? (
                        <div className="text-center py-12 border rounded-md">
                          <p className="text-gray-500">No data available for this entity type.</p>
                          <Button className="mt-4" onClick={() => loadEntityData(selectedEntity)}>
                            Load Data
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <p className="text-sm text-gray-500">
                                {entityState[selectedEntity]?.filteredRecords?.length || 0} records found
                              </p>
                            </div>
                            <div className="space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportSelected("csv")}
                                disabled={selectedEntityIds.length === 0}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Export Selected as CSV
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportSelected("json")}
                                disabled={selectedEntityIds.length === 0}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Export Selected as JSON
                              </Button>
                            </div>
                          </div>

                          <DataTable {...createTableProps()} />
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="fields">
                      <FieldSelectionPanel 
                        availableFields={getAvailableFields()}
                        selectedFields={selectedFields}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onFieldToggle={handleFieldToggle}
                        onSelectAll={handleSelectAllFields}
                        filteredFields={filteredFields}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Export;

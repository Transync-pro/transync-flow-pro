
import { useState, useEffect } from "react";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
import { convertToCSV, getEntitySchema } from "@/services/quickbooksApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, FileDown } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { logError } from "@/utils/errorLogger";

const Export = () => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"preview" | "json">("preview");
  
  // Use the centralized QuickbooksEntities context
  const { 
    selectedEntity, 
    setSelectedEntity,
    entityState,
    fetchEntities,
    entityOptions,
    getNestedValue
  } = useQuickbooksEntities();

  // Get current entity data
  const currentEntityState = selectedEntity ? entityState[selectedEntity] : null;
  const exportedData = currentEntityState?.records || [];
  const isLoading = currentEntityState?.isLoading || false;

  // Update fields when entity changes
  useEffect(() => {
    if (selectedEntity) {
      // Get default fields for the entity
      const { fields } = getEntitySchema(selectedEntity);
      setAvailableFields(fields);
      setSelectedFields(fields);
      
      // Important: Do NOT fetch entities automatically
      // This prevents the issue #3 - we only fetch when user explicitly requests it
    }
  }, [selectedEntity]);

  // Handle field selection
  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

  // Handle entity selection with explicit fetch
  const handleEntitySelect = (entity: string) => {
    setSelectedEntity(entity);
    // Clear any previous data to avoid confusion
    // Let the user explicitly request data by clicking "Fetch Data"
  };

  // Generate columns for the data table
  const generateColumns = (): ColumnDef<any>[] => {
    return selectedFields.map((field) => ({
      accessorKey: field,
      header: field,
      cell: ({ row }) => {
        const value = getNestedValue(row.original, field);
        return value;
      },
    }));
  };

  // Explicitly fetch data when requested by user
  const handleFetchData = async () => {
    try {
      if (!selectedEntity) {
        toast({
          title: "Select Entity",
          description: "Please select an entity type first.",
          variant: "destructive",
        });
        return;
      }
      
      await fetchEntities();
    } catch (error) {
      logError(`Error fetching ${selectedEntity} data`, {
        source: "Export",
        stack: error instanceof Error ? error.stack : undefined,
        context: { selectedEntity }
      });
    }
  };

  const downloadCSV = () => {
    if (!exportedData.length || !selectedFields.length) return;
    
    try {
      // Convert data to CSV
      const csv = convertToCSV(exportedData, selectedFields);
      
      // Create download link
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${selectedEntity}_export_${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Your ${selectedEntity} data is being downloaded as CSV.`,
      });
    } catch (error) {
      logError("Download CSV error", {
        source: "Export",
        stack: error instanceof Error ? error.stack : undefined,
        context: { selectedEntity }
      });
      
      toast({
        title: "Download Failed",
        description: "Failed to generate CSV file.",
        variant: "destructive",
      });
    }
  };

  const downloadJSON = () => {
    if (!exportedData.length) return;
    
    try {
      // Create download link for JSON
      const json = JSON.stringify(exportedData, null, 2);
      const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${selectedEntity}_export_${format(new Date(), "yyyy-MM-dd")}.json`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Your ${selectedEntity} data is being downloaded as JSON.`,
      });
    } catch (error) {
      logError("Download JSON error", {
        source: "Export",
        stack: error instanceof Error ? error.stack : undefined,
        context: { selectedEntity }
      });
      
      toast({
        title: "Download Failed",
        description: "Failed to generate JSON file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Export QuickBooks Data</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Export Settings</CardTitle>
          <CardDescription>
            Select the entity type and click "Fetch Data" to load records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
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

            {selectedEntity && (
              <>
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

                {exportedData.length > 0 && (
                  <div>
                    <Label>Select Fields to Export</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                      {availableFields.map((field) => (
                        <div
                          key={field}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`field-${field}`}
                            checked={selectedFields.includes(field)}
                            onCheckedChange={() => handleFieldToggle(field)}
                          />
                          <Label
                            htmlFor={`field-${field}`}
                            className="text-sm cursor-pointer"
                          >
                            {field}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {exportedData.length > 0 && (
                  <div>
                    <Label>Preview Mode</Label>
                    <Tabs
                      value={viewMode}
                      onValueChange={(v) => setViewMode(v as "preview" | "json")}
                      className="mt-2"
                    >
                      <TabsList>
                        <TabsTrigger value="preview">Table Preview</TabsTrigger>
                        <TabsTrigger value="json">JSON View</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedEntity && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {selectedEntity} Data Preview
              {exportedData.length > 0 && ` (${exportedData.length} records)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="mt-4">Loading {selectedEntity} data...</p>
              </div>
            ) : exportedData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {selectedEntity} data found. Click "Fetch Data" above to load records.
              </div>
            ) : viewMode === "preview" ? (
              <div className="overflow-x-auto">
                <DataTable
                  columns={generateColumns()}
                  data={exportedData}
                  pageSize={10}
                />
              </div>
            ) : (
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                {JSON.stringify(exportedData, null, 2)}
              </pre>
            )}
          </CardContent>
          {exportedData.length > 0 && (
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={downloadJSON}
                className="flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Export as JSON
              </Button>
              <Button
                onClick={downloadCSV}
                className="flex items-center"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export as CSV
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
};

export default Export;

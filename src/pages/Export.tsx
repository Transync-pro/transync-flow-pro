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

// Test component to directly display context state
const ContextDebugDisplay = () => {
  const context = useQuickbooksEntities();
  
  return (
    <div className="bg-yellow-100 p-4 mb-4 rounded-md">
      <h3 className="font-bold mb-2">Context Debug</h3>
      <div className="text-xs overflow-auto max-h-40">
        <div><strong>Selected Entity:</strong> {context.selectedEntity || 'None'}</div>
        <div><strong>Entity Options:</strong> {context.entityOptions.length} options available</div>
        <div><strong>Has Entity State:</strong> {Object.keys(context.entityState).length > 0 ? 'Yes' : 'No'}</div>
        <div>
          <strong>Current Entity Records:</strong> 
          {context.selectedEntity && context.entityState[context.selectedEntity] 
            ? `${context.entityState[context.selectedEntity].records?.length || 0} records` 
            : 'None'}
        </div>
        <div>
          <button 
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs mt-2"
            onClick={() => {
              console.log("Manual fetch triggered");
              if (context.selectedEntity) {
                context.fetchEntities(context.selectedEntity);
              } else if (context.entityOptions.length > 0) {
                const firstEntity = context.entityOptions[0].value;
                console.log(`Setting entity to ${firstEntity} and fetching`);
                context.setSelectedEntity(firstEntity);
                setTimeout(() => context.fetchEntities(firstEntity), 100);
              }
            }}
          >
            Force Fetch
          </button>
        </div>
      </div>
    </div>
  );
};

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

  // Debug logging
  useEffect(() => {
    console.log("QuickbooksEntitiesContext in Export.tsx:", {
      selectedEntity,
      entityOptions,
      entityState,
      availableFields,
      selectedFields
    });
  }, [selectedEntity, entityOptions, entityState, availableFields, selectedFields]);

  // Get current entity data
  const currentEntityState = selectedEntity ? entityState[selectedEntity] : null;
  const exportedData = currentEntityState?.records || [];
  const isLoading = currentEntityState?.isLoading || false;

  // Reset fields when entity changes
  useEffect(() => {
    if (selectedEntity) {
      // Get default fields for the entity
      const { fields } = getEntitySchema(selectedEntity);
      setAvailableFields(fields);
      setSelectedFields(fields);
      
      // Fetch entities if not already loaded
      if (!currentEntityState || !currentEntityState.records || currentEntityState.records.length === 0) {
        fetchEntities();
      }
    }
  }, [selectedEntity, currentEntityState, fetchEntities]);

  // Handle field selection
  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
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
      console.error("Download error:", error);
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
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "Failed to generate JSON file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* VERY OBVIOUS TEST BANNER - REMOVE AFTER TESTING */}
      <div className="bg-blue-500 text-white p-6 mb-6 text-center text-xl font-bold rounded-lg">
        THIS IS A TEST BANNER - IF YOU CAN SEE THIS, THE DEPLOYMENT IS WORKING
        <div className="mt-2 text-sm">
          Current time: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <ContextDebugDisplay />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Export QuickBooks Data</h1>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => fetchEntities()}
          disabled={isLoading || !selectedEntity}
        >
          <Loader2 className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Export Settings</CardTitle>
          <CardDescription>
            Select the entity type and fields you want to export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="entity-type">Entity Type</Label>
              <Select
                value={selectedEntity || ""}
                onValueChange={setSelectedEntity}
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
                No {selectedEntity} data found. Try refreshing or selecting a different entity.
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

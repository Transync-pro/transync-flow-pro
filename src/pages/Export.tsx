import { useState, useEffect } from "react";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { queryQuickbooksData, logOperation, convertToCSV, getEntitySchema } from "@/services/quickbooksApi";
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

// Define available entities for export
const AVAILABLE_ENTITIES = [
  { id: "Customer", label: "Customers" },
  { id: "Invoice", label: "Invoices" },
  { id: "Item", label: "Products & Services" },
  { id: "Account", label: "Chart of Accounts" },
  { id: "Vendor", label: "Vendors" },
  { id: "Bill", label: "Bills" },
  { id: "Payment", label: "Payments" },
];

const Export = () => {
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportedData, setExportedData] = useState<any[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"preview" | "json">("preview");
  const { getAccessToken, getRealmId } = useQuickbooks();

  // Reset fields when entity changes
  useEffect(() => {
    if (selectedEntity) {
      // Get default fields for the entity
      const { fields } = getEntitySchema(selectedEntity);
      setAvailableFields(fields);
      setSelectedFields(fields);
      setExportedData([]);
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

  // Generate columns for the data table
  const generateColumns = (): ColumnDef<any>[] => {
    return selectedFields.map((field) => ({
      accessorKey: field,
      header: field,
      cell: ({ row }) => {
        const value = row.getValue(field);
        if (value === null || value === undefined) return "-";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
      },
    }));
  };

  const handleExport = async () => {
    if (!selectedEntity) return;
    
    setExporting(true);
    
    try {
      const accessToken = await getAccessToken();
      const realmId = await getRealmId();
      
      if (!accessToken || !realmId) {
        throw new Error("QuickBooks connection not available");
      }
      
      // Determine the entity name for the query response
      const entityQueryName = selectedEntity === "Item" ? "Item" : `${selectedEntity}s`;
      
      // Query QuickBooks API
      const data = await queryQuickbooksData(
        accessToken,
        realmId,
        selectedEntity,
        selectedFields,
        "Active = true",
        1000
      );
      
      // Check if data exists
      if (!data.QueryResponse || !data.QueryResponse[entityQueryName]) {
        throw new Error(`No ${selectedEntity} data found`);
      }
      
      // Set the exported data
      setExportedData(data.QueryResponse[entityQueryName]);
      
      // Log the operation
      await logOperation({
        operationType: "export", 
        entityType: selectedEntity,
        recordId: null,
        status: "success",
        details: { recordCount: data.QueryResponse[entityQueryName]?.length || 0 }
      });
      
      toast({
        title: "Export Successful",
        description: `${data.QueryResponse[entityQueryName].length} ${selectedEntity}(s) exported.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
      
      await logOperation({
        operationType: "export",
        entityType: selectedEntity || "unknown", 
        recordId: null,
        status: "error",
        details: { error: error.message }
      });
    } finally {
      setExporting(false);
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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Export QuickBooks Data</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
              <CardDescription>
                Select what data you want to export from QuickBooks
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entity-select">Select Entity</Label>
                <Select
                  value={selectedEntity}
                  onValueChange={setSelectedEntity}
                  disabled={exporting}
                >
                  <SelectTrigger id="entity-select">
                    <SelectValue placeholder="Select entity to export" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ENTITIES.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedEntity && (
                <div className="space-y-2">
                  <Label>Select Fields</Label>
                  <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
                    {availableFields.map((field) => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox
                          id={`field-${field}`}
                          checked={selectedFields.includes(field)}
                          onCheckedChange={() => handleFieldToggle(field)}
                        />
                        <Label htmlFor={`field-${field}`} className="text-sm">
                          {field}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <Button
                onClick={handleExport}
                disabled={!selectedEntity || exporting || selectedFields.length === 0}
                className="w-full"
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Export Results</CardTitle>
                  <CardDescription>
                    {exportedData.length
                      ? `${exportedData.length} records found`
                      : "No data exported yet"}
                  </CardDescription>
                </div>
                
                {exportedData.length > 0 && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadCSV}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadJSON}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      JSON
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              {exportedData.length > 0 ? (
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "preview" | "json")}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="preview">Table Preview</TabsTrigger>
                    <TabsTrigger value="json">JSON View</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="preview">
                    <div className="border rounded-md overflow-hidden">
                      <DataTable
                        columns={generateColumns()}
                        data={exportedData}
                        pageSize={10}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="json">
                    <div className="border rounded-md p-4 bg-gray-50 overflow-auto max-h-[500px]">
                      <pre className="text-xs">
                        {JSON.stringify(exportedData, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  {exporting ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      <p>Fetching data from QuickBooks...</p>
                    </div>
                  ) : (
                    <p>
                      {selectedEntity
                        ? "Click 'Export Data' to fetch records"
                        : "Select an entity to export"}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Export;

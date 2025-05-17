import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
import { convertToCSV, getEntitySchema, flattenQuickbooksData } from "@/services/quickbooksApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, FileDown, ChevronLeft, Calendar, CheckSquare } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { logError } from "@/utils/errorLogger";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const Export = () => {
  const navigate = useNavigate();
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"preview" | "json">("preview");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedAll, setSelectedAll] = useState(false);
  
  // Use the centralized QuickbooksEntities context
  const { 
    selectedEntity, 
    setSelectedEntity,
    selectedDateRange,
    setSelectedDateRange,
    entityState,
    fetchEntities,
    entityOptions,
    getNestedValue,
    selectedEntityIds,
    setSelectedEntityIds,
    toggleEntitySelection,
    selectAllEntities
  } = useQuickbooksEntities();

  // Get current entity data
  const currentEntityState = selectedEntity ? entityState[selectedEntity] : null;
  const exportedData = currentEntityState?.records || [];
  const isLoading = currentEntityState?.isLoading || false;

  // Get entity-specific fields based on the selected entity
  const getEntityFields = (entityType: string): string[] => {
    switch (entityType) {
      case "Customer":
        return [
          "Id", "DisplayName", "CompanyName", "Title", "GivenName", "FamilyName",
          "PrimaryEmailAddr.Address", "PrimaryPhone.FreeFormNumber",
          "BillAddr.Line1", "BillAddr.City", "BillAddr.Country", "BillAddr.PostalCode",
          "BillAddr.CountrySubDivisionCode", "CurrencyRef.value", "Active"
        ];
      case "Vendor":
        return [
          "Id", "DisplayName", "CompanyName", "Title", "GivenName", "FamilyName",
          "PrimaryEmailAddr.Address", "PrimaryPhone.FreeFormNumber",
          "BillAddr.Line1", "BillAddr.City", "BillAddr.Country", "BillAddr.PostalCode",
          "BillAddr.CountrySubDivisionCode", "CurrencyRef.value", "Active"
        ];
      case "Item":
        return [
          "Id", "Name", "Type", "Sku", "UnitPrice", "IncomeAccountRef.name",
          "Description", "SubItem", "SalesTaxCodeRef.name", "Active"
        ];
      case "Account":
        return [
          "Id", "Name", "AccountType", "AccountSubType", "AcctNum", "ParentRef.name",
          "Description", "CurrentBalance", "CurrencyRef.value", "Active"
        ];
      case "Employee":
        return [
          "Id", "DisplayName", "HiredDate", "PrimaryPhone.FreeFormNumber",
          "PrimaryAddr.Line1", "PrimaryAddr.City", "PrimaryAddr.CountrySubDivisionCode",
          "PrimaryAddr.Country", "PrimaryAddr.PostalCode", "Active"
        ];
      case "Department":
        return [
          "Id", "Name", "SubDepartment", "ParentRef.name", "Active"
        ];
      case "Class":
        return [
          "Id", "Name", "SubClass", "ParentRef.name", "Active"
        ];
      case "Invoice":
        return [
          "Id", "DocNumber", "CustomerRef.name", "TxnDate", "DueDate", "EmailStatus",
          "BillEmail.Address", "Line[0].SalesItemLineDetail.ItemRef.name",
          "BillAddr.Line1", "BillAddr.City", "BillAddr.Country", "BillAddr.PostalCode",
          "CurrencyRef.value", "TotalAmt", "Balance"
        ];
      case "Estimate":
        return [
          "Id", "DocNumber", "CustomerRef.name", "TxnDate", "ExpirationDate", "EmailStatus",
          "BillEmail.Address", "Line[0].SalesItemLineDetail.ItemRef.name",
          "BillAddr.Line1", "BillAddr.City", "BillAddr.Country", "BillAddr.PostalCode",
          "CurrencyRef.value", "TotalAmt", "TxnStatus"
        ];
      case "CreditMemo":
        return [
          "Id", "DocNumber", "CustomerRef.name", "TxnDate", "EmailStatus",
          "BillEmail.Address", "Line[0].SalesItemLineDetail.ItemRef.name",
          "BillAddr.Line1", "BillAddr.City", "BillAddr.CountrySubDivisionCode",
          "BillAddr.Country", "BillAddr.PostalCode", "CurrencyRef.value",
          "TotalAmt", "CustomerMemo.value"
        ];
      case "SalesReceipt":
        return [
          "Id", "DocNumber", "CustomerRef.name", "TxnDate", "DepositToAccountRef.name",
          "EmailStatus", "BillEmail.Address", "Line[0].SalesItemLineDetail.ItemRef.name",
          "BillAddr.Line1", "BillAddr.City", "BillAddr.Country", "BillAddr.PostalCode",
          "CurrencyRef.value", "TotalAmt", "PrivateNote"
        ];
      case "Payment":
        return [
          "Id", "PaymentRefNum", "CustomerRef.name", "TxnDate", "PaymentMethodRef.name",
          "Line[0].LinkedTxn[0].TxnId", "DepositToAccountRef.name", "CurrencyRef.value", "TotalAmt"
        ];
      case "RefundReceipt":
        return [
          "Id", "DocNumber", "CustomerRef.name", "TxnDate", "DepositToAccountRef.name",
          "PaymentMethodRef.name", "BillEmail.Address", "Line[0].SalesItemLineDetail.ItemRef.name",
          "BillAddr.Line1", "BillAddr.City", "BillAddr.Country", "BillAddr.PostalCode",
          "CurrencyRef.value", "PrivateNote", "PrintStatus"
        ];
      case "PurchaseOrder":
        return [
          "Id", "DocNumber", "VendorRef.name", "TxnDate", "APAccountRef.name",
          "VendorAddr.Line1", "VendorAddr.City", "VendorAddr.Country", "VendorAddr.PostalCode",
          "CurrencyRef.value", "TotalAmt"
        ];
      case "Bill":
        return [
          "Id", "DocNumber", "VendorRef.name", "TxnDate", "APAccountRef.name", "DueDate",
          "Line[0].ItemBasedExpenseLineDetail.ItemRef.name",
          "VendorAddr.Line1", "VendorAddr.City", "VendorAddr.Country", "VendorAddr.PostalCode",
          "CurrencyRef.value", "TotalAmt"
        ];
      case "VendorCredit":
        return [
          "Id", "DocNumber", "VendorRef.name", "TxnDate", "APAccountRef.name",
          "Line[0].ItemBasedExpenseLineDetail.ItemRef.name",
          "VendorAddr.Line1", "VendorAddr.City", "VendorAddr.CountrySubDivisionCode",
          "VendorAddr.Country", "VendorAddr.PostalCode", "CurrencyRef.value", "TotalAmt"
        ];
      case "Deposit":
        return [
          "Id", "PrivateNote", "DepositToAccountRef.name", "TxnDate",
          "Line[0].DepositLineDetail.Entity.name", "Line[0].DepositLineDetail.PaymentMethodRef.name",
          "CurrencyRef.value", "TotalAmt"
        ];
      case "Transfer":
        return [
          "Id", "FromAccountRef.name", "TxnDate", "ToAccountRef.name",
          "PrivateNote", "CurrencyRef.value", "Amount"
        ];
      case "JournalEntry":
        return [
          "Id", "DocNumber", "PrivateNote", "TxnDate",
          "Line[0].JournalEntryLineDetail.AccountRef.name", "TotalAmt", "CurrencyRef.value"
        ];
      default:
        return ["Id", "Name", "DisplayName"];
    }
  };

  // Generate columns for the data table
  const generateColumns = (): ColumnDef<any>[] => {
    // Add a selection column if we have data
    const selectionColumn: ColumnDef<any>[] = exportedData.length > 0 ? [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={selectedAll}
            onCheckedChange={(checked) => {
              setSelectedAll(!!checked);
              selectAllEntities(!!checked);
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedEntityIds.includes(row.original.Id)}
            onCheckedChange={() => toggleEntitySelection(row.original.Id)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      }
    ] : [];

    // Create columns for selected fields
    const dataColumns = selectedFields.map((field) => ({
      accessorKey: field,
      // Convert field names to user-friendly headers
      header: formatFieldHeader(field),
      cell: ({ row }) => {
        const value = getNestedValue(row.original, field);
        
        // Format value based on its type
        if (value === null || value === undefined) {
          return "";
        } else if (typeof value === "object") {
          return JSON.stringify(value);
        } else if (typeof value === "boolean") {
          return value ? "Yes" : "No";
        } else if (field.includes("Date") && typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
          // Format dates
          return new Date(value).toLocaleDateString();
        } else if ((field.includes("Amt") || field.includes("Price") || field.includes("Cost") || field.includes("Balance")) && typeof value === "number") {
          // Format currency
          return `$${value.toFixed(2)}`;
        }
        
        return String(value);
      },
    }));

    return [...selectionColumn, ...dataColumns];
  };

  // Format field names to user-friendly headers
  const formatFieldHeader = (field: string): string => {
    // Handle nested fields
    if (field.includes('.')) {
      const parts = field.split('.');
      const lastPart = parts[parts.length - 1];
      
      // Handle array notation
      if (lastPart.includes('[')) {
        return formatFieldHeader(lastPart.split('[')[0]);
      }
      
      return formatFieldHeader(lastPart);
    }
    
    // Handle array notation without dot
    if (field.includes('[')) {
      return formatFieldHeader(field.split('[')[0]);
    }
    
    // Format camelCase to Title Case with spaces
    return field
      // Insert a space before all uppercase letters
      .replace(/([A-Z])/g, ' $1')
      // Replace specific abbreviations
      .replace(/\bId\b/g, 'ID')
      .replace(/\bRef\b/g, 'Reference')
      .replace(/\bAddr\b/g, 'Address')
      .replace(/\bAmt\b/g, 'Amount')
      .replace(/\bNum\b/g, 'Number')
      .replace(/\bTxn\b/g, 'Transaction')
      .replace(/\bAcct\b/g, 'Account')
      // Capitalize the first letter
      .replace(/^./, (str) => str.toUpperCase())
      // Trim any leading/trailing spaces
      .trim();
  };

  // Reset fields when entity changes
  useEffect(() => {
    if (selectedEntity) {
      // Get entity-specific fields for the selected entity
      const entityFields = getEntityFields(selectedEntity);
      setAvailableFields(entityFields);
      setSelectedFields(entityFields);
      
      // Important: Do NOT fetch entities automatically
      // This prevents the issue #3 - we only fetch when user explicitly requests it
    }
  }, [selectedEntity]);

  // Handle date range change
  useEffect(() => {
    if (dateRange) {
      setSelectedDateRange(dateRange);
    }
  }, [dateRange, setSelectedDateRange]);

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

  const downloadCSV = (data?: any[]) => {
    if (!data) {
      data = exportedData;
    }
    
    if (!data.length || !selectedFields.length) return;
    
    try {
      // Convert data to CSV
      const csv = convertToCSV(data, selectedFields);
      
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

  const downloadJSON = (data?: any[]) => {
    if (!data) {
      data = exportedData;
    }
    
    if (!data.length) return;
    
    try {
      // Create download link for JSON
      const json = JSON.stringify(data, null, 2);
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

  // Handle export of selected records
  const handleExportSelected = (format: "csv" | "json") => {
    try {
      if (selectedEntityIds.length === 0) {
        toast({
          title: "No Records Selected",
          description: "Please select at least one record to export",
          variant: "destructive",
        });
        return;
      }

      // Filter the data to only include selected records
      const selectedData = exportedData.filter(record => 
        selectedEntityIds.includes(record.Id)
      );

      if (format === "csv") {
        downloadCSV(selectedData);
      } else {
        downloadJSON(selectedData);
      }

      toast({
        title: "Export Successful",
        description: `Exported ${selectedEntityIds.length} selected records as ${format.toUpperCase()}`,
      });
    } catch (error) {
      logError(`Error exporting selected records as ${format}`, {
        source: "Export",
        stack: error instanceof Error ? error.stack : undefined,
        context: { selectedEntity, selectedEntityIds }
      });
      
      toast({
        title: "Export Failed",
        description: `Failed to export selected records: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Go back to dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          onClick={handleBackToDashboard} 
          className="flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </Button>
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
                <div className="flex flex-col space-y-2">
                  <Label>Date Range (Optional)</Label>
                  <div className="flex items-center space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Select date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                    {dateRange && dateRange.from && (
                      <Button 
                        variant="ghost" 
                        onClick={() => setDateRange(undefined)}
                        size="sm"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

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
              <div className="mr-auto">
                {selectedEntityIds.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedEntityIds.length} record{selectedEntityIds.length !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              {selectedEntityIds.length > 0 ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleExportSelected("json")}
                    className="flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected as JSON
                  </Button>
                  <Button
                    onClick={() => handleExportSelected("csv")}
                    className="flex items-center"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Selected as CSV
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={downloadJSON}
                    className="flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export All as JSON
                  </Button>
                  <Button
                    onClick={downloadCSV}
                    className="flex items-center"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export All as CSV
                  </Button>
                </>
              )}
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
};

export default Export;

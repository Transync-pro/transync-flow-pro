
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
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
import { DateRange } from "react-day-picker";
import { EntityRecord } from "@/contexts/quickbooks/types";
import { convertToCSV } from "@/services/quickbooksApi/entities";

const Export = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fileName, setFileName] = useState("export");
  const [selectAllFields, setSelectAllFields] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const {
    selectedEntity,
    setSelectedEntity,
    selectedDateRange,
    setSelectedDateRange,
    entityState,
    fetchEntities,
    filterEntities,
    entityOptions,
    getNestedValue
  } = useQuickbooksEntities();

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
    setSelectAllFields(false);
  }, [selectedEntity, entityState]);

  // Get entity records with applied filters
  const getEntityRecords = (): EntityRecord[] => {
    if (!selectedEntity || !entityState[selectedEntity]) return [];
    
    return entityState[selectedEntity].filteredRecords || [];
  };

  // Get available fields for the current entity
  const getAvailableFields = (): string[] => {
    const records = getEntityRecords();
    
    if (records.length === 0) return [];
    
    // Sample the first record to get fields
    const sampleRecord = records[0];
    if (!sampleRecord) return [];
    
    const extractFields = (obj: any, prefix = ""): string[] => {
      if (!obj || typeof obj !== 'object') return [];
      
      return Object.keys(obj).reduce((fields: string[], key) => {
        const value = obj[key];
        const fullPath = prefix ? `${prefix}.${key}` : key;
        
        // Skip metadata fields
        if (fullPath.startsWith('MetaData')) return fields;
        
        // Add the current field
        fields.push(fullPath);
        
        // Recursively add nested fields for objects (but not arrays)
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          fields = [...fields, ...extractFields(value, fullPath)];
        }
        
        return fields;
      }, []);
    };
    
    return extractFields(sampleRecord);
  };

  // Handle entity selection with explicit fetch
  const handleEntitySelect = (entity: string) => {
    setSelectedEntity(entity);
    setSelectedFields([]);
    setSelectAllFields(false);
    setSearchTerm("");
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

  // Export data to CSV
  const handleExport = () => {
    try {
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
      const csv = convertToCSV(records, selectedFields);
      
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

    // Entity-specific columns based on the entity type
    let entityColumns: ColumnDef<any>[] = [];

    switch (selectedEntity) {
      case "Customer":
        entityColumns = [
          {
            accessorKey: "Id",
            header: "ID",
          },
          {
            accessorKey: "DisplayName",
            header: "Display Name",
          },
          {
            accessorKey: "CompanyName",
            header: "Company Name",
          },
          {
            accessorKey: "Title",
            header: "Title",
          },
          {
            accessorKey: "GivenName",
            header: "First Name",
          },
          {
            accessorKey: "FamilyName",
            header: "Last Name",
          },
          {
            accessorKey: "PrimaryEmailAddr.Address",
            header: "Email",
            cell: ({ row }) => getNestedValue(row.original, "PrimaryEmailAddr.Address") || "N/A",
          },
          {
            accessorKey: "PrimaryPhone.FreeFormNumber",
            header: "Phone",
            cell: ({ row }) => getNestedValue(row.original, "PrimaryPhone.FreeFormNumber") || "N/A",
          },
          {
            accessorKey: "BillAddr.Line1",
            header: "Billing Address Line 1",
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.Line1") || "N/A",
          },
          {
            accessorKey: "BillAddr.City",
            header: "Billing Address City",
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.City") || "N/A",
          },
          {
            accessorKey: "BillAddr.Country",
            header: "Billing Address Country",
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.Country") || "N/A",
          },
          {
            accessorKey: "BillAddr.PostalCode",
            header: "Billing Address Postal Code",
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.PostalCode") || "N/A",
          },
          {
            accessorKey: "BillAddr.CountrySubDivisionCode",
            header: "Billing Address Subdivision",
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.CountrySubDivisionCode") || "N/A",
          },
          {
            accessorKey: "CurrencyRef.value",
            header: "Currency Code",
            cell: ({ row }) => getNestedValue(row.original, "CurrencyRef.value") || "N/A",
          },
        ];
        break;

      case "Vendor":
        entityColumns = [
          {
            accessorKey: "Id",
            header: "ID",
          },
          {
            accessorKey: "DisplayName",
            header: "Display Name",
          },
          {
            accessorKey: "CompanyName",
            header: "Company Name",
          },
          {
            accessorKey: "Title",
            header: "Title",
          },
          {
            accessorKey: "GivenName",
            header: "First Name",
          },
          {
            accessorKey: "FamilyName",
            header: "Last Name",
          },
          {
            accessorKey: "PrimaryEmailAddr.Address",
            header: "Email",
            cell: ({ row }) => getNestedValue(row.original, "PrimaryEmailAddr.Address") || "N/A",
          },
          {
            accessorKey: "PrimaryPhone.FreeFormNumber",
            header: "Phone",
            cell: ({ row }) => getNestedValue(row.original, "PrimaryPhone.FreeFormNumber") || "N/A",
          },
          {
            accessorKey: "BillAddr.Line1",
            header: "Billing Address Line 1",
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.Line1") || "N/A",
          },
          {
            accessorKey: "BillAddr.City",
            header: "Billing Address City",
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.City") || "N/A",
          },
          {
            accessorKey: "BillAddr.Country",
            header: "Billing Address Country",
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.Country") || "N/A",
          },
          {
            accessorKey: "BillAddr.PostalCode",
            header: "Billing Address Postal Code",
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.PostalCode") || "N/A",
          },
          {
            accessorKey: "BillAddr.CountrySubDivisionCode",
            header: "Billing Address Subdivision",
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.CountrySubDivisionCode") || "N/A",
          },
          {
            accessorKey: "CurrencyRef.value",
            header: "Currency Code",
            cell: ({ row }) => getNestedValue(row.original, "CurrencyRef.value") || "N/A",
          },
        ];
        break;

      case "Item":
        entityColumns = [
          {
            accessorKey: "Id",
            header: "ID",
          },
          {
            accessorKey: "Name",
            header: "Name",
          },
          {
            accessorKey: "Type",
            header: "Type",
          },
          {
            accessorKey: "Sku",
            header: "SKU",
          },
          {
            accessorKey: "UnitPrice",
            header: "Price",
            cell: ({ row }) => {
              const price = row.original.UnitPrice;
              return price ? `$${parseFloat(price).toFixed(2)}` : "N/A";
            },
          },
          {
            accessorKey: "IncomeAccountRef.name",
            header: "Income Account",
            cell: ({ row }) => getNestedValue(row.original, "IncomeAccountRef.name") || "N/A",
          },
          {
            accessorKey: "Description",
            header: "Description",
          },
          {
            accessorKey: "ParentRef.name",
            header: "Category",
            cell: ({ row }) => getNestedValue(row.original, "ParentRef.name") || "N/A",
          },
          {
            accessorKey: "SalesTaxCodeRef.name",
            header: "Sales Tax",
            cell: ({ row }) => getNestedValue(row.original, "SalesTaxCodeRef.name") || "N/A",
          },
        ];
        break;

      case "Account":
        entityColumns = [
          {
            accessorKey: "Id",
            header: "ID",
          },
          {
            accessorKey: "Name",
            header: "Name",
          },
          {
            accessorKey: "AccountType",
            header: "Account Type",
          },
          {
            accessorKey: "AccountSubType",
            header: "Account Subtype",
          },
          {
            accessorKey: "AcctNum",
            header: "Account Number",
          },
          {
            accessorKey: "ParentRef.name",
            header: "Parent Account",
            cell: ({ row }) => getNestedValue(row.original, "ParentRef.name") || "N/A",
          },
          {
            accessorKey: "Description",
            header: "Description",
          },
          {
            accessorKey: "CurrentBalance",
            header: "Opening Balance",
            cell: ({ row }) => {
              const balance = row.original.CurrentBalance;
              return balance !== undefined ? `$${parseFloat(balance).toFixed(2)}` : "N/A";
            },
          },
          {
            accessorKey: "CurrencyRef.value",
            header: "Currency Code",
            cell: ({ row }) => getNestedValue(row.original, "CurrencyRef.value") || "N/A",
          },
        ];
        break;

      case "Employee":
        entityColumns = [
          {
            accessorKey: "Id",
            header: "ID",
          },
          {
            accessorKey: "DisplayName",
            header: "Name",
          },
          {
            accessorKey: "HiredDate",
            header: "Hiring Date",
            cell: ({ row }) => {
              const date = row.original.HiredDate;
              return date ? new Date(date).toLocaleDateString() : "N/A";
            },
          },
          {
            accessorKey: "PrimaryPhone.FreeFormNumber",
            header: "Phone Number",
            cell: ({ row }) => getNestedValue(row.original, "PrimaryPhone.FreeFormNumber") || "N/A",
          },
          {
            accessorKey: "PrimaryAddr.Line1",
            header: "Address Line 1",
            cell: ({ row }) => getNestedValue(row.original, "PrimaryAddr.Line1") || "N/A",
          },
          {
            accessorKey: "PrimaryAddr.City",
            header: "Address City",
            cell: ({ row }) => getNestedValue(row.original, "PrimaryAddr.City") || "N/A",
          },
          {
            accessorKey: "PrimaryAddr.CountrySubDivisionCode",
            header: "Address Subdivision",
            cell: ({ row }) => getNestedValue(row.original, "PrimaryAddr.CountrySubDivisionCode") || "N/A",
          },
          {
            accessorKey: "PrimaryAddr.Country",
            header: "Address Country",
            cell: ({ row }) => getNestedValue(row.original, "PrimaryAddr.Country") || "N/A",
          },
          {
            accessorKey: "PrimaryAddr.PostalCode",
            header: "Postal Code",
            cell: ({ row }) => getNestedValue(row.original, "PrimaryAddr.PostalCode") || "N/A",
          },
        ];
        break;

      case "Department":
        entityColumns = [
          {
            accessorKey: "Id",
            header: "ID",
          },
          {
            accessorKey: "Name",
            header: "Name",
          },
          {
            accessorKey: "SubDepartment",
            header: "Is Sub-department?",
            cell: ({ row }) => (row.original.SubDepartment ? "Yes" : "No"),
          },
          {
            accessorKey: "Active",
            header: "Active",
            cell: ({ row }) => (row.original.Active ? "Yes" : "No"),
          },
        ];
        break;

      case "Class":
        entityColumns = [
          {
            accessorKey: "Id",
            header: "ID",
          },
          {
            accessorKey: "Name",
            header: "Name",
          },
          {
            accessorKey: "SubClass",
            header: "Is Sub-class?",
            cell: ({ row }) => (row.original.SubClass ? "Yes" : "No"),
          },
          {
            accessorKey: "Active",
            header: "Active",
            cell: ({ row }) => (row.original.Active ? "Yes" : "No"),
          },
        ];
        break;

      case "Invoice":
        entityColumns = [
          {
            accessorKey: "Id",
            header: "ID",
          },
          {
            accessorKey: "DocNumber",
            header: "Invoice Number",
          },
          {
            accessorKey: "CustomerRef.name",
            header: "Customer Name",
            cell: ({ row }) => getNestedValue(row.original, "CustomerRef.name") || "N/A",
          },
          {
            accessorKey: "TxnDate",
            header: "Invoice Date",
            cell: ({ row }) => {
              const date = row.original.TxnDate;
              return date ? new Date(date).toLocaleDateString() : "N/A";
            },
          },
          {
            accessorKey: "DueDate",
            header: "Due Date",
            cell: ({ row }) => {
              const date = row.original.DueDate;
              return date ? new Date(date).toLocaleDateString() : "N/A";
            },
          },
          {
            accessorKey: "EmailStatus",
            header: "Email Sent",
            cell: ({ row }) => row.original.EmailStatus || "Not Sent",
          },
          {
            accessorKey: "BillEmail.Address",
            header: "Email ID",
            cell: ({ row }) => getNestedValue(row.original, "BillEmail.Address") || "N/A",
          },
          {
            accessorKey: "Line[0].SalesItemLineDetail.ItemRef.name",
            header: "Product/Service",
            cell: ({ row }) => getNestedValue(row.original, "Line[0].SalesItemLineDetail.ItemRef.name") || "N/A",
          },
          {
            accessorKey: "BillAddr.Line1",
            header: "Billing Address Line 1",
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.Line1") || "N/A",
          },
          {
            accessorKey: "BillAddr.City",
            header: "Billing Address City",
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.City") || "N/A",
          },
          {
            accessorKey: "BillAddr.Country",
            header: "Billing Address Country",
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.Country") || "N/A",
          },
          {
            accessorKey: "BillAddr.PostalCode",
            header: "Billing Address Postal Code",
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.PostalCode") || "N/A",
          },
          {
            accessorKey: "CurrencyRef.value",
            header: "Currency Code",
            cell: ({ row }) => getNestedValue(row.original, "CurrencyRef.value") || "N/A",
          },
          {
            accessorKey: "TotalAmt",
            header: "Amount",
            cell: ({ row }) => {
              const amount = row.original.TotalAmt;
              return amount !== undefined ? `$${parseFloat(amount).toFixed(2)}` : "N/A";
            },
          },
          {
            accessorKey: "Balance",
            header: "Payment Status",
            cell: ({ row }) => {
              const balance = row.original.Balance;
              const total = row.original.TotalAmt;
              
              if (balance === 0) return "Paid";
              if (balance === total) return "Unpaid";
              if (balance < total && balance > 0) return "Partially Paid";
              return "Unknown";
            },
          },
        ];
        break;

      default:
        // Generic column setup for other entity types
        const sampleRecord = getEntityRecords()[0] || {};
        entityColumns = [
          {
            accessorKey: "Id",
            header: "ID",
          },
          {
            accessorKey: "Name",
            header: "Name",
            cell: ({ row }) => row.original.Name || row.original.DisplayName || row.original.DocNumber || "N/A",
          },
        ];
        
        // Add date fields if they exist
        if ('TxnDate' in sampleRecord) {
          entityColumns.push({
            accessorKey: "TxnDate",
            header: "Date",
            cell: ({ row }) => row.original.TxnDate ? new Date(row.original.TxnDate).toLocaleDateString() : "N/A",
          });
        }
        
        // Add amount fields if they exist
        if ('TotalAmt' in sampleRecord) {
          entityColumns.push({
            accessorKey: "TotalAmt",
            header: "Amount",
            cell: ({ row }) => {
              const amount = row.original.TotalAmt;
              return amount !== undefined ? `$${parseFloat(amount).toFixed(2)}` : "N/A";
            },
          });
        }
        
        break;
    }

    return entityColumns;
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
                <Label>Date Range (Optional)</Label>
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
              </div>
            </div>

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
            {filteredRecords.length > 0 && (
              <Button
                className="w-full flex items-center justify-center"
                onClick={handleExport}
                disabled={selectedFields.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedEntity || "Entity"} Records
              {filteredRecords.length > 0 && ` (${filteredRecords.length})`}
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
                <div className="overflow-x-auto">
                  <ScrollArea className="h-[calc(100vh-450px)]">
                    <div className="min-w-max overflow-x-auto">
                      <DataTable
                        columns={generateColumns()}
                        data={filteredRecords}
                        pageSize={10}
                        className="w-full"
                      />
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Field Selection</CardTitle>
            <CardDescription>
              Choose fields to include in export
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRecords.length > 0 ? (
              <>
                <div className="flex items-center space-x-2 py-2">
                  <Checkbox 
                    id="select-all-fields"
                    checked={selectAllFields}
                    onCheckedChange={handleSelectAllFields}
                  />
                  <Label htmlFor="select-all-fields">Select All</Label>
                </div>
                <ScrollArea className="h-[calc(100vh-450px)] pr-4">
                  <div className="space-y-2 py-2">
                    {getAvailableFields().map((field) => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox
                          id={`field-${field}`}
                          checked={selectedFields.includes(field)}
                          onCheckedChange={() => toggleFieldSelection(field)}
                        />
                        <Label 
                          htmlFor={`field-${field}`}
                          className="text-sm truncate"
                          title={field}
                        >
                          {field}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="pt-4 text-sm text-muted-foreground">
                  {selectedFields.length} of {getAvailableFields().length} fields selected
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Fetch data to select fields
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Export;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Trash2, AlertCircle, ChevronLeft, Calendar } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { logError } from "@/utils/errorLogger";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

const Delete = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAll, setSelectedAll] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const {
    selectedEntity,
    setSelectedEntity,
    selectedDateRange,
    setSelectedDateRange,
    entityState,
    fetchEntities,
    filterEntities,
    deleteSelectedEntities,
    entityOptions,
    selectedEntityIds,
    setSelectedEntityIds,
    toggleEntitySelection,
    selectAllEntities,
    isDeleting,
    deleteProgress,
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

  // Handle entity selection with explicit fetch
  const handleEntitySelect = (entity: string) => {
    setSelectedEntity(entity);
    setSelectedEntityIds([]);
    setSelectedAll(false);
    // Clear search and don't fetch automatically
    setSearchTerm("");
  };

  // Explicitly fetch data when requested by user
  const handleFetchData = async () => {
    try {
      if (!selectedEntity) {
        return;
      }
      
      await fetchEntities();
    } catch (error) {
      logError(`Error fetching ${selectedEntity} data for deletion`, {
        source: "Delete",
        stack: error instanceof Error ? error.stack : undefined,
        context: { selectedEntity }
      });
    }
  };

  // Handle search input
  const handleSearch = () => {
    if (!selectedEntity) return;
    filterEntities(searchTerm);
  };

  // Handle checkbox select all
  const handleSelectAll = (checked: boolean) => {
    setSelectedAll(checked);
    selectAllEntities(checked);
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  // Handle actual deletion
  const handleDelete = async () => {
    try {
      await deleteSelectedEntities(selectedEntityIds);
      setSelectedEntityIds([]);
      setSelectedAll(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      logError(`Error deleting ${selectedEntity} entities`, {
        source: "Delete",
        stack: error instanceof Error ? error.stack : undefined,
        context: { selectedEntity, selectedEntityIds }
      });
    }
  };

  // Navigate back to dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Generate columns for the data table
  const generateColumns = (): ColumnDef<any>[] => {
    if (!selectedEntity || !filteredRecords.length) {
      return [];
    }

    // Base columns for selection and common fields
    const baseColumns: ColumnDef<any>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={selectedAll}
            onCheckedChange={(checked) => {
              handleSelectAll(!!checked);
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
      },
      {
        accessorKey: "Id",
        header: "ID",
      },
    ];

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

    // Add entity-specific columns based on the entity type
    let entityColumns: ColumnDef<any>[] = [];

    switch (selectedEntity) {
      case "Customer":
        entityColumns = [
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
            header: formatFieldHeader("PrimaryEmailAddr.Address"),
            cell: ({ row }) => getNestedValue(row.original, "PrimaryEmailAddr.Address") || "N/A",
          },
          {
            accessorKey: "PrimaryPhone.FreeFormNumber",
            header: formatFieldHeader("PrimaryPhone.FreeFormNumber"),
            cell: ({ row }) => getNestedValue(row.original, "PrimaryPhone.FreeFormNumber") || "N/A",
          },
          {
            accessorKey: "BillAddr.Line1",
            header: formatFieldHeader("BillAddr.Line1"),
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.Line1") || "N/A",
          },
          {
            accessorKey: "BillAddr.City",
            header: formatFieldHeader("BillAddr.City"),
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.City") || "N/A",
          },
          {
            accessorKey: "BillAddr.Country",
            header: formatFieldHeader("BillAddr.Country"),
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.Country") || "N/A",
          },
          {
            accessorKey: "BillAddr.PostalCode",
            header: formatFieldHeader("BillAddr.PostalCode"),
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.PostalCode") || "N/A",
          },
          {
            accessorKey: "BillAddr.CountrySubDivisionCode",
            header: formatFieldHeader("BillAddr.CountrySubDivisionCode"),
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.CountrySubDivisionCode") || "N/A",
          },
          {
            accessorKey: "CurrencyRef.value",
            header: formatFieldHeader("CurrencyRef.value"),
            cell: ({ row }) => getNestedValue(row.original, "CurrencyRef.value") || "N/A",
          },
          {
            accessorKey: "Active",
            header: "Status",
            cell: ({ row }) => (row.original.Active === false ? "Inactive" : "Active"),
          },
        ];
        break;

      case "Vendor":
        entityColumns = [
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
            header: formatFieldHeader("PrimaryEmailAddr.Address"),
            cell: ({ row }) => getNestedValue(row.original, "PrimaryEmailAddr.Address") || "N/A",
          },
          {
            accessorKey: "PrimaryPhone.FreeFormNumber",
            header: formatFieldHeader("PrimaryPhone.FreeFormNumber"),
            cell: ({ row }) => getNestedValue(row.original, "PrimaryPhone.FreeFormNumber") || "N/A",
          },
          {
            accessorKey: "BillAddr.Line1",
            header: formatFieldHeader("BillAddr.Line1"),
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.Line1") || "N/A",
          },
          {
            accessorKey: "BillAddr.City",
            header: formatFieldHeader("BillAddr.City"),
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.City") || "N/A",
          },
          {
            accessorKey: "BillAddr.Country",
            header: formatFieldHeader("BillAddr.Country"),
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.Country") || "N/A",
          },
          {
            accessorKey: "BillAddr.PostalCode",
            header: formatFieldHeader("BillAddr.PostalCode"),
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.PostalCode") || "N/A",
          },
          {
            accessorKey: "BillAddr.CountrySubDivisionCode",
            header: formatFieldHeader("BillAddr.CountrySubDivisionCode"),
            cell: ({ row }) => getNestedValue(row.original, "BillAddr.CountrySubDivisionCode") || "N/A",
          },
          {
            accessorKey: "CurrencyRef.value",
            header: formatFieldHeader("CurrencyRef.value"),
            cell: ({ row }) => getNestedValue(row.original, "CurrencyRef.value") || "N/A",
          },
          {
            accessorKey: "Active",
            header: "Status",
            cell: ({ row }) => (row.original.Active === false ? "Inactive" : "Active"),
          },
        ];
        break;

      case "Item":
        entityColumns = [
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
            header: formatFieldHeader("IncomeAccountRef.name"),
            cell: ({ row }) => getNestedValue(row.original, "IncomeAccountRef.name") || "N/A",
          },
          {
            accessorKey: "Description",
            header: "Description",
          },
          {
            accessorKey: "SubItem",
            header: "Sub-item",
            cell: ({ row }) => (row.original.SubItem ? "Yes" : "No"),
          },
          {
            accessorKey: "SalesTaxCodeRef.name",
            header: formatFieldHeader("SalesTaxCodeRef.name"),
            cell: ({ row }) => getNestedValue(row.original, "SalesTaxCodeRef.name") || "N/A",
          },
          {
            accessorKey: "Active",
            header: "Status",
            cell: ({ row }) => (row.original.Active === false ? "Inactive" : "Active"),
          },
        ];
        break;

      // Default case for other entity types
      default:
        // Get a sample record to extract all possible fields
        const sampleRecord = filteredRecords[0];
        const fields = Object.keys(sampleRecord);
        
        // Add common display fields
        entityColumns = [
          {
            accessorKey: "DisplayName",
            header: "Name",
            cell: ({ row }) => row.original.DisplayName || row.original.Name || row.original.FullyQualifiedName || row.original.DocNumber || "N/A",
          },
        ];
        
        // Add date fields if they exist
        if (fields.includes("TxnDate")) {
          entityColumns.push({
            accessorKey: "TxnDate",
            header: formatFieldHeader("TxnDate"),
            cell: ({ row }) => {
              const date = row.original.TxnDate;
              return date ? new Date(date).toLocaleDateString() : "N/A";
            },
          });
        }
        
        // Add amount fields if they exist
        if (fields.includes("TotalAmt")) {
          entityColumns.push({
            accessorKey: "TotalAmt",
            header: formatFieldHeader("TotalAmt"),
            cell: ({ row }) => {
              const amount = row.original.TotalAmt;
              return amount !== undefined ? `$${parseFloat(amount).toFixed(2)}` : "N/A";
            },
          });
        }
        
        // Add status fields if they exist
        if (fields.includes("Active")) {
          entityColumns.push({
            accessorKey: "Active",
            header: "Status",
            cell: ({ row }) => (row.original.Active === false ? "Inactive" : "Active"),
          });
        }
        
        break;
    }

    return [...baseColumns, ...entityColumns];
  };

  return (
    <div className="container mx-auto p-4">
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        entityType={selectedEntity || ""}
        count={selectedEntityIds.length}
        isDeleting={isDeleting}
        progress={deleteProgress}
      />

      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          onClick={handleBackToDashboard} 
          className="flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-semibold">Delete QuickBooks Data</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Records to Delete</CardTitle>
          <CardDescription>
            Choose an entity type, fetch records, then select items to delete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            </>
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
          <CardTitle>
            {selectedEntity || "Entity"} Records
            {filteredRecords.length > 0 && ` (${filteredRecords.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="mt-4">Loading {selectedEntity} records...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8 text-red-500">
              <AlertCircle className="h-8 w-8" />
              <p className="mt-4">Error: {error}</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedEntity
                ? "No records found. Click 'Fetch Data' to load records."
                : "Select an entity type to get started"}
            </div>
          ) : (
            <DataTable
              columns={generateColumns()}
              data={filteredRecords}
              pageSize={10}
              className="overflow-x-auto"
            />
          )}
        </CardContent>
        {selectedEntityIds.length > 0 && (
          <CardFooter className="flex justify-between">
            <p className="text-sm text-gray-500">
              {selectedEntityIds.length} item(s) selected
            </p>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="flex items-center"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Selected
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default Delete;

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
import { Loader2, Filter, Download, FileJson, FileSpreadsheet, ChevronLeft, Calendar } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { EntityRecord } from "@/contexts/quickbooks/types"; 

const Export = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected, refreshConnection } = useQuickbooks();
  const { 
    selectedEntity,
    setSelectedEntity,
    selectedDateRange,
    setSelectedDateRange,
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Update selected date range when date picker changes
  useEffect(() => {
    if (dateRange) {
      setSelectedDateRange(dateRange);
    }
  }, [dateRange, setSelectedDateRange]);

  // State for selected fields for export
  useEffect(() => {
    if (selectedEntity && entityState[selectedEntity]?.records) {
      // Default to all fields when entity changes
      const allFields = getAvailableFields();
      setSelectedFields(allFields);
    }
  }, [selectedEntity, entityState]);

  // Get entity records with applied filters
  const getEntityRecords = (): EntityRecord[] => {
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
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Load entity data
  const loadEntityData = async () => {
    if (!selectedEntity) return;
    
    setIsLoading(true);
    try {
      await fetchEntities();
    } catch (error) {
      toast({
        title: "Error Loading Data",
        description: "Failed to load QuickBooks data. Please try again.",
        variant: "destructive",
      });
      logError(`Error loading ${selectedEntity} data`, {
        source: "Export",
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = () => {
    if (!selectedEntity) return;
    
    // Pass the search term (filterValue) as a simple string
    filterEntities(filterValue);
  };

  // Convert records to CSV - Function accepts records array and fields array
  const convertToCSV = (records: EntityRecord[], fields: string[]): string => {
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
        // Pass the records array and selectedFields array to convertToCSV
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
      // Filter to get only selected records
      const selectedData = records.filter(record => 
        selectedEntityIds.includes(record.Id)
      );

      const currentDate = format(new Date(), "yyyy-MM-dd");
      
      if (exportFormat === "csv") {
        // Pass the selectedData array and selectedFields array to convertToCSV
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
        // Export as JSON - Filter records to only include selected fields
        const filteredRecords = selectedData.map(record => {
          const filteredRecord: Record<string, any> = {};
          selectedFields.forEach(field => {
            filteredRecord[field] = record[field];
          });
          return filteredRecord;
        });
        
        const json = JSON.stringify(filteredRecords, null, 2);
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
      
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting selected data.",
        variant: "destructive",
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

  // Format field names for display
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

  // Create data table columns based on entity type
  const generateColumns = () => {
    if (!selectedEntity || !entityState[selectedEntity]?.filteredRecords?.length) {
      return [];
    }

    // Base columns for selection and ID
    const baseColumns = [
      {
        id: "select",
        header: ({ table }: any) => (
          <Checkbox
            checked={selectedEntityIds.length === getEntityRecords().length && getEntityRecords().length > 0}
            onCheckedChange={(checked) => {
              selectAllEntities(!!checked);
            }}
          />
        ),
        cell: ({ row }: any) => (
          <Checkbox
            checked={selectedEntityIds.includes(row.original.Id)}
            onCheckedChange={() => toggleEntitySelection(row.original.Id)}
          />
        ),
      },
      {
        accessorKey: "Id",
        header: "ID",
      },
    ];

    // Entity-specific columns based on entity type
    let entityColumns = [];
    
    switch (selectedEntity) {
      case "Customer":
        entityColumns = [
          { accessorKey: "DisplayName", header: "Display Name" },
          { accessorKey: "CompanyName", header: "Company Name" },
          { accessorKey: "Title", header: "Title" },
          { accessorKey: "GivenName", header: "Given Name" },
          { accessorKey: "FamilyName", header: "Family Name" },
          { accessorKey: "PrimaryEmailAddr.Address", header: "Email ID", 
            cell: ({ row }: any) => row.original.PrimaryEmailAddr?.Address || "N/A" },
          { accessorKey: "PrimaryPhone.FreeFormNumber", header: "Phone Number", 
            cell: ({ row }: any) => row.original.PrimaryPhone?.FreeFormNumber || "N/A" },
          { accessorKey: "BillAddr.Line1", header: "Billing Address Line 1", 
            cell: ({ row }: any) => row.original.BillAddr?.Line1 || "N/A" },
          { accessorKey: "BillAddr.City", header: "Billing Address City", 
            cell: ({ row }: any) => row.original.BillAddr?.City || "N/A" },
          { accessorKey: "BillAddr.Country", header: "Billing Address Country", 
            cell: ({ row }: any) => row.original.BillAddr?.Country || "N/A" },
          { accessorKey: "BillAddr.PostalCode", header: "Billing Address Postal Code", 
            cell: ({ row }: any) => row.original.BillAddr?.PostalCode || "N/A" },
          { accessorKey: "BillAddr.CountrySubDivisionCode", header: "Billing Address Subdivision", 
            cell: ({ row }: any) => row.original.BillAddr?.CountrySubDivisionCode || "N/A" },
          { accessorKey: "CurrencyRef.value", header: "Currency Code", 
            cell: ({ row }: any) => row.original.CurrencyRef?.value || "N/A" },
          { accessorKey: "Active", header: "Status", 
            cell: ({ row }: any) => row.original.Active === false ? "Inactive" : "Active" },
        ];
        break;

      case "Vendor":
        entityColumns = [
          { accessorKey: "DisplayName", header: "Display Name" },
          { accessorKey: "CompanyName", header: "Company Name" },
          { accessorKey: "Title", header: "Title" },
          { accessorKey: "GivenName", header: "Given Name" },
          { accessorKey: "FamilyName", header: "Family Name" },
          { accessorKey: "PrimaryEmailAddr.Address", header: "Email ID", 
            cell: ({ row }: any) => row.original.PrimaryEmailAddr?.Address || "N/A" },
          { accessorKey: "PrimaryPhone.FreeFormNumber", header: "Phone Number", 
            cell: ({ row }: any) => row.original.PrimaryPhone?.FreeFormNumber || "N/A" },
          { accessorKey: "BillAddr.Line1", header: "Billing Address Line 1", 
            cell: ({ row }: any) => row.original.BillAddr?.Line1 || "N/A" },
          { accessorKey: "BillAddr.City", header: "Billing Address City", 
            cell: ({ row }: any) => row.original.BillAddr?.City || "N/A" },
          { accessorKey: "BillAddr.Country", header: "Billing Address Country", 
            cell: ({ row }: any) => row.original.BillAddr?.Country || "N/A" },
          { accessorKey: "BillAddr.PostalCode", header: "Billing Address Postal Code", 
            cell: ({ row }: any) => row.original.BillAddr?.PostalCode || "N/A" },
          { accessorKey: "BillAddr.CountrySubDivisionCode", header: "Billing Address Subdivision", 
            cell: ({ row }: any) => row.original.BillAddr?.CountrySubDivisionCode || "N/A" },
          { accessorKey: "CurrencyRef.value", header: "Currency Code", 
            cell: ({ row }: any) => row.original.CurrencyRef?.value || "N/A" },
          { accessorKey: "Active", header: "Status", 
            cell: ({ row }: any) => row.original.Active === false ? "Inactive" : "Active" },
        ];
        break;

      case "Item":
        entityColumns = [
          { accessorKey: "Name", header: "Name" },
          { accessorKey: "Type", header: "Type" },
          { accessorKey: "Sku", header: "SKU" },
          { accessorKey: "UnitPrice", header: "Price", 
            cell: ({ row }: any) => {
              const price = row.original.UnitPrice;
              return price ? `$${parseFloat(price).toFixed(2)}` : "N/A";
            }
          },
          { accessorKey: "IncomeAccountRef.name", header: "Income Account", 
            cell: ({ row }: any) => row.original.IncomeAccountRef?.name || "N/A" },
          { accessorKey: "Description", header: "Description" },
          { accessorKey: "ParentRef.name", header: "Category", 
            cell: ({ row }: any) => row.original.ParentRef?.name || "N/A" },
          { accessorKey: "SalesTaxCodeRef.name", header: "Sales Tax", 
            cell: ({ row }: any) => row.original.SalesTaxCodeRef?.name || "N/A" },
          { accessorKey: "Active", header: "Status", 
            cell: ({ row }: any) => row.original.Active === false ? "Inactive" : "Active" },
        ];
        break;

      case "Account":
        entityColumns = [
          { accessorKey: "Name", header: "Name" },
          { accessorKey: "AccountType", header: "Account Type" },
          { accessorKey: "AccountSubType", header: "Account Subtype" },
          { accessorKey: "AcctNum", header: "Account Number" },
          { accessorKey: "ParentRef.name", header: "Parent Account", 
            cell: ({ row }: any) => row.original.ParentRef?.name || "N/A" },
          { accessorKey: "Description", header: "Description" },
          { accessorKey: "CurrentBalance", header: "Opening Balance", 
            cell: ({ row }: any) => {
              const balance = row.original.CurrentBalance;
              return balance ? `$${parseFloat(balance).toFixed(2)}` : "$0.00";
            }
          },
          { accessorKey: "CurrencyRef.value", header: "Currency Code", 
            cell: ({ row }: any) => row.original.CurrencyRef?.value || "N/A" },
          { accessorKey: "Active", header: "Status", 
            cell: ({ row }: any) => row.original.Active === false ? "Inactive" : "Active" },
        ];
        break;

      case "Employee":
        entityColumns = [
          { accessorKey: "DisplayName", header: "Name" },
          { accessorKey: "HiredDate", header: "Hiring Date", 
            cell: ({ row }: any) => row.original.HiredDate ? new Date(row.original.HiredDate).toLocaleDateString() : "N/A" },
          { accessorKey: "PrimaryPhone.FreeFormNumber", header: "Phone Number", 
            cell: ({ row }: any) => row.original.PrimaryPhone?.FreeFormNumber || "N/A" },
          { accessorKey: "PrimaryAddr.Line1", header: "Address Line 1", 
            cell: ({ row }: any) => row.original.PrimaryAddr?.Line1 || "N/A" },
          { accessorKey: "PrimaryAddr.City", header: "Address City", 
            cell: ({ row }: any) => row.original.PrimaryAddr?.City || "N/A" },
          { accessorKey: "PrimaryAddr.CountrySubDivisionCode", header: "Address Subdivision", 
            cell: ({ row }: any) => row.original.PrimaryAddr?.CountrySubDivisionCode || "N/A" },
          { accessorKey: "PrimaryAddr.Country", header: "Address Country", 
            cell: ({ row }: any) => row.original.PrimaryAddr?.Country || "N/A" },
          { accessorKey: "PrimaryAddr.PostalCode", header: "Postal Code", 
            cell: ({ row }: any) => row.original.PrimaryAddr?.PostalCode || "N/A" },
          { accessorKey: "Active", header: "Status", 
            cell: ({ row }: any) => row.original.Active === false ? "Inactive" : "Active" },
        ];
        break;

      case "Department":
        entityColumns = [
          { accessorKey: "Name", header: "Name" },
          { accessorKey: "SubDepartment", header: "Is Sub-department?", 
            cell: ({ row }: any) => row.original.SubDepartment ? "Yes" : "No" },
          { accessorKey: "ParentRef.name", header: "Parent Department", 
            cell: ({ row }: any) => row.original.ParentRef?.name || "N/A" },
          { accessorKey: "Active", header: "Active", 
            cell: ({ row }: any) => row.original.Active === false ? "Inactive" : "Active" },
        ];
        break;

      case "Class":
        entityColumns = [
          { accessorKey: "Name", header: "Name" },
          { accessorKey: "SubClass", header: "Is Sub-class?", 
            cell: ({ row }: any) => row.original.SubClass ? "Yes" : "No" },
          { accessorKey: "ParentRef.name", header: "Parent Class", 
            cell: ({ row }: any) => row.original.ParentRef?.name || "N/A" },
          { accessorKey: "Active", header: "Active", 
            cell: ({ row }: any) => row.original.Active === false ? "Inactive" : "Active" },
        ];
        break;

      case "Invoice":
        entityColumns = [
          { accessorKey: "DocNumber", header: "Invoice Number" },
          { accessorKey: "CustomerRef.name", header: "Customer name", 
            cell: ({ row }: any) => row.original.CustomerRef?.name || "N/A" },
          { accessorKey: "TxnDate", header: "Invoice Date", 
            cell: ({ row }: any) => row.original.TxnDate ? new Date(row.original.TxnDate).toLocaleDateString() : "N/A" },
          { accessorKey: "DueDate", header: "Due Date", 
            cell: ({ row }: any) => row.original.DueDate ? new Date(row.original.DueDate).toLocaleDateString() : "N/A" },
          { accessorKey: "EmailStatus", header: "Email Sent", 
            cell: ({ row }: any) => row.original.EmailStatus || "Not Sent" },
          { accessorKey: "BillEmail.Address", header: "Email ID", 
            cell: ({ row }: any) => row.original.BillEmail?.Address || "N/A" },
          { accessorKey: "Line[0].SalesItemLineDetail.ItemRef.name", header: "Product/Service", 
            cell: ({ row }: any) => {
              const line = row.original.Line?.find((l: any) => l.DetailType === "SalesItemLineDetail");
              return line?.SalesItemLineDetail?.ItemRef?.name || "N/A";
            }
          },
          { accessorKey: "BillAddr.Line1", header: "Billing Address Line 1", 
            cell: ({ row }: any) => row.original.BillAddr?.Line1 || "N/A" },
          { accessorKey: "BillAddr.City", header: "Billing Address City", 
            cell: ({ row }: any) => row.original.BillAddr?.City || "N/A" },
          { accessorKey: "BillAddr.Country", header: "Billing Address Country", 
            cell: ({ row }: any) => row.original.BillAddr?.Country || "N/A" },
          { accessorKey: "BillAddr.PostalCode", header: "Billing Address Postal Code", 
            cell: ({ row }: any) => row.original.BillAddr?.PostalCode || "N/A" },
          { accessorKey: "CurrencyRef.value", header: "Currency Code", 
            cell: ({ row }: any) => row.original.CurrencyRef?.value || "N/A" },
          { accessorKey: "TotalAmt", header: "Amount", 
            cell: ({ row }: any) => row.original.TotalAmt ? `$${parseFloat(row.original.TotalAmt).toFixed(2)}` : "$0.00" },
          { accessorKey: "Balance", header: "Payment Status", 
            cell: ({ row }: any) => {
              const balance = parseFloat(row.original.Balance || 0);
              const total = parseFloat(row.original.TotalAmt || 0);
              if (balance <= 0) return "Paid";
              if (balance < total) return "Partial";
              return "Unpaid";
            }
          },
        ];
        break;

      case "Estimate":
        entityColumns = [
          { accessorKey: "DocNumber", header: "Estimate Number" },
          { accessorKey: "CustomerRef.name", header: "Customer name", 
            cell: ({ row }: any) => row.original.CustomerRef?.name || "N/A" },
          { accessorKey: "TxnDate", header: "Estimate Date", 
            cell: ({ row }: any) => row.original.TxnDate ? new Date(row.original.TxnDate).toLocaleDateString() : "N/A" },
          { accessorKey: "ExpirationDate", header: "Expiration Date", 
            cell: ({ row }: any) => row.original.ExpirationDate ? new Date(row.original.ExpirationDate).toLocaleDateString() : "N/A" },
          { accessorKey: "EmailStatus", header: "Email Sent", 
            cell: ({ row }: any) => row.original.EmailStatus || "Not Sent" },
          { accessorKey: "BillEmail.Address", header: "Email ID", 
            cell: ({ row }: any) => row.original.BillEmail?.Address || "N/A" },
          { accessorKey: "Line[0].SalesItemLineDetail.ItemRef.name", header: "Product/Service", 
            cell: ({ row }: any) => {
              const line = row.original.Line?.find((l: any) => l.DetailType === "SalesItemLineDetail");
              return line?.SalesItemLineDetail?.ItemRef?.name || "N/A";
            }
          },
          { accessorKey: "BillAddr.Line1", header: "Billing Address Line 1", 
            cell: ({ row }: any) => row.original.BillAddr?.Line1 || "N/A" },
          { accessorKey: "BillAddr.City", header: "Billing Address City", 
            cell: ({ row }: any) => row.original.BillAddr?.City || "N/A" },
          { accessorKey: "BillAddr.Country", header: "Billing Address Country", 
            cell: ({ row }: any) => row.original.BillAddr?.Country || "N/A" },
          { accessorKey: "BillAddr.PostalCode", header: "Billing Address Postal Code", 
            cell: ({ row }: any) => row.original.BillAddr?.PostalCode || "N/A" },
          { accessorKey: "CurrencyRef.value", header: "Currency Code", 
            cell: ({ row }: any) => row.original.CurrencyRef?.value || "N/A" },
          { accessorKey: "TotalAmt", header: "Amount", 
            cell: ({ row }: any) => row.original.TotalAmt ? `$${parseFloat(row.original.TotalAmt).toFixed(2)}` : "$0.00" },
          { accessorKey: "TxnStatus", header: "Estimate Status", 
            cell: ({ row }: any) => row.original.TxnStatus || "N/A" },
        ];
        break;

      default:
        // Generic column setup for other entity types
        const sampleRecord = getEntityRecords()[0] || {};
        
        entityColumns = [
          { accessorKey: "DisplayName", header: "Name", 
            cell: ({ row }: any) => row.original.DisplayName || row.original.Name || row.original.FullyQualifiedName || row.original.DocNumber || "N/A" },
        ];
        
        // Add date fields if they exist
        if ('TxnDate' in sampleRecord) {
          entityColumns.push({
            accessorKey: "TxnDate",
            header: "Date",
            cell: ({ row }: any) => row.original.TxnDate ? new Date(row.original.TxnDate).toLocaleDateString() : "N/A",
          });
        }
        
        // Add amount fields if they exist
        if ('TotalAmt' in sampleRecord) {
          entityColumns.push({
            accessorKey: "TotalAmt",
            header: "Amount",
            cell: ({ row }: any) => row.original.TotalAmt ? `$${parseFloat(row.original.TotalAmt).toFixed(2)}` : "$0.00",
          });
        }
    }

    return [...baseColumns, ...entityColumns];
  };

  // Create table props for the DataTable component
  const createTableProps = () => {
    if (!selectedEntity || !entityState[selectedEntity]?.filteredRecords?.length) {
      return {
        data: [],
        columns: []
      };
    }

    return {
      columns: generateColumns(),
      data: getEntityRecords(),
      selectedIds: selectedEntityIds,
      onToggleSelect: toggleEntitySelection,
      onSelectAll: (select: boolean) => selectAllEntities(select, entityState[selectedEntity]?.filteredRecords)
    };
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="outline" 
            onClick={handleBackToDashboard} 
            className="flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold gradient-text">Export Data</h1>
        </div>
        <p className="text-gray-600 mb-6">
          Export your QuickBooks data to CSV or JSON format
        </p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Data to Export</CardTitle>
            <CardDescription>Choose an entity type and export format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Entity Type Selection */}
              <div className="flex flex-col space-y-2">
                <Label htmlFor="entity-type">Entity Type</Label>
                <Select
                  value={selectedEntity || ""}
                  onValueChange={handleEntityChange}
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

              {/* Date Range Selection */}
              <div className="flex flex-col space-y-2">
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
                {dateRange && dateRange.from && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setDateRange(undefined)}
                    size="sm"
                    className="self-end"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {selectedEntity && (
              <div className="space-y-4">
                <Button
                  onClick={loadEntityData}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Data...
                    </>
                  ) : "Fetch Data"}
                </Button>

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

                  {entityState[selectedEntity]?.records?.length > 0 && (
                    <div className="space-x-2 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadAll("csv")}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export All as CSV
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadAll("json")}
                      >
                        <FileJson className="h-4 w-4 mr-2" />
                        Export All as JSON
                      </Button>
                    </div>
                  )}
                </div>

                {showFilter && (
                  <div className="flex space-x-2 p-4 border rounded-md bg-gray-50">
                    <div className="flex-1">
                      <Input
                        placeholder="Search term..."
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleFilterChange()}
                      />
                    </div>
                    <Button
                      onClick={handleFilterChange}
                    >
                      Search
                    </Button>
                  </div>
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
                        <Button className="mt-4" onClick={loadEntityData}>
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
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 mr-4">
                          <Input
                            placeholder="Search fields..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <div className="space-x-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectAllFields(true)}
                          >
                            Select All
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectAllFields(false)}
                          >
                            Deselect All
                          </Button>
                        </div>
                      </div>

                      <div className="border rounded-md h-96 overflow-y-auto p-4">
                        <div className="space-y-2">
                          {filteredFields.length > 0 ? (
                            filteredFields.map((field) => (
                              <div key={field} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`field-${field}`}
                                  checked={selectedFields.includes(field)}
                                  onCheckedChange={() => handleFieldToggle(field)}
                                />
                                <Label htmlFor={`field-${field}`} className="cursor-pointer">
                                  {formatFieldHeader(field)}
                                </Label>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-gray-500">
                              No fields match your search.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Export;

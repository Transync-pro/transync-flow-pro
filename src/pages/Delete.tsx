import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle, XCircle, Loader2, RefreshCcw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

// Components to make the file smaller
const DeleteProgressDisplay = ({ progress }) => (
  <div className="mt-4">
    <h2 className="text-lg font-semibold mb-2">Deletion Progress</h2>
    <progress
      max={progress.total}
      value={progress.current}
      className="w-full h-4"
    />
    <p className="text-sm mt-2">
      {progress.current} of {progress.total} records processed.
    </p>
    <p className="text-sm">
      Success: {progress.success}, Failed: {progress.failed}
    </p>

    {progress.details.length > 0 && (
      <div className="mt-4">
        <h3 className="text-md font-semibold">Deletion Details</h3>
        <ul className="max-h-60 overflow-y-auto">
          {progress.details.map((detail, index) => (
            <li key={index} className="flex items-center space-x-2 py-1">
              <span className="text-sm">Record ID: {detail.id}</span>
              {detail.status === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              {detail.error && <span className="text-sm text-red-500">Error: {detail.error}</span>}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const EntityFilterSection = ({ 
  selectedEntity, 
  setSelectedEntity, 
  selectedDateRange, 
  setSelectedDateRange, 
  handleFilter, 
  entityOptions 
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    <div>
      <Label htmlFor="entity">Select Entity</Label>
      <Select onValueChange={setSelectedEntity}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an entity" />
        </SelectTrigger>
        <SelectContent>
          {entityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div>
      <Label>Select Date Range (Optional)</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDateRange?.from ? (
              selectedDateRange.to ? (
                `${format(selectedDateRange.from, "PPP")} - ${format(
                  selectedDateRange.to,
                  "PPP"
                )}`
              ) : (
                format(selectedDateRange.from, "PPP")
              )
            ) : (
              <span>Pick a date range (optional)</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="range"
            defaultMonth={selectedDateRange?.from}
            selected={selectedDateRange}
            onSelect={setSelectedDateRange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>

    <div>
      <Label htmlFor="filter">Filter Records</Label>
      <Input
        type="text"
        id="filter"
        placeholder="Filter by name, ID, or other fields"
        onChange={handleFilter}
      />
    </div>
  </div>
);

// Define column configurations for each entity type
const entityColumnConfigs = {
  Customer: [
    { key: "Id", label: "Id" },
    { key: "DisplayName", label: "Display Name" },
    { key: "CompanyName", label: "Company Name" },
    { key: "Title", label: "Title" },
    { key: "GivenName", label: "Given Name" },
    { key: "FamilyName", label: "Family Name" },
    { key: "PrimaryEmailAddr.Address", label: "Email Id" },
    { key: "PrimaryPhone.FreeFormNumber", label: "Phone Number" },
    { key: "BillAddr.Line1", label: "Billing Address Line 1" },
    { key: "BillAddr.City", label: "Billing Address City" },
    { key: "BillAddr.Country", label: "Billing Address Country" },
    { key: "BillAddr.PostalCode", label: "Billing Address Postal Code" },
    { key: "BillAddr.CountrySubDivisionCode", label: "Billing Address Subdivision" },
    { key: "CurrencyRef.value", label: "Currency Code" },
  ],
  Vendor: [
    { key: "Id", label: "Id" },
    { key: "DisplayName", label: "Display Name" },
    { key: "CompanyName", label: "Company Name" },
    { key: "Title", label: "Title" },
    { key: "GivenName", label: "Given Name" },
    { key: "FamilyName", label: "Family Name" },
    { key: "PrimaryEmailAddr.Address", label: "Email Id" },
    { key: "PrimaryPhone.FreeFormNumber", label: "Phone Number" },
    { key: "BillAddr.Line1", label: "Billing Address Line 1" },
    { key: "BillAddr.City", label: "Billing Address City" },
    { key: "BillAddr.Country", label: "Billing Address Country" },
    { key: "BillAddr.PostalCode", label: "Billing Address Postal Code" },
    { key: "BillAddr.CountrySubDivisionCode", label: "Billing Address Subdivision" },
    { key: "CurrencyRef.value", label: "Currency Code" },
  ],
  Item: [
    { key: "Id", label: "Id" },
    { key: "Name", label: "Name" },
    { key: "Type", label: "Type" },
    { key: "Sku", label: "SKU" },
    { key: "UnitPrice", label: "Price" },
    { key: "IncomeAccountRef.name", label: "Income Account" },
    { key: "Description", label: "Description" },
    { key: "SubItem", label: "Category" },
    { key: "SalesTaxCodeRef.name", label: "Sales Tax" },
  ],
  Account: [
    { key: "Id", label: "Id" },
    { key: "Name", label: "Name" },
    { key: "AccountType", label: "Account Type" },
    { key: "AccountSubType", label: "Account Subtype" },
    { key: "AcctNum", label: "Account Number" },
    { key: "ParentRef.name", label: "Parent Account" },
    { key: "Description", label: "Description" },
    { key: "CurrentBalance", label: "Opening Balance" },
    { key: "CurrencyRef.value", label: "Currency Code" },
  ],
  Employee: [
    { key: "Id", label: "Id" },
    { key: "DisplayName", label: "Name" },
    { key: "HiredDate", label: "Hiring Date" },
    { key: "PrimaryPhone.FreeFormNumber", label: "Phone Number" },
    { key: "PrimaryAddr.Line1", label: "Address Line 1" },
    { key: "PrimaryAddr.City", label: "Address City" },
    { key: "PrimaryAddr.CountrySubDivisionCode", label: "Address Subdivision" },
    { key: "PrimaryAddr.Country", label: "Address Country/State" },
    { key: "PrimaryAddr.PostalCode", label: "Postal Code" },
  ],
  Department: [
    { key: "Id", label: "Id" },
    { key: "Name", label: "Name" },
    { key: "SubDepartment", label: "Is Sub-department?" },
    { key: "Active", label: "Active" },
  ],
  Class: [
    { key: "Id", label: "Id" },
    { key: "Name", label: "Name" },
    { key: "SubClass", label: "Is Sub-class?" },
    { key: "Active", label: "Active" },
  ],
  Invoice: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Invoice Number" },
    { key: "CustomerRef.name", label: "Customer Name" },
    { key: "TxnDate", label: "Invoice Date" },
    { key: "DueDate", label: "Due Date" },
    { key: "EmailStatus", label: "Email Sent" },
    { key: "BillEmail.Address", label: "Email Id" },
    { key: "Line[0].SalesItemLineDetail.ItemRef.name", label: "Product/Service" },
    { key: "BillAddr.Line1", label: "Billing Address Line 1" },
    { key: "BillAddr.City", label: "Billing Address City" },
    { key: "BillAddr.Country", label: "Billing Address Country" },
    { key: "BillAddr.PostalCode", label: "Billing Address Postal Code" },
    { key: "CurrencyRef.value", label: "Currency Code" },
    { key: "TotalAmt", label: "Amount" },
    { key: "Balance", label: "Payment Status" },
  ],
  Estimate: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Estimate Number" },
    { key: "CustomerRef.name", label: "Customer Name" },
    { key: "TxnDate", label: "Estimate Date" },
    { key: "ExpirationDate", label: "Expiration Date" },
    { key: "EmailStatus", label: "Email Sent" },
    { key: "BillEmail.Address", label: "Email Id" },
    { key: "Line[0].SalesItemLineDetail.ItemRef.name", label: "Product/Service" },
    { key: "BillAddr.Line1", label: "Billing Address Line 1" },
    { key: "BillAddr.City", label: "Billing Address City" },
    { key: "BillAddr.Country", label: "Billing Address Country" },
    { key: "BillAddr.PostalCode", label: "Billing Address Postal Code" },
    { key: "CurrencyRef.value", label: "Currency Code" },
    { key: "TotalAmt", label: "Amount" },
    { key: "TxnStatus", label: "Estimate Status" },
  ],
  CreditMemo: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Credit Note No" },
    { key: "CustomerRef.name", label: "Customer Name" },
    { key: "TxnDate", label: "Credit Note Date" },
    { key: "EmailStatus", label: "Email Sent" },
    { key: "BillEmail.Address", label: "Email Id" },
    { key: "Line[0].SalesItemLineDetail.ItemRef.name", label: "Product/Service" },
    { key: "BillAddr.Line1", label: "Address Line 1" },
    { key: "BillAddr.City", label: "Address City" },
    { key: "BillAddr.CountrySubDivisionCode", label: "Address Subdivision" },
    { key: "BillAddr.Country", label: "Address Country" },
    { key: "BillAddr.PostalCode", label: "Address Postal Code" },
    { key: "CurrencyRef.value", label: "Currency Code" },
    { key: "TotalAmt", label: "Total Amount" },
    { key: "CustomerMemo.value", label: "Message" },
  ],
  SalesReceipt: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Sales Receipt No" },
    { key: "CustomerRef.name", label: "Customer Name" },
    { key: "TxnDate", label: "Receipt Date" },
    { key: "DepositToAccountRef.name", label: "Deposit To" },
    { key: "EmailStatus", label: "Email Sent" },
    { key: "BillEmail.Address", label: "Email Id" },
    { key: "Line[0].SalesItemLineDetail.ItemRef.name", label: "Product/Service" },
    { key: "BillAddr.Line1", label: "Billing Address Line 1" },
    { key: "BillAddr.City", label: "Billing Address City" },
    { key: "BillAddr.Country", label: "Billing Address Country" },
    { key: "BillAddr.PostalCode", label: "Billing Address Postal Code" },
    { key: "CurrencyRef.value", label: "Currency Code" },
    { key: "TotalAmt", label: "Total Amount" },
    { key: "CustomerMemo.value", label: "Description" },
  ],
  Payment: [
    { key: "Id", label: "Id" },
    { key: "PaymentRefNum", label: "Ref Number" },
    { key: "CustomerRef.name", label: "Customer Name" },
    { key: "TxnDate", label: "Payment Date" },
    { key: "PaymentMethodRef.name", label: "Payment Method" },
    { key: "Line[0].LinkedTxn[0].TxnId", label: "Invoice No" },
    { key: "DepositToAccountRef.name", label: "Deposit To Account Name" },
    { key: "CurrencyRef.value", label: "Currency Code" },
    { key: "TotalAmt", label: "Amount" },
  ],
  RefundReceipt: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Receipt Number" },
    { key: "CustomerRef.name", label: "Customer Name" },
    { key: "TxnDate", label: "Receipt Date" },
    { key: "DepositToAccountRef.name", label: "Refunded From" },
    { key: "PaymentMethodRef.name", label: "Payment Method" },
    { key: "BillEmail.Address", label: "Email Id" },
    { key: "Line[0].SalesItemLineDetail.ItemRef.name", label: "Product/Service" },
    { key: "BillAddr.Line1", label: "Billing Address Line 1" },
    { key: "BillAddr.City", label: "Billing Address City" },
    { key: "BillAddr.Country", label: "Billing Address Country" },
    { key: "BillAddr.PostalCode", label: "Billing Address Postal Code" },
    { key: "CurrencyRef.value", label: "Currency Code" },
    { key: "CustomerMemo.value", label: "Memo" },
    { key: "PrintStatus", label: "Print Status" },
  ],
  PurchaseOrder: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "PO Number" },
    { key: "VendorRef.name", label: "Supplier Name" },
    { key: "TxnDate", label: "PO Date" },
    { key: "APAccountRef.name", label: "Payment Account" },
    { key: "VendorAddr.Line1", label: "Billing Address Line 1" },
    { key: "VendorAddr.City", label: "Billing Address City" },
    { key: "VendorAddr.Country", label: "Billing Address Country" },
    { key: "VendorAddr.PostalCode", label: "Billing Address Postal Code" },
    { key: "CurrencyRef.value", label: "Currency Code" },
    { key: "TotalAmt", label: "Amount" },
  ],
  Bill: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Bill Number" },
    { key: "VendorRef.name", label: "Supplier Name" },
    { key: "TxnDate", label: "Bill Date" },
    { key: "APAccountRef.name", label: "Payment Account" },
    { key: "DueDate", label: "Due Date" },
    { key: "Line[0].ItemBasedExpenseLineDetail.ItemRef.name", label: "Product/Service" },
    { key: "VendorAddr.Line1", label: "Billing Address Line 1" },
    { key: "VendorAddr.City", label: "Billing Address City" },
    { key: "VendorAddr.Country", label: "Billing Address Country" },
    { key: "VendorAddr.PostalCode", label: "Billing Address Postal Code" },
    { key: "CurrencyRef.value", label: "Currency Code" },
    { key: "TotalAmt", label: "Total Amount" },
  ],
  VendorCredit: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Ref Number" },
    { key: "VendorRef.name", label: "Supplier Name" },
    { key: "TxnDate", label: "Credit Date" },
    { key: "APAccountRef.name", label: "Payment Account" },
    { key: "Line[0].ItemBasedExpenseLineDetail.ItemRef.name", label: "Product/Service" },
    { key: "VendorAddr.Line1", label: "Billing Address Line 1" },
    { key: "VendorAddr.City", label: "Billing Address City" },
    { key: "VendorAddr.CountrySubDivisionCode", label: "Billing Address Sub Division" },
    { key: "VendorAddr.Country", label: "Billing Address Country" },
    { key: "VendorAddr.PostalCode", label: "Billing Address Postal Code" },
    { key: "CurrencyRef.value", label: "Currency Code" },
    { key: "TotalAmt", label: "Amount" },
  ],
  Deposit: [
    { key: "Id", label: "Id" },
    { key: "PrivateNote", label: "Private Note" },
    { key: "DepositToAccountRef.name", label: "Deposit Account" },
    { key: "TxnDate", label: "Deposit Date" },
    { key: "Line[0].LinkedTxn[0].TxnId", label: "Received From" },
    { key: "Line[0].DepositLineDetail.PaymentMethodRef.name", label: "Payment Method" },
    { key: "CurrencyRef.value", label: "Currency Code" },
    { key: "TotalAmt", label: "Amount" },
  ],
  Transfer: [
    { key: "Id", label: "Id" },
    { key: "FromAccountRef.name", label: "Transfer from Account" },
    { key: "TxnDate", label: "Transfer Date" },
    { key: "ToAccountRef.name", label: "Transfer To Account" },
    { key: "PrivateNote", label: "Note" },
    { key: "CurrencyRef.value", label: "Currency Code" },
    { key: "Amount", label: "Amount" },
  ],
  JournalEntry: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Journal No" },
    { key: "PrivateNote", label: "Memo" },
    { key: "TxnDate", label: "Journal Date" },
    { key: "Line[0].AccountRef.name", label: "Account" },
  ],
};

// Component to display entity data in a table with dynamic columns
const EntityTable = ({ 
  records, 
  selectedEntity, 
  isLoading, 
  handleDeleteEntity 
}) => {
  // Get the column configuration for the selected entity
  const columns = entityColumnConfigs[selectedEntity] || [
    { key: "Id", label: "ID" },
    { key: "DisplayName", label: "Name" },
    { key: "TxnDate", label: "Date" },
  ];

  // Helper function to safely get nested property values
  const getNestedValue = (obj, path) => {
    if (!obj) return "N/A";
    
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      // Handle array notation like Line[0]
      if (key.includes('[') && key.includes(']')) {
        const arrayKey = key.split('[')[0];
        const index = parseInt(key.split('[')[1].split(']')[0]);
        
        if (!value[arrayKey] || !value[arrayKey][index]) {
          return "N/A";
        }
        
        value = value[arrayKey][index];
      } else if (value[key] === undefined || value[key] === null) {
        return "N/A";
      } else {
        value = value[key];
      }
    }
    
    // Format certain types of values
    if (typeof value === 'boolean') {
      return value ? "Yes" : "No";
    }
    
    return value.toString();
  };

  return (
    <Table>
      <TableCaption>
        {records.length > 0 
          ? `${selectedEntity} records (${records.length})`
          : `No ${selectedEntity || 'entity'} records found`
        }
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">S. No.</TableHead>
          {columns.map((column) => (
            <TableHead key={column.key}>{column.label}</TableHead>
          ))}
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={columns.length + 2} className="text-center py-8">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="mt-4">Loading {selectedEntity} records...</p>
              </div>
            </TableCell>
          </TableRow>
        ) : records.length > 0 ? (
          records.map((record, index) => (
            <TableRow key={record.Id}>
              <TableCell>{index + 1}</TableCell>
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {getNestedValue(record, column.key)}
                </TableCell>
              ))}
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete this {selectedEntity}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. The record will be deactivated in QuickBooks.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteEntity(record.Id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length + 2} className="text-center py-8 text-gray-500">
              {selectedEntity 
                ? "No records found. Select an entity type and date range above." 
                : "Please select an entity type to view records."
              }
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

const Delete = () => {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [records, setRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    details: [],
  });
  const { user } = useAuth();
  const { getAccessToken } = useQuickbooks();
  const navigate = useNavigate();
  
  // Updated entityOptions to match all the required entity types
  const entityOptions = [
    { value: "Customer", label: "Customers/Vendors" },
    { value: "Item", label: "Products & Services" },
    { value: "Account", label: "Chart of Accounts" },
    { value: "Employee", label: "Employees" },
    { value: "Department", label: "Departments/Locations" },
    { value: "Class", label: "Classes" },
    { value: "Invoice", label: "Invoices" },
    { value: "Estimate", label: "Estimates" },
    { value: "CreditMemo", label: "Credit Memos" },
    { value: "SalesReceipt", label: "Sales Receipts" },
    { value: "Payment", label: "Received Payments" },
    { value: "RefundReceipt", label: "Refund Receipts" },
    { value: "PurchaseOrder", label: "Purchase Orders" },
    { value: "Bill", label: "Bills" },
    { value: "VendorCredit", label: "Vendor Credits" },
    { value: "Deposit", label: "Bank Deposits" },
    { value: "Transfer", label: "Bank Transfers" },
    { value: "JournalEntry", label: "Journal Entries" },
  ];

  // Function to fetch entities from QuickBooks
  const fetchEntities = useCallback(async () => {
    if (!selectedEntity || !user?.id) return;

    setIsLoading(true);
    setRecords([]);
    setFilteredRecords([]);

    try {
      // Build query with date filter if date range is selected
      let query = null;
      if (selectedDateRange?.from && selectedDateRange?.to) {
        const fromDate = format(selectedDateRange.from, "yyyy-MM-dd");
        const toDate = format(selectedDateRange.to, "yyyy-MM-dd");
        
        // Different entities may have different date fields
        const dateField = selectedEntity === "Invoice" || selectedEntity === "Bill" 
          ? "TxnDate" 
          : "MetaData.CreateTime";
        
        query = `SELECT * FROM ${selectedEntity} WHERE ${dateField} >= '${fromDate}' AND ${dateField} <= '${toDate}' MAXRESULTS 1000`;
      }

      console.log("Calling quickbooks-entities edge function to fetch entities");
      
      // Call our edge function to fetch entities
      const { data, error } = await supabase.functions.invoke("quickbooks-entities", {
        body: {
          operation: "fetch",
          entityType: selectedEntity,
          userId: user.id,
          query: query
        }
      });

      if (error) {
        throw new Error(`Error invoking function: ${error.message}`);
      }
      
      if (data.error) {
        throw new Error(`Error from function: ${data.error}`);
      }

      // Extract the entities from the response
      const fetchedEntities = data.data?.QueryResponse?.[selectedEntity] || [];
      console.log(`Fetched ${fetchedEntities.length} ${selectedEntity} entities`);
      
      setRecords(fetchedEntities);
      setFilteredRecords(fetchedEntities);
      
      // Show success message
      if (fetchedEntities.length > 0) {
        toast({
          title: "Data Loaded",
          description: `Successfully loaded ${fetchedEntities.length} ${selectedEntity} records`,
        });
      } else {
        toast({
          title: "No Records Found",
          description: `No ${selectedEntity} records match your criteria`,
        });
      }
    } catch (error: any) {
      console.error("Error fetching entities:", error);
      toast({
        title: "Error",
        description: `Failed to fetch ${selectedEntity}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedEntity, selectedDateRange, user?.id]);

  // Effect to fetch records when entity and date range change
  useEffect(() => {
    if (selectedEntity) {
      fetchEntities();
    }
  }, [selectedEntity, selectedDateRange, fetchEntities]);

  const handleFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = records.filter((record) => {
      // Generic search across common fields
      return (
        (record.DisplayName && record.DisplayName.toLowerCase().includes(searchTerm)) ||
        (record.Name && record.Name.toLowerCase().includes(searchTerm)) ||
        (record.DocNumber && record.DocNumber.toLowerCase().includes(searchTerm)) ||
        (record.Id && record.Id.toLowerCase().includes(searchTerm)) ||
        JSON.stringify(record).toLowerCase().includes(searchTerm)
      );
    });
    setFilteredRecords(filtered);
  };

  const handleDeleteEntity = async (entityId: string) => {
    if (!selectedEntity || !user?.id) return false;
    
    try {
      console.log(`Attempting to delete ${selectedEntity} with ID ${entityId}`);
      
      // Call our edge function to delete the entity
      const { data, error } = await supabase.functions.invoke("quickbooks-entities", {
        body: {
          operation: "delete",
          entityType: selectedEntity,
          userId: user.id,
          id: entityId
        }
      });

      if (error) {
        throw new Error(`Error invoking function: ${error.message}`);
      }
      
      if (data.error) {
        throw new Error(`Error from function: ${data.error}`);
      }

      // Remove the deleted entity from our lists
      setRecords(records.filter(record => record.Id !== entityId));
      setFilteredRecords(filteredRecords.filter(record => record.Id !== entityId));
      
      toast({
        title: "Entity Deleted",
        description: `Successfully deleted ${selectedEntity} with ID ${entityId}`,
      });
      
      return true;
    } catch (error: any) {
      console.error(`Error deleting ${selectedEntity}:`, error);
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedEntity || filteredRecords.length === 0) return;
    
    setIsDeleting(true);
    setDeleteProgress({
      total: filteredRecords.length,
      current: 0,
      success: 0,
      failed: 0,
      details: []
    });
    
    try {
      for (let i = 0; i < filteredRecords.length; i++) {
        const record = filteredRecords[i];
        try {
          const success = await handleDeleteEntity(record.Id);
          
          if (success) {
            setDeleteProgress(prev => ({
              ...prev,
              current: i + 1,
              success: prev.success + 1,
              details: [...prev.details, { id: record.Id, status: "success" }]
            }));
          } else {
            setDeleteProgress(prev => ({
              ...prev,
              current: i + 1,
              failed: prev.failed + 1,
              details: [...prev.details, { 
                id: record.Id, 
                status: "error", 
                error: "Failed to delete" 
              }]
            }));
          }
        } catch (error: any) {
          setDeleteProgress(prev => ({
            ...prev,
            current: i + 1,
            failed: prev.failed + 1,
            details: [...prev.details, { 
              id: record.Id, 
              status: "error", 
              error: error.message 
            }]
          }));
        }
      }
      
      // Refresh the list after bulk deletion
      fetchEntities();
      
    } catch (error: any) {
      console.error("Error in bulk deletion:", error);
      toast({
        title: "Bulk Deletion Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to display entity properties safely
  const getDisplayValue = (record: any, field: string) => {
    if (!record) return "";
    
    // Handle different entity types
    switch(field) {
      case "name":
        return record.DisplayName || record.Name || record.FullyQualifiedName || "N/A";
      case "id":
        return record.Id || "N/A";
      case "date":
        return record.TxnDate || record.MetaData?.CreateTime || record.MetaData?.LastUpdatedTime || "N/A";
      default:
        return "N/A";
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">QuickBooks Records</h1>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={fetchEntities}
          disabled={isLoading || !selectedEntity}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <Card className="mb-6 p-4">
        <EntityFilterSection
          selectedEntity={selectedEntity}
          setSelectedEntity={setSelectedEntity}
          selectedDateRange={selectedDateRange}
          setSelectedDateRange={setSelectedDateRange}
          handleFilter={handleFilter}
          entityOptions={entityOptions}
        />
      </Card>

      <div className="mb-4 overflow-x-auto">
        <EntityTable 
          records={filteredRecords} 
          selectedEntity={selectedEntity} 
          isLoading={isLoading} 
          handleDeleteEntity={handleDeleteEntity}
        />
      </div>

      {filteredRecords.length > 0 && (
        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isDeleting || filteredRecords.length === 0}
              >
                Delete All Records
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you absolutely sure you want to delete these records?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All {filteredRecords.length} records will be
                  permanently deactivated in QuickBooks.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSelected} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete All"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {isDeleting && <DeleteProgressDisplay progress={deleteProgress} />}
    </div>
  );
};

export default Delete;

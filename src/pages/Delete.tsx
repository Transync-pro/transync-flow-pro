import { useState, useEffect } from "react";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

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

// Add a debug component at the top of the file
const DebugContext = () => {
  const context = useQuickbooksEntities();
  
  useEffect(() => {
    console.log("QuickbooksEntitiesContext in Delete.tsx:", context);
    console.log("entityOptions:", context.entityOptions);
    console.log("selectedEntity:", context.selectedEntity);
    console.log("entityState:", context.entityState);
  }, [context]);
  
  return null;
};

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
      <Select value={selectedEntity || ""} onValueChange={setSelectedEntity}>
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
    { key: "AccountSubType", label: "Account Sub Type" },
    { key: "Description", label: "Description" },
    { key: "CurrencyRef.value", label: "Currency Code" },
    { key: "CurrentBalance", label: "Current Balance" },
    { key: "Active", label: "Active" },
  ],
  Employee: [
    { key: "Id", label: "Id" },
    { key: "DisplayName", label: "Display Name" },
    { key: "Title", label: "Title" },
    { key: "GivenName", label: "Given Name" },
    { key: "FamilyName", label: "Family Name" },
    { key: "PrimaryEmailAddr.Address", label: "Email Id" },
    { key: "PrimaryPhone.FreeFormNumber", label: "Phone Number" },
    { key: "Active", label: "Active" },
  ],
  Department: [
    { key: "Id", label: "Id" },
    { key: "Name", label: "Name" },
    { key: "SubDepartment", label: "Sub Department" },
    { key: "ParentRef.name", label: "Parent Department" },
    { key: "Active", label: "Active" },
  ],
  Class: [
    { key: "Id", label: "Id" },
    { key: "Name", label: "Name" },
    { key: "SubClass", label: "Sub Class" },
    { key: "ParentRef.name", label: "Parent Class" },
    { key: "Active", label: "Active" },
  ],
  Invoice: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Invoice Number" },
    { key: "CustomerRef.name", label: "Customer Name" },
    { key: "TxnDate", label: "Invoice Date" },
    { key: "DueDate", label: "Due Date" },
    { key: "TotalAmt", label: "Total Amount" },
    { key: "Balance", label: "Balance" },
    { key: "CurrencyRef.value", label: "Currency Code" },
    { key: "BillEmail.Address", label: "Bill Email" },
  ],
  Estimate: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Estimate Number" },
    { key: "CustomerRef.name", label: "Customer Name" },
    { key: "TxnDate", label: "Estimate Date" },
    { key: "TotalAmt", label: "Total Amount" },
    { key: "CurrencyRef.value", label: "Currency Code" },
    { key: "BillEmail.Address", label: "Bill Email" },
  ],
  CreditMemo: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Credit Memo Number" },
    { key: "CustomerRef.name", label: "Customer Name" },
    { key: "TxnDate", label: "Credit Memo Date" },
    { key: "TotalAmt", label: "Total Amount" },
    { key: "RemainingCredit", label: "Remaining Credit" },
    { key: "CurrencyRef.value", label: "Currency Code" },
  ],
  SalesReceipt: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Sales Receipt Number" },
    { key: "CustomerRef.name", label: "Customer Name" },
    { key: "TxnDate", label: "Sales Receipt Date" },
    { key: "TotalAmt", label: "Total Amount" },
    { key: "CurrencyRef.value", label: "Currency Code" },
  ],
  Payment: [
    { key: "Id", label: "Id" },
    { key: "TotalAmt", label: "Total Amount" },
    { key: "CustomerRef.name", label: "Customer Name" },
    { key: "TxnDate", label: "Payment Date" },
    { key: "PaymentMethodRef.name", label: "Payment Method" },
    { key: "CurrencyRef.value", label: "Currency Code" },
  ],
  RefundReceipt: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Refund Receipt Number" },
    { key: "CustomerRef.name", label: "Customer Name" },
    { key: "TxnDate", label: "Refund Date" },
    { key: "TotalAmt", label: "Total Amount" },
    { key: "PaymentMethodRef.name", label: "Payment Method" },
    { key: "CurrencyRef.value", label: "Currency Code" },
  ],
  PurchaseOrder: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Purchase Order Number" },
    { key: "VendorRef.name", label: "Supplier Name" },
    { key: "TxnDate", label: "Purchase Order Date" },
    { key: "TotalAmt", label: "Total Amount" },
    { key: "CurrencyRef.value", label: "Currency Code" },
  ],
  Bill: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Bill Number" },
    { key: "VendorRef.name", label: "Supplier Name" },
    { key: "TxnDate", label: "Bill Date" },
    { key: "DueDate", label: "Due Date" },
    { key: "TotalAmt", label: "Total Amount" },
    { key: "Balance", label: "Balance" },
    { key: "CurrencyRef.value", label: "Currency Code" },
  ],
  VendorCredit: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Vendor Credit Number" },
    { key: "VendorRef.name", label: "Supplier Name" },
    { key: "TxnDate", label: "Vendor Credit Date" },
    { key: "TotalAmt", label: "Total Amount" },
    { key: "RemainingCredit", label: "Remaining Credit" },
    { key: "CurrencyRef.value", label: "Currency Code" },
  ],
  Deposit: [
    { key: "Id", label: "Id" },
    { key: "DepositToAccountRef.name", label: "Deposit To Account" },
    { key: "TxnDate", label: "Deposit Date" },
    { key: "TotalAmt", label: "Total Amount" },
    { key: "CurrencyRef.value", label: "Currency Code" },
  ],
  Transfer: [
    { key: "Id", label: "Id" },
    { key: "FromAccountRef.name", label: "From Account" },
    { key: "ToAccountRef.name", label: "To Account" },
    { key: "TxnDate", label: "Transfer Date" },
    { key: "Amount", label: "Amount" },
    { key: "CurrencyRef.value", label: "Currency Code" },
  ],
  JournalEntry: [
    { key: "Id", label: "Id" },
    { key: "DocNumber", label: "Journal Entry Number" },
    { key: "TxnDate", label: "Journal Entry Date" },
    { key: "TotalAmt", label: "Total Amount" },
    { key: "CurrencyRef.value", label: "Currency Code" },
  ],
};

// Component to display entity data in a table with dynamic columns
const EntityTable = ({ 
  records, 
  selectedEntity, 
  isLoading, 
  handleDeleteEntity,
  selectedIds,
  toggleSelection,
  selectAll,
  allSelected
}) => {
  // Get the column configuration for the selected entity
  const columns = entityColumnConfigs[selectedEntity] || [
    { key: "Id", label: "ID" },
    { key: "DisplayName", label: "Name" },
    { key: "TxnDate", label: "Date" },
  ];

  // Use the getNestedValue from the context
  const { getNestedValue } = useQuickbooksEntities();

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
          <TableHead className="w-[50px]">
            <Checkbox 
              checked={allSelected} 
              onCheckedChange={selectAll}
              disabled={records.length === 0 || isLoading}
            />
          </TableHead>
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
            <TableCell colSpan={columns.length + 3} className="text-center py-8">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="mt-4">Loading {selectedEntity} records...</p>
              </div>
            </TableCell>
          </TableRow>
        ) : records.length > 0 ? (
          records.map((record, index) => (
            <TableRow key={record.Id}>
              <TableCell>
                <Checkbox 
                  checked={selectedIds.includes(record.Id)}
                  onCheckedChange={() => toggleSelection(record.Id)}
                />
              </TableCell>
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
            <TableCell colSpan={columns.length + 3} className="text-center py-8 text-gray-500">
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
  const { user } = useAuth();
  const { getAccessToken } = useQuickbooks();
  
  // Use the QuickbooksEntitiesContext
  const { 
    selectedEntity, 
    setSelectedEntity,
    selectedDateRange,
    setSelectedDateRange,
    entityState,
    fetchEntities,
    filterEntities,
    deleteEntity,
    deleteSelectedEntities,
    selectedEntityIds,
    setSelectedEntityIds,
    toggleEntitySelection,
    selectAllEntities,
    deleteProgress,
    isDeleting,
    entityOptions
  } = useQuickbooksEntities();
  
  // Add the debug component
  <DebugContext />
  
  // Add the test component
  <ContextDebugDisplay />
  
  // Handler for filtering entities
  const handleFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    filterEntities(e.target.value);
  };

  // Get the current entity state
  const currentEntityState = selectedEntity ? entityState[selectedEntity] : null;
  const records = currentEntityState?.filteredRecords || [];
  const isLoading = currentEntityState?.isLoading || false;

  // Check if all entities are selected
  const allSelected = records.length > 0 && selectedEntityIds.length === records.length;

  return (
    <div className="container mx-auto p-4">
      {/* VERY OBVIOUS TEST BANNER - REMOVE AFTER TESTING */}
      <div className="bg-red-500 text-white p-6 mb-6 text-center text-xl font-bold rounded-lg">
        THIS IS A TEST BANNER - IF YOU CAN SEE THIS, THE DEPLOYMENT IS WORKING
        <div className="mt-2 text-sm">
          Current time: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">QuickBooks Records</h1>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => fetchEntities()}
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
          records={records} 
          selectedEntity={selectedEntity} 
          isLoading={isLoading} 
          handleDeleteEntity={deleteEntity}
          selectedIds={selectedEntityIds}
          toggleSelection={toggleEntitySelection}
          selectAll={(checked) => selectAllEntities(!!checked)}
          allSelected={allSelected}
        />
      </div>

      {selectedEntityIds.length > 0 && (
        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isDeleting || selectedEntityIds.length === 0}
              >
                Delete Selected Records ({selectedEntityIds.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you absolutely sure you want to delete these records?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. {selectedEntityIds.length} records will be
                  permanently deactivated in QuickBooks.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteSelectedEntities(selectedEntityIds)} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete Selected"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {records.length > 0 && selectedEntityIds.length === 0 && (
        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isDeleting || records.length === 0}
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
                  This action cannot be undone. All {records.length} records will be
                  permanently deactivated in QuickBooks.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    selectAllEntities(true);
                    deleteSelectedEntities(records.map(record => record.Id));
                  }} 
                  disabled={isDeleting}
                >
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


import { getNestedValue } from "./entityUtils";
import { EntityOption } from "./types";
import { entityColumns } from "./entityColumns";
import { formatUtils } from "./formatUtils";

// Get entity options for dropdowns
export const getEntityOptions = (): EntityOption[] => {
  return [
    // Customers & Sales
    { value: "Customer", label: "Customers", group: "Customers & Sales" },
    { value: "Invoice", label: "Invoices", group: "Customers & Sales" },
    { value: "Payment", label: "Payments", group: "Customers & Sales" },
    { value: "SalesReceipt", label: "Sales Receipts", group: "Customers & Sales" },
    { value: "CreditMemo", label: "Credit Memos", group: "Customers & Sales" },
    { value: "RefundReceipt", label: "Refund Receipts", group: "Customers & Sales" },
    { value: "Estimate", label: "Estimates", group: "Customers & Sales" },
    
    // Vendors & Expenses
    { value: "Vendor", label: "Vendors", group: "Vendors & Expenses" },
    { value: "Bill", label: "Bills", group: "Vendors & Expenses" },
    { value: "Purchase", label: "Purchases", group: "Vendors & Expenses" },
    { value: "Check", label: "Checks", group: "Vendors & Expenses" },
    { value: "VendorCredit", label: "Vendor Credits", group: "Vendors & Expenses" },
    
    // Products & Services
    { value: "Item", label: "Products & Services", group: "Products & Services" },
    
    // Accounting
    { value: "Account", label: "Chart of Accounts", group: "Accounting" },
    { value: "JournalEntry", label: "Journal Entries", group: "Accounting" },
    { value: "Transfer", label: "Transfers", group: "Accounting" },
  ];
};

// Export the entity columns
export const getEntityColumns = entityColumns.getEntityColumns;

// Export the formatDisplayName and getNestedValue
export const formatDisplayName = formatUtils.formatDisplayName;
export { getNestedValue };

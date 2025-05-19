import { getNestedValue } from "./entityUtils";
import { EntityOption, EntityColumnConfig } from "./types";

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
    { value: "CreditCardCredit", label: "Credit Card Credits", group: "Vendors & Expenses" },
    { value: "VendorCredit", label: "Vendor Credits", group: "Vendors & Expenses" },
    
    // Products & Services
    { value: "Item", label: "Products & Services", group: "Products & Services" },
    
    // Accounting
    { value: "Account", label: "Chart of Accounts", group: "Accounting" },
    { value: "JournalEntry", label: "Journal Entries", group: "Accounting" },
    { value: "TaxPayment", label: "Tax Payments", group: "Accounting" },
    { value: "Transfer", label: "Transfers", group: "Accounting" },
  ];
};

// Format a display name from a field name
export const formatDisplayName = (field: string): string => {
  if (field.includes('.')) {
    const parts = field.split('.');
    return parts.map(part => formatDisplayName(part)).join(' - ');
  }
  
  // Handle special cases
  if (field === 'Id') return 'ID';
  if (field === 'TxnDate') return 'Transaction Date';
  if (field === 'DueDate') return 'Due Date';
  if (field === 'TotalAmt') return 'Total Amount';
  if (field === 'DocNumber') return 'Document Number';
  if (field === 'EmailAddr') return 'Email Address';
  if (field === 'PrimaryPhone') return 'Phone Number';
  if (field === 'PrimaryEmailAddr') return 'Email Address';
  if (field === 'BillAddr') return 'Billing Address';
  if (field === 'ShipAddr') return 'Shipping Address';
  
  // Convert camelCase to words with spaces
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

// Get column configurations for different entity types
export const getEntityColumns = (entityType: string): EntityColumnConfig[] => {
  const commonColumns: EntityColumnConfig[] = [
    { field: 'Id', header: 'ID' },
    { field: 'MetaData.CreateTime', header: 'Created Date' },
    { field: 'MetaData.LastUpdatedTime', header: 'Last Modified' }
  ];
  
  const entitySpecificColumns: Record<string, EntityColumnConfig[]> = {
    Customer: [
      { field: 'DisplayName', header: 'Display Name' },
      { field: 'GivenName', header: 'First Name' },
      { field: 'FamilyName', header: 'Last Name' },
      { field: 'CompanyName', header: 'Company' },
      { field: 'PrimaryEmailAddr.Address', header: 'Email' },
      { field: 'PrimaryPhone.FreeFormNumber', header: 'Phone' },
      { field: 'BillAddr.Line1', header: 'Billing Address' },
      { field: 'BillAddr.City', header: 'City' },
      { field: 'BillAddr.CountrySubDivisionCode', header: 'State' },
      { field: 'BillAddr.PostalCode', header: 'Zip Code' },
      { field: 'Balance', header: 'Balance' },
      { field: 'Active', header: 'Active' }
    ],
    Invoice: [
      { field: 'DocNumber', header: 'Invoice #' },
      { field: 'CustomerRef.name', header: 'Customer' },
      { field: 'TxnDate', header: 'Date' },
      { field: 'DueDate', header: 'Due Date' },
      { field: 'TotalAmt', header: 'Total' },
      { field: 'Balance', header: 'Balance' },
      { field: 'PrivateNote', header: 'Memo' }
    ],
    Payment: [
      { field: 'TxnDate', header: 'Payment Date' },
      { field: 'CustomerRef.name', header: 'Customer' },
      { field: 'TotalAmt', header: 'Amount' },
      { field: 'PaymentRefNum', header: 'Reference Number' },
      { field: 'PaymentMethodRef.name', header: 'Payment Method' }
    ],
    Vendor: [
      { field: 'DisplayName', header: 'Display Name' },
      { field: 'CompanyName', header: 'Company Name' },
      { field: 'PrimaryEmailAddr.Address', header: 'Email' },
      { field: 'PrimaryPhone.FreeFormNumber', header: 'Phone' },
      { field: 'WebAddr.URI', header: 'Website' },
      { field: 'BillAddr.Line1', header: 'Billing Address' },
      { field: 'BillAddr.City', header: 'City' },
      { field: 'BillAddr.CountrySubDivisionCode', header: 'State' },
      { field: 'BillAddr.PostalCode', header: 'Zip Code' },
      { field: 'Balance', header: 'Balance' },
      { field: 'Active', header: 'Active' }
    ],
    Bill: [
      { field: 'DocNumber', header: 'Bill #' },
      { field: 'VendorRef.name', header: 'Vendor' },
      { field: 'TxnDate', header: 'Date' },
      { field: 'DueDate', header: 'Due Date' },
      { field: 'TotalAmt', header: 'Total' },
      { field: 'Balance', header: 'Balance' }
    ],
    Purchase: [
      { field: 'PaymentType', header: 'Payment Type' },
      { field: 'AccountRef.name', header: 'Account' },
      { field: 'EntityRef.name', header: 'Payee' },
      { field: 'TxnDate', header: 'Date' },
      { field: 'TotalAmt', header: 'Total Amount' },
      { field: 'DocNumber', header: 'Reference Number' }
    ],
    Check: [
      { field: 'DocNumber', header: 'Check Number' },
      { field: 'EntityRef.name', header: 'Payee' },
      { field: 'AccountRef.name', header: 'Bank Account' },
      { field: 'TxnDate', header: 'Date' },
      { field: 'TotalAmt', header: 'Amount' }
    ],
    CreditCardCredit: [
      { field: 'AccountRef.name', header: 'Credit Card Account' },
      { field: 'EntityRef.name', header: 'Vendor' },
      { field: 'TxnDate', header: 'Date' },
      { field: 'TotalAmt', header: 'Credit Amount' },
      { field: 'DocNumber', header: 'Reference Number' }
    ],
    Item: [
      { field: 'Name', header: 'Name' },
      { field: 'Description', header: 'Description' },
      { field: 'Type', header: 'Type' },
      { field: 'UnitPrice', header: 'Price' },
      { field: 'PurchaseCost', header: 'Cost' },
      { field: 'IncomeAccountRef.name', header: 'Income Account' },
      { field: 'ExpenseAccountRef.name', header: 'Expense Account' },
      { field: 'Active', header: 'Active' }
    ],
    Account: [
      { field: 'Name', header: 'Name' },
      { field: 'AccountType', header: 'Account Type' },
      { field: 'AccountSubType', header: 'Detail Type' },
      { field: 'CurrentBalance', header: 'Current Balance' },
      { field: 'Description', header: 'Description' },
      { field: 'Active', header: 'Active' }
    ]
  };
  
  // Fallback to base entity type for specialized entities
  const columns = entitySpecificColumns[entityType] || 
                  (entityType === 'CreditCardCredit' || entityType === 'Check' ? 
                   entitySpecificColumns['Purchase'] : []);
  
  return [...columns, ...commonColumns];
};

// Re-export getNestedValue from entityUtils to maintain compatibility
export { getNestedValue };

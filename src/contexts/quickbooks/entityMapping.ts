import { getNestedValue } from "./entityUtils";
import { EntityOption, EntityColumnConfig } from "./types";

// Get entity options for dropdowns
export const getEntityOptions = (): EntityOption[] => {
  return [
    // Customers & Sales
    { value: "Customer", label: "Customers" },
    { value: "Invoice", label: "Invoices" },
    { value: "Payment", label: "Payments" },
    { value: "SalesReceipt", label: "Sales Receipts" },
    { value: "CreditMemo", label: "Credit Memos" },
    { value: "RefundReceipt", label: "Refund Receipts" },
    { value: "Estimate", label: "Estimates" },
    
    // Vendors & Expenses
    { value: "Vendor", label: "Vendors" },
    { value: "Bill", label: "Bills" },
    { value: "Purchase", label: "Purchases" },
    { value: "Check", label: "Checks" },
    { value: "VendorCredit", label: "Vendor Credits" },
    
    // Products & Services
    { value: "Item", label: "Products & Services" },
    
    // Accounting
    { value: "Account", label: "Chart of Accounts" },
    { value: "JournalEntry", label: "Journal Entries" },
    { value: "Transfer", label: "Transfers" },
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
  if (field === 'CustomerRef.name') return 'Customer';
  if (field === 'VendorRef.name') return 'Vendor';
  if (field === 'AccountRef.name') return 'Account';
  if (field === 'FromAccountRef.name') return 'From Account';
  if (field === 'ToAccountRef.name') return 'To Account';
  if (field === 'PaymentMethodRef.name') return 'Payment Method';
  if (field === 'Line') return 'Line Items';
  if (field === 'PrivateNote') return 'Memo';
  if (field === 'PaymentRefNum') return 'Reference Number';
  if (field === 'BillEmail.Address') return 'Email Address';
  if (field === 'DocNumber') return 'Document Number';
  if (field === 'ExpirationDate') return 'Expiration Date';
  if (field === 'EmailStatus') return 'Email Sent';
  if (field === 'Line[0].SalesItemLineDetail.ItemRef.name') return 'Product/Service';
  if (field === 'CurrencyRef.value') return 'Currency Code';
  if (field === 'BillAddr.Line1') return 'Billing Address Line 1';
  if (field === 'BillAddr.City') return 'Billing Address City';
  if (field === 'BillAddr.Country') return 'Billing Address Country';
  if (field === 'BillAddr.PostalCode') return 'Billing Address Postal Code';
  
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
    SalesReceipt: [
      { field: 'DocNumber', header: 'Receipt #' },
      { field: 'CustomerRef.name', header: 'Customer' },
      { field: 'TxnDate', header: 'Date' },
      { field: 'TotalAmt', header: 'Total' },
      { field: 'PaymentMethodRef.name', header: 'Payment Method' },
      { field: 'PrivateNote', header: 'Memo' },
      { field: 'Line[0].Description', header: 'Description' }
    ],
    CreditMemo: [
      { field: 'DocNumber', header: 'Credit Memo #' },
      { field: 'CustomerRef.name', header: 'Customer' },
      { field: 'TxnDate', header: 'Date' },
      { field: 'TotalAmt', header: 'Amount' },
      { field: 'RemainingCredit', header: 'Remaining Credit' },
      { field: 'PrivateNote', header: 'Memo' }
    ],
    RefundReceipt: [
      { field: 'DocNumber', header: 'Refund #' },
      { field: 'CustomerRef.name', header: 'Customer' },
      { field: 'TxnDate', header: 'Date' },
      { field: 'TotalAmt', header: 'Amount' },
      { field: 'PaymentMethodRef.name', header: 'Payment Method' },
      { field: 'PrivateNote', header: 'Memo' },
      { field: 'DepositToAccountRef.name', header: 'Deposit Account' }
    ],
    // Updated Estimate entity with all requested fields
    Estimate: [
      { field: 'DocNumber', header: 'Estimate Number' },
      { field: 'CustomerRef.name', header: 'Customer' },
      { field: 'TxnDate', header: 'Estimate Date' },
      { field: 'ExpirationDate', header: 'Expiration Date' },
      { field: 'EmailStatus', header: 'Email Sent' },
      { field: 'BillEmail.Address', header: 'Email Id' },
      { field: 'Line[0].SalesItemLineDetail.ItemRef.name', header: 'Product/Service' },
      { field: 'BillAddr.Line1', header: 'Billing Address Line 1' },
      { field: 'BillAddr.City', header: 'Billing Address City' },
      { field: 'BillAddr.Country', header: 'Billing Address Country' },
      { field: 'BillAddr.PostalCode', header: 'Billing Address Postal Code' },
      { field: 'CurrencyRef.value', header: 'Currency Code' },
      { field: 'TotalAmt', header: 'Amount' },
      { field: 'TxnStatus', header: 'Estimate Status' }
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
      { field: 'TotalAmt', header: 'Amount' },
      { field: 'PrivateNote', header: 'Memo' }
    ],
    VendorCredit: [
      { field: 'DocNumber', header: 'Credit #' },
      { field: 'VendorRef.name', header: 'Vendor' },
      { field: 'TxnDate', header: 'Date' },
      { field: 'TotalAmt', header: 'Credit Amount' },
      { field: 'RemainingCredit', header: 'Remaining Credit' },
      { field: 'PrivateNote', header: 'Memo' },
      { field: 'Line[0].Description', header: 'Description' }
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
    ],
    JournalEntry: [
      { field: 'DocNumber', header: 'Journal #' },
      { field: 'TxnDate', header: 'Date' },
      { field: 'TotalAmt', header: 'Amount' },
      { field: 'PrivateNote', header: 'Memo' },
      { field: 'Line[0].Description', header: 'Line Description' },
      { field: 'Line[0].AccountRef.name', header: 'Main Account' },
      { field: 'Adjustment', header: 'Is Adjustment' }
    ],
    Transfer: [
      { field: 'TxnDate', header: 'Date' },
      { field: 'FromAccountRef.name', header: 'From Account' },
      { field: 'ToAccountRef.name', header: 'To Account' },
      { field: 'Amount', header: 'Amount' },
      { field: 'PrivateNote', header: 'Memo' }
    ]
  };
  
  // Fallback to base entity type for specialized entities
  const columns = entitySpecificColumns[entityType] || [];
  
  return [...columns, ...commonColumns];
};

// Re-export getNestedValue from entityUtils to maintain compatibility
export { getNestedValue };

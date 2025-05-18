import { EntityOption, EntityColumnConfig } from "./types";

export const getEntityOptions = (): EntityOption[] => {
  return [
    { value: "Customer", label: "Customers" },
    { value: "Vendor", label: "Vendors" },
    { value: "Item", label: "Products & Services" },
    { value: "Account", label: "Chart of Accounts" },
    { value: "Employee", label: "Employees" },
    { value: "Department", label: "Departments" },
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
    { value: "Check", label: "Checks" },
    { value: "CreditCardCredit", label: "Credit Card Credits" }
  ];
};

// Helper function to get nested values from objects
export const getNestedValue = (obj: any, path: string): any => {
  if (!obj || !path) return "";
  
  // For array notation (e.g., "Line[0].Amount")
  if (path.includes('[') && path.includes(']')) {
    const matches = path.match(/(.+?)\[(\d+)\]\.?(.+)?/);
    if (matches) {
      const [_, arrayPath, index, remainingPath] = matches;
      const array = getNestedValue(obj, arrayPath);
      if (Array.isArray(array) && array.length > parseInt(index)) {
        if (remainingPath) {
          return getNestedValue(array[parseInt(index)], remainingPath);
        }
        return array[parseInt(index)];
      }
      return "";
    }
  }
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || !result.hasOwnProperty(key)) {
      return "";
    }
    result = result[key];
  }
  
  // Convert complex objects to strings (fixes React error #31)
  if (typeof result === 'object' && result !== null) {
    if (Array.isArray(result)) {
      return result.map(item => typeof item === 'object' ? JSON.stringify(item) : item).join(', ');
    }
    return JSON.stringify(result);
  }
  
  return result;
};

// Maps entity types to their column configurations
export const getEntityColumns = (entityType: string): EntityColumnConfig[] => {
  const columns: Record<string, EntityColumnConfig[]> = {
    "Customer": [
      { field: "Id", header: "Id" },
      { field: "DisplayName", header: "Display Name" },
      { field: "CompanyName", header: "Company Name" },
      { field: "Title", header: "Title" },
      { field: "GivenName", header: "Given Name" },
      { field: "FamilyName", header: "Family Name" },
      { field: "PrimaryEmailAddr.Address", header: "Email Id" },
      { field: "PrimaryPhone.FreeFormNumber", header: "Phone Number" },
      { field: "BillAddr.Line1", header: "Billing Address Line 1" },
      { field: "BillAddr.City", header: "Billing Address City" },
      { field: "BillAddr.Country", header: "Billing Address Country" },
      { field: "BillAddr.PostalCode", header: "Billing Address Postal Code" },
      { field: "BillAddr.CountrySubDivisionCode", header: "Billing Address Subdivision" },
      { field: "CurrencyRef.value", header: "Currency Code" }
    ],
    "Vendor": [
      { field: "Id", header: "Id" },
      { field: "DisplayName", header: "Display Name" },
      { field: "CompanyName", header: "Company Name" },
      { field: "Title", header: "Title" },
      { field: "GivenName", header: "Given Name" },
      { field: "FamilyName", header: "Family Name" },
      { field: "PrimaryEmailAddr.Address", header: "Email Id" },
      { field: "PrimaryPhone.FreeFormNumber", header: "Phone Number" },
      { field: "BillAddr.Line1", header: "Billing Address Line 1" },
      { field: "BillAddr.City", header: "Billing Address City" },
      { field: "BillAddr.Country", header: "Billing Address Country" },
      { field: "BillAddr.PostalCode", header: "Billing Address Postal Code" },
      { field: "BillAddr.CountrySubDivisionCode", header: "Billing Address Subdivision" },
      { field: "CurrencyRef.value", header: "Currency Code" }
    ],
    "Item": [
      { field: "Id", header: "Id" },
      { field: "Name", header: "Name" },
      { field: "Type", header: "Type" },
      { field: "Sku", header: "SKU" },
      { field: "UnitPrice", header: "Price" },
      { field: "IncomeAccountRef.name", header: "Income Account" },
      { field: "Description", header: "Description" },
      { field: "ParentRef.name", header: "Category" },
      { field: "SalesTaxCodeRef.name", header: "Sales Tax" }
    ],
    "Account": [
      { field: "Id", header: "Id" },
      { field: "Name", header: "Name" },
      { field: "AccountType", header: "Account Type" },
      { field: "AccountSubType", header: "Account Subtype" },
      { field: "AcctNum", header: "Account Number" },
      { field: "ParentRef.name", header: "Parent Account" },
      { field: "Description", header: "Description" },
      { field: "CurrentBalance", header: "Opening Balance" },
      { field: "CurrencyRef.value", header: "Currency Code" }
    ],
    "Employee": [
      { field: "Id", header: "Id" },
      { field: "DisplayName", header: "Name" },
      { field: "HiredDate", header: "Hiring Date" },
      { field: "PrimaryPhone.FreeFormNumber", header: "Phone Number" },
      { field: "PrimaryAddr.Line1", header: "Address Line 1" },
      { field: "PrimaryAddr.City", header: "Address City" },
      { field: "PrimaryAddr.CountrySubDivisionCode", header: "Address Subdivision" },
      { field: "PrimaryAddr.Country", header: "Address Country/State" },
      { field: "PrimaryAddr.PostalCode", header: "Postal Code" }
    ],
    "Department": [
      { field: "Id", header: "Id" },
      { field: "Name", header: "Name" },
      { field: "SubDepartment", header: "Is Sub-department?" },
      { field: "Active", header: "Active" }
    ],
    "Class": [
      { field: "Id", header: "Id" },
      { field: "Name", header: "Name" },
      { field: "SubClass", header: "Is Sub-class?" },
      { field: "Active", header: "Active" }
    ],
    "Invoice": [
      { field: "Id", header: "Id" },
      { field: "DocNumber", header: "Invoice Number" },
      { field: "CustomerRef.name", header: "Customer Name" },
      { field: "TxnDate", header: "Invoice Date" },
      { field: "DueDate", header: "Due Date" },
      { field: "EmailStatus", header: "Email Sent" },
      { field: "BillEmail.Address", header: "Email Id" },
      { field: "Line[0].SalesItemLineDetail.ItemRef.name", header: "Product/Service" },
      { field: "BillAddr.Line1", header: "Billing Address Line 1" },
      { field: "BillAddr.City", header: "Billing Address City" },
      { field: "BillAddr.Country", header: "Billing Address Country" },
      { field: "BillAddr.PostalCode", header: "Billing Address Postal Code" },
      { field: "CurrencyRef.value", header: "Currency Code" },
      { field: "TotalAmt", header: "Amount" },
      { field: "Balance", header: "Payment Status", accessor: (record) => record.Balance > 0 ? "Unpaid" : "Paid" }
    ],
    "Estimate": [
      { field: "Id", header: "Id" },
      { field: "DocNumber", header: "Estimate Number" },
      { field: "CustomerRef.name", header: "Customer Name" },
      { field: "TxnDate", header: "Estimate Date" },
      { field: "ExpirationDate", header: "Expiration Date" },
      { field: "EmailStatus", header: "Email Sent" },
      { field: "BillEmail.Address", header: "Email Id" },
      { field: "Line[0].SalesItemLineDetail.ItemRef.name", header: "Product/Service" },
      { field: "BillAddr.Line1", header: "Billing Address Line 1" },
      { field: "BillAddr.City", header: "Billing Address City" },
      { field: "BillAddr.Country", header: "Billing Address Country" },
      { field: "BillAddr.PostalCode", header: "Billing Address Postal Code" },
      { field: "CurrencyRef.value", header: "Currency Code" },
      { field: "TotalAmt", header: "Amount" },
      { field: "TxnStatus", header: "Estimate Status" }
    ],
    "CreditMemo": [
      { field: "Id", header: "Id" },
      { field: "DocNumber", header: "Credit Note No" },
      { field: "CustomerRef.name", header: "Customer Name" },
      { field: "TxnDate", header: "Credit Note Date" },
      { field: "EmailStatus", header: "Email Sent" },
      { field: "BillEmail.Address", header: "Email Id" },
      { field: "Line[0].SalesItemLineDetail.ItemRef.name", header: "Product/Service" },
      { field: "BillAddr.Line1", header: "Address Line 1" },
      { field: "BillAddr.City", header: "Billing Address City" },
      { field: "BillAddr.CountrySubDivisionCode", header: "Address Subdivision" },
      { field: "BillAddr.Country", header: "Address Country" },
      { field: "BillAddr.PostalCode", header: "Address Postal Code" },
      { field: "CurrencyRef.value", header: "Currency Code" },
      { field: "TotalAmt", header: "Total Amount" },
      { field: "CustomerMemo.value", header: "Message" }
    ],
    "SalesReceipt": [
      { field: "Id", header: "Id" },
      { field: "DocNumber", header: "Sales Receipt No" },
      { field: "CustomerRef.name", header: "Customer Name" },
      { field: "TxnDate", header: "Receipt Date" },
      { field: "DepositToAccountRef.name", header: "Deposit To" },
      { field: "EmailStatus", header: "Email Sent" },
      { field: "BillEmail.Address", header: "Email Id" },
      { field: "Line[0].SalesItemLineDetail.ItemRef.name", header: "Product/Service" },
      { field: "BillAddr.Line1", header: "Billing Address Line 1" },
      { field: "BillAddr.City", header: "Billing Address City" },
      { field: "BillAddr.Country", header: "Billing Address Country" },
      { field: "BillAddr.PostalCode", header: "Billing Address Postal Code" },
      { field: "CurrencyRef.value", header: "Currency Code" },
      { field: "TotalAmt", header: "Total Amount" },
      { field: "PrivateNote", header: "Description" }
    ],
    "Payment": [
      { field: "Id", header: "Id" },
      { field: "PaymentRefNum", header: "Ref Number" },
      { field: "CustomerRef.name", header: "Customer Name" },
      { field: "TxnDate", header: "Payment Date" },
      { field: "PaymentMethodRef.name", header: "Payment Method" },
      { field: "Line[0].LinkedTxn[0].TxnId", header: "Invoice No", accessor: (record) => {
        if (record.Line && record.Line[0] && record.Line[0].LinkedTxn && record.Line[0].LinkedTxn[0]) {
          return record.Line[0].LinkedTxn[0].TxnId;
        }
        return "N/A";
      }},
      { field: "DepositToAccountRef.name", header: "Deposit To Account Name" },
      { field: "CurrencyRef.value", header: "Currency Code" },
      { field: "TotalAmt", header: "Amount" }
    ],
    "RefundReceipt": [
      { field: "Id", header: "Id" },
      { field: "DocNumber", header: "Receipt Number" },
      { field: "CustomerRef.name", header: "Customer Name" },
      { field: "TxnDate", header: "Receipt Date" },
      { field: "DepositToAccountRef.name", header: "Refunded From" },
      { field: "PaymentMethodRef.name", header: "Payment Method" },
      { field: "BillEmail.Address", header: "Email Id" },
      { field: "Line[0].SalesItemLineDetail.ItemRef.name", header: "Product/Service" },
      { field: "BillAddr.Line1", header: "Billing Address Line 1" },
      { field: "BillAddr.City", header: "Billing Address City" },
      { field: "BillAddr.Country", header: "Billing Address Country" },
      { field: "BillAddr.PostalCode", header: "Billing Address Postal Code" },
      { field: "CurrencyRef.value", header: "Currency Code" },
      { field: "PrivateNote", header: "Memo" },
      { field: "PrintStatus", header: "Print Status" }
    ],
    "PurchaseOrder": [
      { field: "Id", header: "Id" },
      { field: "DocNumber", header: "PO Number" },
      { field: "VendorRef.name", header: "Supplier Name" },
      { field: "TxnDate", header: "PO Date" },
      { field: "APAccountRef.name", header: "Payment Account" },
      { field: "VendorAddr.Line1", header: "Billing Address Line 1" },
      { field: "VendorAddr.City", header: "Billing Address City" },
      { field: "VendorAddr.Country", header: "Billing Address Country" },
      { field: "VendorAddr.PostalCode", header: "Billing Address Postal Code" },
      { field: "Line[0].ItemBasedExpenseLineDetail.ItemRef.name", header: "Product/Service" },
      { field: "CurrencyRef.value", header: "Currency Code" },
      { field: "TotalAmt", header: "Amount" }
    ],
    "Bill": [
      { field: "Id", header: "Id" },
      { field: "DocNumber", header: "Bill Number" },
      { field: "VendorRef.name", header: "Supplier Name" },
      { field: "TxnDate", header: "Bill Date" },
      { field: "APAccountRef.name", header: "Payment Account" },
      { field: "DueDate", header: "Due Date" },
      { field: "Line[0].ItemBasedExpenseLineDetail.ItemRef.name", header: "Product/Service" },
      { field: "VendorAddr.Line1", header: "Billing Address Line 1" },
      { field: "VendorAddr.City", header: "Billing Address City" },
      { field: "VendorAddr.Country", header: "Billing Address Country" },
      { field: "VendorAddr.PostalCode", header: "Billing Address Postal Code" },
      { field: "CurrencyRef.value", header: "Currency Code" },
      { field: "TotalAmt", header: "Total Amount" }
    ],
    "VendorCredit": [
      { field: "Id", header: "Id" },
      { field: "DocNumber", header: "Ref Number" },
      { field: "VendorRef.name", header: "Supplier Name" },
      { field: "TxnDate", header: "Credit Date" },
      { field: "APAccountRef.name", header: "Payment Account" },
      { field: "Line[0].ItemBasedExpenseLineDetail.ItemRef.name", header: "Product/Service" },
      { field: "VendorAddr.Line1", header: "Billing Address Line 1" },
      { field: "VendorAddr.City", header: "Billing Address City" },
      { field: "VendorAddr.CountrySubDivisionCode", header: "Billing Address Sub Division" },
      { field: "VendorAddr.Country", header: "Billing Address Country" },
      { field: "VendorAddr.PostalCode", header: "Billing Address Postal Code" },
      { field: "CurrencyRef.value", header: "Currency Code" },
      { field: "TotalAmt", header: "Amount" }
    ],
    "Deposit": [
      { field: "Id", header: "Id" },
      { field: "PrivateNote", header: "Private Note" },
      { field: "DepositToAccountRef.name", header: "Deposit Account" },
      { field: "TxnDate", header: "Deposit Date" },
      { field: "Line[0].DepositLineDetail.Entity.name", header: "Received From", accessor: (record) => {
        if (record.Line && record.Line[0] && record.Line[0].DepositLineDetail && record.Line[0].DepositLineDetail.Entity) {
          return record.Line[0].DepositLineDetail.Entity.name;
        }
        return "N/A";
      }},
      { field: "Line[0].DepositLineDetail.PaymentMethodRef.name", header: "Payment Method", accessor: (record) => {
        if (record.Line && record.Line[0] && record.Line[0].DepositLineDetail && record.Line[0].DepositLineDetail.PaymentMethodRef) {
          return record.Line[0].DepositLineDetail.PaymentMethodRef.name;
        }
        return "N/A";
      }},
      { field: "CurrencyRef.value", header: "Currency Code" },
      { field: "TotalAmt", header: "Amount" }
    ],
    "Transfer": [
      { field: "Id", header: "Id" },
      { field: "FromAccountRef.name", header: "Transfer from Account" },
      { field: "TxnDate", header: "Transfer Date" },
      { field: "ToAccountRef.name", header: "Transfer To Account" },
      { field: "PrivateNote", header: "Note" },
      { field: "CurrencyRef.value", header: "Currency Code" },
      { field: "Amount", header: "Amount" }
    ],
    "JournalEntry": [
      { field: "Id", header: "Id" },
      { field: "DocNumber", header: "Journal No" },
      { field: "PrivateNote", header: "Memo" },
      { field: "TxnDate", header: "Journal Date" },
      { field: "Line[0].JournalEntryLineDetail.AccountRef.name", header: "Account", accessor: (record) => {
        if (record.Line && record.Line[0] && record.Line[0].JournalEntryLineDetail && record.Line[0].JournalEntryLineDetail.AccountRef) {
          return record.Line[0].JournalEntryLineDetail.AccountRef.name;
        }
        return "N/A";
      }}
    ],
    "Check": [
      { field: "Id", header: "Id" },
      { field: "DocNumber", header: "Check Number" },
      { field: "EntityRef.name", header: "Payee Name" },
      { field: "TxnDate", header: "Check Date" },
      { field: "AccountRef.name", header: "Bank Account" },
      { field: "Line[0].ItemBasedExpenseLineDetail.ItemRef.name", header: "Product/Service" },
      { field: "Line[0].Description", header: "Memo Line" },
      { field: "CurrencyRef.value", header: "Currency Code" },
      { field: "TotalAmt", header: "Amount" },
      { field: "PrintStatus", header: "Print Status" }
    ],
    "CreditCardCredit": [
      { field: "Id", header: "Id" },
      { field: "DocNumber", header: "Credit Card Credit Number" },
      { field: "EntityRef.name", header: "Vendor Name" },
      { field: "TxnDate", header: "Credit Date" },
      { field: "AccountRef.name", header: "Credit Card Account" },
      { field: "Line[0].ItemBasedExpenseLineDetail.ItemRef.name", header: "Item/Account" },
      { field: "Line[0].Description", header: "Description" },
      { field: "CurrencyRef.value", header: "Currency Code" },
      { field: "TotalAmt", header: "Credit Amount" }
    ]
  };
  
  return columns[entityType] || [];
};

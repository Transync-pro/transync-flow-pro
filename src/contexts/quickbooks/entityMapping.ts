
import { QB_ENTITIES } from "@/services/quickbooksApi/entities";

export const getEntityOptions = () => [
  { value: QB_ENTITIES.CUSTOMER, label: "Customers" },
  { value: QB_ENTITIES.VENDOR, label: "Vendors" },
  { value: QB_ENTITIES.ITEM, label: "Products & Services" },
  { value: QB_ENTITIES.ACCOUNT, label: "Chart of Accounts" },
  { value: QB_ENTITIES.EMPLOYEE, label: "Employees" },
  { value: QB_ENTITIES.DEPARTMENT, label: "Departments" },
  { value: QB_ENTITIES.CLASS, label: "Classes" },
  { value: QB_ENTITIES.INVOICE, label: "Invoices" },
  { value: QB_ENTITIES.ESTIMATE, label: "Estimates" },
  { value: QB_ENTITIES.CREDIT_MEMO, label: "Credit Memos" },
  { value: QB_ENTITIES.SALES_RECEIPT, label: "Sales Receipts" },
  { value: QB_ENTITIES.PAYMENT, label: "Payments" },
  { value: QB_ENTITIES.REFUND_RECEIPT, label: "Refund Receipts" },
  { value: QB_ENTITIES.PURCHASE_ORDER, label: "Purchase Orders" },
  { value: QB_ENTITIES.BILL, label: "Bills" },
  { value: QB_ENTITIES.VENDOR_CREDIT, label: "Vendor Credits" },
  { value: "Check", label: "Checks" },
  { value: "CreditCardCredit", label: "Credit Card Credits" },
  { value: QB_ENTITIES.DEPOSIT, label: "Bank Deposits" },
  { value: QB_ENTITIES.TRANSFER, label: "Bank Transfers" },
  { value: QB_ENTITIES.JOURNAL_ENTRY, label: "Journal Entries" }
];

export const getNestedValue = (obj: any, path: string): any => {
  if (!obj || !path) return undefined;
  
  // Handle array notation in path like "Line[0].Amount"
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (part.includes('[') && part.includes(']')) {
      // Extract array index
      const arrayName = part.substring(0, part.indexOf('['));
      const indexStr = part.substring(part.indexOf('[') + 1, part.indexOf(']'));
      const index = parseInt(indexStr, 10);
      
      // Access array element
      if (current[arrayName] && Array.isArray(current[arrayName]) && current[arrayName][index] !== undefined) {
        current = current[arrayName][index];
      } else {
        return undefined;
      }
    } else if (current && current[part] !== undefined) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
};

export interface EntityColumnConfig {
  field: string;
  header: string;
  accessor?: (record: any) => any;
}

// Define column configurations for each entity type
export const getEntityColumns = (entityType: string): EntityColumnConfig[] => {
  switch (entityType) {
    case "Customer":
    case "Vendor":
      return [
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
      ];
      
    case "Item":
      return [
        { field: "Id", header: "Id" },
        { field: "Name", header: "Name" },
        { field: "Type", header: "Type" },
        { field: "Sku", header: "SKU" },
        { field: "UnitPrice", header: "Price" },
        { field: "IncomeAccountRef.name", header: "Income Account" },
        { field: "Description", header: "Description" },
        { field: "ParentRef.name", header: "Category" },
        { field: "SalesTaxCodeRef.name", header: "Sales Tax" }
      ];
      
    case "Account":
      return [
        { field: "Id", header: "Id" },
        { field: "Name", header: "Name" },
        { field: "AccountType", header: "Account Type" },
        { field: "AccountSubType", header: "Account Subtype" },
        { field: "AcctNum", header: "Account Number" },
        { field: "ParentRef.name", header: "Parent Account" },
        { field: "Description", header: "Description" },
        { field: "CurrentBalance", header: "Opening Balance" },
        { field: "CurrencyRef.value", header: "Currency Code" }
      ];
      
    case "Employee":
      return [
        { field: "Id", header: "Id" },
        { field: "DisplayName", header: "Name" },
        { field: "HiredDate", header: "Hiring Date" },
        { field: "PrimaryPhone.FreeFormNumber", header: "Phone Number" },
        { field: "PrimaryAddr.Line1", header: "Address Line 1" },
        { field: "PrimaryAddr.City", header: "Address City" },
        { field: "PrimaryAddr.CountrySubDivisionCode", header: "Address Subdivision" },
        { field: "PrimaryAddr.Country", header: "Address Country/State" },
        { field: "PrimaryAddr.PostalCode", header: "Postal Code" }
      ];
      
    case "Department":
      return [
        { field: "Id", header: "Id" },
        { field: "Name", header: "Name" },
        { field: "SubDepartment", header: "Is Sub-department?" },
        { field: "Active", header: "Active" }
      ];
      
    case "Class":
      return [
        { field: "Id", header: "Id" },
        { field: "Name", header: "Name" },
        { field: "SubClass", header: "Is Sub-class?" },
        { field: "Active", header: "Active" }
      ];
      
    case "Invoice":
      return [
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
        { field: "Balance", header: "Payment Status", accessor: (record) => {
          const balance = record.Balance;
          const total = record.TotalAmt;
          if (balance === 0) return "Paid";
          if (balance === total) return "Unpaid";
          if (balance < total && balance > 0) return "Partially Paid";
          return "Unknown";
        }}
      ];
      
    case "Estimate":
      return [
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
      ];

    case "CreditMemo":
      return [
        { field: "Id", header: "Id" },
        { field: "DocNumber", header: "Credit Note No" },
        { field: "CustomerRef.name", header: "Customer Name" },
        { field: "TxnDate", header: "Credit Note Date" },
        { field: "EmailStatus", header: "Email Sent" },
        { field: "BillEmail.Address", header: "Email Id" },
        { field: "Line[0].SalesItemLineDetail.ItemRef.name", header: "Product/Service" },
        { field: "BillAddr.Line1", header: "Address Line 1" },
        { field: "BillAddr.City", header: "Address City" },
        { field: "BillAddr.CountrySubDivisionCode", header: "Address Subdivision" },
        { field: "BillAddr.Country", header: "Address Country" },
        { field: "BillAddr.PostalCode", header: "Address Postal Code" },
        { field: "CurrencyRef.value", header: "Currency Code" },
        { field: "TotalAmt", header: "Total Amount" },
        { field: "CustomerMemo.value", header: "Message" }
      ];

    case "SalesReceipt":
      return [
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
      ];

    case "Payment":
      return [
        { field: "Id", header: "Id" },
        { field: "PaymentRefNum", header: "Ref Number" },
        { field: "CustomerRef.name", header: "Customer Name" },
        { field: "TxnDate", header: "Payment Date" },
        { field: "PaymentMethodRef.name", header: "Payment Method" },
        { field: "Line[0].LineEx.any[0].value", header: "Invoice No" },
        { field: "DepositToAccountRef.name", header: "Deposit To Account Name" },
        { field: "CurrencyRef.value", header: "Currency Code" },
        { field: "TotalAmt", header: "Amount" }
      ];

    case "RefundReceipt":
      return [
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
      ];

    case "PurchaseOrder":
      return [
        { field: "Id", header: "Id" },
        { field: "DocNumber", header: "PO Number" },
        { field: "VendorRef.name", header: "Supplier Name" },
        { field: "TxnDate", header: "PO Date" },
        { field: "APAccountRef.name", header: "Payment Account" },
        { field: "VendorAddr.Line4", header: "Email Id" },
        { field: "Line[0].ItemBasedExpenseLineDetail.ItemRef.name", header: "Product/Service" },
        { field: "ShipAddr.Line1", header: "Billing Address Line 1" },
        { field: "ShipAddr.City", header: "Billing Address City" },
        { field: "ShipAddr.Country", header: "Billing Address Country" },
        { field: "ShipAddr.PostalCode", header: "Billing Address Postal Code" },
        { field: "CurrencyRef.value", header: "Currency Code" },
        { field: "TotalAmt", header: "Amount" }
      ];

    case "Bill":
      return [
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
      ];

    case "VendorCredit":
      return [
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
      ];

    case "Check":
    case "CreditCardCredit":
      return [
        { field: "Id", header: "Id" },
        { field: "DocNumber", header: "Check Number" },
        { field: "EntityRef.name", header: "Payee" },
        { field: "TxnDate", header: "Date" },
        { field: "AccountRef.name", header: "Bank Account" },
        { field: "PaymentMethodRef.name", header: "Payment Method" },
        { field: "Line[0].AccountBasedExpenseLineDetail.AccountRef.name", header: "Account" },
        { field: "Line[0].Description", header: "Description" },
        { field: "CurrencyRef.value", header: "Currency Code" },
        { field: "TotalAmt", header: "Amount" }
      ];

    case "Deposit":
      return [
        { field: "Id", header: "Id" },
        { field: "PrivateNote", header: "Private Note" },
        { field: "DepositToAccountRef.name", header: "Deposit Account" },
        { field: "TxnDate", header: "Deposit Date" },
        { field: "Line[0].DepositLineDetail.EntityRef.name", header: "Received From" },
        { field: "Line[0].DepositLineDetail.PaymentMethodRef.name", header: "Payment Method" },
        { field: "CurrencyRef.value", header: "Currency Code" },
        { field: "TotalAmt", header: "Amount" }
      ];

    case "Transfer":
      return [
        { field: "Id", header: "Id" },
        { field: "FromAccountRef.name", header: "Transfer from Account" },
        { field: "TxnDate", header: "Transfer Date" },
        { field: "ToAccountRef.name", header: "Transfer To Account" },
        { field: "PrivateNote", header: "Note" },
        { field: "CurrencyRef.value", header: "Currency Code" },
        { field: "Amount", header: "Amount" }
      ];

    case "JournalEntry":
      return [
        { field: "Id", header: "Id" },
        { field: "DocNumber", header: "Journal No" },
        { field: "PrivateNote", header: "Memo" },
        { field: "TxnDate", header: "Journal Date" },
        { field: "Line[0].JournalEntryLineDetail.AccountRef.name", header: "Account" }
      ];

    default:
      return [
        { field: "Id", header: "Id" },
        { field: "Name", header: "Name" },
        { field: "Description", header: "Description" }
      ];
  }
};

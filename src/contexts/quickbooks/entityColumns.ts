
import { EntityColumnConfig } from "./types";

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

export const entityColumns = {
  getEntityColumns
};

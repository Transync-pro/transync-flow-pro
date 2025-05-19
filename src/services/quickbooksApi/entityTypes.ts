
// Entity mapping - QuickBooks API entity names
export const QB_ENTITIES = {
  CUSTOMER: "Customer",
  VENDOR: "Vendor",
  ITEM: "Item", // Products & Services
  ACCOUNT: "Account", // Chart of Accounts
  EMPLOYEE: "Employee",
  DEPARTMENT: "Department", 
  CLASS: "Class",
  INVOICE: "Invoice",
  ESTIMATE: "Estimate",
  CREDIT_MEMO: "CreditMemo",
  SALES_RECEIPT: "SalesReceipt",
  PAYMENT: "Payment", // Received Payments
  REFUND_RECEIPT: "RefundReceipt",
  PURCHASE_ORDER: "PurchaseOrder",
  PURCHASE: "Purchase", // Expenses
  BILL: "Bill",
  VENDOR_CREDIT: "VendorCredit",
  BILL_PAYMENT: "BillPayment",
  DEPOSIT: "Deposit", // Bank Deposits
  TRANSFER: "Transfer",
  JOURNAL_ENTRY: "JournalEntry",
  CHECK: "Purchase", // Checks (using Purchase with special filter)
  CREDIT_CARD_CREDIT: "Purchase" // Credit Card Credits (using Purchase with special filter)
};

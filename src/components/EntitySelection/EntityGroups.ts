
// Define entity categories and their respective entities
export type Entity = {
  id: string;
  name: string;
  icon: string;
};

export type EntityGroup = {
  category: string;
  entities: Entity[];
};

export const entityGroups: EntityGroup[] = [
  {
    category: "Contacts",
    entities: [
      { id: "customers", name: "Customers", icon: "👤" },
      { id: "suppliers", name: "Suppliers", icon: "🏭" },
      { id: "employees", name: "Employees", icon: "👨‍💼" },
    ],
  },
  {
    category: "Items & Services",
    entities: [
      { id: "products", name: "Products & Services", icon: "📦" },
      { id: "chart_of_accounts", name: "Chart of Accounts", icon: "📊" },
    ],
  },
  {
    category: "Categories",
    entities: [
      { id: "departments", name: "Departments / Locations", icon: "🏢" },
      { id: "classes", name: "Classes", icon: "🏷️" },
    ],
  },
  {
    category: "Sales",
    entities: [
      { id: "invoices", name: "Invoices", icon: "📄" },
      { id: "estimates", name: "Estimates", icon: "📝" },
      { id: "credit_memos", name: "Credit Memos", icon: "💳" },
      { id: "sales_receipts", name: "Sales Receipts", icon: "🧾" },
      { id: "received_payments", name: "Received Payments", icon: "💵" },
      { id: "refund_receipts", name: "Refund Receipts", icon: "↩️" },
    ],
  },
  {
    category: "Purchases",
    entities: [
      { id: "purchase_orders", name: "Purchase Orders", icon: "📋" },
      { id: "expenses", name: "Expenses", icon: "💸" },
      { id: "bills", name: "Bills", icon: "📑" },
      { id: "vendor_credits", name: "Vendor Credits", icon: "🔄" },
      { id: "bill_payments", name: "Bill Payments", icon: "💰" },
      { id: "credit_card_credits", name: "Credit Card Credits", icon: "💳" },
      { id: "checks", name: "Checks", icon: "✅" },
    ],
  },
  {
    category: "Other Transactions",
    entities: [
      { id: "time_tracking", name: "Time Tracking", icon: "⏱️" },
      { id: "bank_deposits", name: "Bank Deposits", icon: "🏦" },
      { id: "transfers", name: "Transfers", icon: "↔️" },
      { id: "journal_entries", name: "Journal Entries", icon: "📔" },
    ],
  },
];

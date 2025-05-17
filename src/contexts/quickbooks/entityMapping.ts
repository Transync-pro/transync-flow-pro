
import { entityGroups } from "@/components/EntitySelection/EntityGroups";

// Helper function to map entity IDs from EntityGroups to QuickBooks API entity types
export const mapEntityIdToQuickbooksType = (entityId: string): string => {
  const mapping: Record<string, string> = {
    'customers': 'Customer',
    'suppliers': 'Vendor',
    'employees': 'Employee',
    'products': 'Item',
    'chart_of_accounts': 'Account',
    'departments': 'Department',
    'classes': 'Class',
    'invoices': 'Invoice',
    'estimates': 'Estimate',
    'credit_memos': 'CreditMemo',
    'sales_receipts': 'SalesReceipt',
    'received_payments': 'Payment',
    'refund_receipts': 'RefundReceipt',
    'purchase_orders': 'PurchaseOrder',
    'expenses': 'Purchase',
    'bills': 'Bill',
    'vendor_credits': 'VendorCredit',
    'bill_payments': 'BillPayment',
    'credit_card_credits': 'CreditCardCredit',
    'checks': 'Check',
    'time_tracking': 'TimeActivity',
    'bank_deposits': 'Deposit',
    'transfers': 'Transfer',
    'journal_entries': 'JournalEntry',
  };
  
  return mapping[entityId] || entityId;
};

// Generate entity options for dropdowns
export const getEntityOptions = () => {
  return entityGroups.flatMap(group => 
    group.entities.map(entity => ({
      value: mapEntityIdToQuickbooksType(entity.id),
      label: entity.name
    }))
  );
};

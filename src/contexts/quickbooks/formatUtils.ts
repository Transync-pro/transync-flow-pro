
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

export const formatUtils = {
  formatDisplayName
};

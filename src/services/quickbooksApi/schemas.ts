
// Function to get entity schema/fields
export const getEntitySchema = (entity: string) => {
  const schemas: Record<string, any> = {
    Customer: {
      required: ['DisplayName'],
      fields: ['DisplayName', 'GivenName', 'FamilyName', 'CompanyName', 'PrimaryEmailAddr', 'PrimaryPhone', 'BillAddr']
    },
    Invoice: {
      required: ['CustomerRef', 'Line'],
      fields: ['CustomerRef', 'Line', 'TxnDate', 'DueDate', 'TotalAmt', 'PrivateNote']
    },
    Item: {
      required: ['Name', 'Type'],
      fields: ['Name', 'Description', 'Active', 'Type', 'UnitPrice', 'PurchaseCost', 'IncomeAccountRef', 'ExpenseAccountRef']
    },
    Account: {
      required: ['Name', 'AccountType'],
      fields: ['Name', 'AccountType', 'AccountSubType', 'Description', 'Active']
    },
    Vendor: {
      required: ['DisplayName'],
      fields: ['DisplayName', 'CompanyName', 'GivenName', 'FamilyName', 'PrimaryEmailAddr', 'PrimaryPhone', 'BillAddr']
    },
    Bill: {
      required: ['VendorRef'],
      fields: ['VendorRef', 'Line', 'TxnDate', 'DueDate', 'TotalAmt']
    },
    Payment: {
      required: ['CustomerRef'],
      fields: ['CustomerRef', 'TotalAmt', 'TxnDate', 'Line']
    }
  };
  
  return schemas[entity] || { required: [], fields: [] };
};

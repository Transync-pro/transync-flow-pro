import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { logOperation } from "@/utils/operationLogger";
import { validateOperationType } from "@/utils/operationLogger";

// Generic type for QuickBooks entity operation responses
type QBEntityResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Fetch QuickBooks entities
export const fetchQuickbooksEntities = async <T = any>(
  entityType: string,
  customQuery?: string
): Promise<QBEntityResponse<T>> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.functions.invoke("quickbooks-entities", {
      body: {
        operation: "fetch",
        entityType,
        userId: userData.user.id,
        query: customQuery
      }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);
    
    // Log the successful fetch operation with validated operation type
    await logOperation({
      operationType: validateOperationType('fetch'),
      entityType,
      recordId: null,
      status: 'success',
      details: { 
        query: customQuery,
        count: data?.data?.QueryResponse?.[entityType]?.length || 0
      }
    });

    return {
      success: true,
      data: data.data
    };
  } catch (error: any) {
    console.error(`Error fetching ${entityType}:`, error);
    
    // Log the failed fetch operation with validated operation type
    await logOperation({
      operationType: validateOperationType('fetch'),
      entityType,
      status: 'error',
      details: { error: error.message || "An unknown error occurred" }
    });
    
    toast({
      title: `Failed to fetch ${entityType}`,
      description: error.message || "An unknown error occurred",
      variant: "destructive"
    });

    return {
      success: false,
      error: error.message || "An unknown error occurred"
    };
  }
};

// Create a new QuickBooks entity
export const createQuickbooksEntity = async <T = any>(
  entityType: string,
  entityData: any
): Promise<QBEntityResponse<T>> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.functions.invoke("quickbooks-entities", {
      body: {
        operation: "create",
        entityType,
        userId: userData.user.id,
        data: entityData
      }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);
    
    // Log the successful creation with validated operation type
    await logOperation({
      operationType: validateOperationType('import'),
      entityType,
      recordId: data?.data?.[entityType]?.Id,
      status: 'success',
      details: { action: 'create', entity: data?.data?.[entityType] }
    });

    toast({
      title: "Created Successfully",
      description: `${entityType} created successfully`
    });

    return {
      success: true,
      data: data.data
    };
  } catch (error: any) {
    console.error(`Error creating ${entityType}:`, error);
    
    // Log the failed creation with validated operation type
    await logOperation({
      operationType: validateOperationType('import'),
      entityType,
      status: 'error',
      details: { action: 'create', error: error.message || "An unknown error occurred" }
    });
    
    toast({
      title: `Failed to create ${entityType}`,
      description: error.message || "An unknown error occurred",
      variant: "destructive"
    });

    return {
      success: false,
      error: error.message || "An unknown error occurred"
    };
  }
};

// Update an existing QuickBooks entity
export const updateQuickbooksEntity = async <T = any>(
  entityType: string,
  entityId: string,
  entityData: any,
  syncToken: string
): Promise<QBEntityResponse<T>> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.functions.invoke("quickbooks-entities", {
      body: {
        operation: "update",
        entityType,
        userId: userData.user.id,
        id: entityId,
        data: entityData,
        syncToken
      }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);
    
    // Log the successful update with validated operation type
    await logOperation({
      operationType: validateOperationType('import'),
      entityType,
      recordId: entityId,
      status: 'success',
      details: { action: 'update', entity: data?.data?.[entityType] }
    });

    toast({
      title: "Updated Successfully",
      description: `${entityType} updated successfully`
    });

    return {
      success: true,
      data: data.data
    };
  } catch (error: any) {
    console.error(`Error updating ${entityType}:`, error);
    
    // Log the failed update with validated operation type
    await logOperation({
      operationType: validateOperationType('import'),
      entityType,
      recordId: entityId,
      status: 'error',
      details: { action: 'update', error: error.message || "An unknown error occurred" }
    });
    
    toast({
      title: `Failed to update ${entityType}`,
      description: error.message || "An unknown error occurred",
      variant: "destructive"
    });

    return {
      success: false,
      error: error.message || "An unknown error occurred"
    };
  }
};

// Delete a QuickBooks entity
export const deleteQuickbooksEntity = async <T = any>(
  entityType: string,
  entityId: string
): Promise<QBEntityResponse<T>> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.functions.invoke("quickbooks-entities", {
      body: {
        operation: "delete",
        entityType,
        userId: userData.user.id,
        id: entityId
      }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);
    
    // Log the successful deletion with validated operation type
    await logOperation({
      operationType: validateOperationType('delete'),
      entityType,
      recordId: entityId,
      status: 'success',
      details: { action: 'delete', entity: data?.data?.[entityType] }
    });

    toast({
      title: "Deleted Successfully",
      description: `${entityType} deleted successfully`
    });

    return {
      success: true,
      data: data.data
    };
  } catch (error: any) {
    console.error(`Error deleting ${entityType}:`, error);
    
    // Log the failed deletion with validated operation type
    await logOperation({
      operationType: validateOperationType('delete'),
      entityType,
      recordId: entityId,
      status: 'error',
      details: { action: 'delete', error: error.message || "An unknown error occurred" }
    });
    
    toast({
      title: `Failed to delete ${entityType}`,
      description: error.message || "An unknown error occurred",
      variant: "destructive"
    });

    return {
      success: false,
      error: error.message || "An unknown error occurred"
    };
  }
};

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

// Utils for CSV export
export const convertToCSV = (records: any[], fields: string[]): string => {
  if (!records || !Array.isArray(records) || records.length === 0) {
    return fields.join(',') + '\n'; // Return only headers if no data
  }
  
  // Add headers row
  let csv = fields.join(',') + '\n';
  
  // Add data rows
  records.forEach(item => {
    const row = fields.map(field => {
      // Handle nested fields with dot notation (e.g., "CustomerRef.name")
      const value = field.includes('.')
        ? field.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : '', item)
        : item[field] !== undefined ? item[field] : '';
        
      // Escape commas and quotes
      const escapedValue = typeof value === 'string' 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
        
      return escapedValue !== undefined ? escapedValue : '';
    }).join(',');
    
    csv += row + '\n';
  });
  
  return csv;
};

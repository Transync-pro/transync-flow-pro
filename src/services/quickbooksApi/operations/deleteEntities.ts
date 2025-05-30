
import { supabase } from "@/integrations/supabase/environmentClient";
import { toast } from "@/components/ui/use-toast";
import { logOperation } from "@/utils/operationLogger";
import { validateOperationType } from "@/utils/operationLogger";
import { QBEntityResponse } from "../types";

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

    console.log(`Attempting to delete ${entityType} with ID ${entityId}`);
    
    // Call our edge function to delete the entity
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
    
    // Enhanced error handling with more specific messages
    let errorMessage = error.message || "An unknown error occurred";
    
    // Check for specific QuickBooks API errors and provide better user messages
    if (errorMessage.includes("Transaction date is prior to start date for inventory item")) {
      errorMessage = `Cannot delete this ${entityType} because it contains inventory items with dates that conflict with inventory start dates. Please contact your QuickBooks administrator.`;
    } else if (errorMessage.includes("Object not found")) {
      errorMessage = `The ${entityType} could not be found. It may have been already deleted.`;
    } else if (errorMessage.includes("stale object")) {
      errorMessage = `This ${entityType} has been modified since it was last retrieved. Please refresh and try again.`;
    } else if (errorMessage.includes("has a payment")) {
      errorMessage = `Cannot delete this ${entityType} because it has linked payments. Please void or delete the payments first.`;
    }
    
    // Log the failed deletion with validated operation type
    await logOperation({
      operationType: validateOperationType('delete'),
      entityType,
      recordId: entityId,
      status: 'error',
      details: { action: 'delete', error: errorMessage }
    });
    
    toast({
      title: `Failed to delete ${entityType}`,
      description: errorMessage,
      variant: "destructive"
    });

    return {
      success: false,
      error: errorMessage
    };
  }
};

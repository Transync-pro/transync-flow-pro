
import { supabase } from "@/integrations/supabase/client";
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

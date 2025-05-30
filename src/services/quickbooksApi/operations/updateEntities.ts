
import { supabase } from "@/integrations/supabase/environmentClient";
import { toast } from "@/components/ui/use-toast";
import { logOperation } from "@/utils/operationLogger";
import { validateOperationType } from "@/utils/operationLogger";
import { QBEntityResponse } from "../types";

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

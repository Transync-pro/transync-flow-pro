
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { logOperation } from "@/utils/operationLogger";
import { validateOperationType } from "@/utils/operationLogger";
import { QBEntityResponse } from "../types";

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

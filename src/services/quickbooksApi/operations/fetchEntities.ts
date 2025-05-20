
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { logOperation } from "@/utils/operationLogger";
import { validateOperationType } from "@/utils/operationLogger";
import { QBEntityResponse } from "../types";

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

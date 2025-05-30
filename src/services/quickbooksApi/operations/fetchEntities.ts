
import { supabase } from "@/integrations/supabase/environmentClient";
import { toast } from "@/components/ui/use-toast";
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
    
    console.log(`Successfully fetched ${entityType} entities:`, data?.data);

    return {
      success: true,
      data: data.data
    };
  } catch (error: any) {
    console.error(`Error fetching ${entityType}:`, error);
    
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

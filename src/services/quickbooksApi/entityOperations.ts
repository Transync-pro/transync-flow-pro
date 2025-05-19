
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Generic type for QuickBooks entity operation responses
type QBEntityResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export const entityOperations = {
  // Fetch QuickBooks entities
  fetchEntities: async <T = any>(
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
  },

  // Create a new QuickBooks entity
  createEntity: async <T = any>(
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
  },

  // Update an existing QuickBooks entity
  updateEntity: async <T = any>(
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
  },

  // Delete a QuickBooks entity
  deleteEntity: async <T = any>(
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
  }
};


import { supabase } from "@/integrations/supabase/environmentClient";
import { LogOperationParams } from "./types";

// QuickBooks API base URL for sandbox environment
export const API_BASE_URL = "https://sandbox-quickbooks.api.intuit.com";

// Function to log operations in Supabase
export const logOperation = async ({
  operationType,
  entityType,
  recordId,
  status,
  details
}: LogOperationParams) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      throw new Error("User not authenticated");
    }
    
    await supabase.from("operation_logs").insert({
      user_id: user.user.id,
      operation_type: operationType,
      entity_type: entityType,
      record_id: recordId,
      status,
      details
    });
  } catch (error) {
    console.error("Error logging operation:", error);
  }
};

// Function to prepare API headers with authentication
export const getHeaders = async (accessToken: string) => {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

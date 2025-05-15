
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export const useQBErrors = () => {
  const [error, setError] = useState<string | null>(null);

  const handleError = (errorMessage: string, displayToast: boolean = true) => {
    console.error("QuickBooks Error:", errorMessage);
    setError(errorMessage);
    
    if (displayToast) {
      toast({
        title: "QuickBooks Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    return errorMessage;
  };

  const clearError = () => {
    setError(null);
  };

  return {
    error,
    handleError,
    clearError
  };
};

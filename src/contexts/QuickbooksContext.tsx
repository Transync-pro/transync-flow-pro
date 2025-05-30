
import React from "react";
import { QuickbooksProvider as Provider, useQuickbooks } from "./quickbooks/QuickbooksProvider";
import { useAuth } from "./AuthContext";

const QuickbooksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <Provider user={user}>
      {children}
    </Provider>
  );
};

export { QuickbooksProvider, useQuickbooks };
export type { QuickbooksConnection, QuickbooksContextType } from "./quickbooks/types";

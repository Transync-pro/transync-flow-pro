
import React from "react";
import { QuickbooksProvider as Provider, useQuickbooks } from "./quickbooks/QuickbooksProvider";
import { QuickbooksEntitiesProvider } from "./QuickbooksEntitiesContext";
import { useAuth } from "./AuthContext";

const QuickbooksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <Provider user={user}>
      <QuickbooksEntitiesProvider>
        {children}
      </QuickbooksEntitiesProvider>
    </Provider>
  );
};

export { QuickbooksProvider, useQuickbooks };
export type { QuickbooksConnection, QuickbooksContextType } from "./quickbooks/types";

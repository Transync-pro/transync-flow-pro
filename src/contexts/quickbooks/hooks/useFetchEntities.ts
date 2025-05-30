import { useState, useEffect } from 'react';
import { logError } from '@/utils/errorLogger';
import { supabase } from '@/integrations/supabase/environmentClient';

export const useFetchEntities = (
  userId: string | undefined,
  selectedEntity: string | null,
  selectedDateRange: DateRange,
  entityState: Record<string, EntityState>,
  setEntityState: React.Dispatch<React.SetStateAction<Record<string, EntityState>>>
) => {
  // Function to fetch entities from QuickBooks
  const fetchEntities = useCallback(async (entityType?: string) => {
    const typeToFetch = entityType || selectedEntity;
    if (!typeToFetch || !userId) return;
    
    // Update entity state to show loading
    setEntityState(prev => ({
      ...prev,
      [typeToFetch]: {
        ...(prev[typeToFetch] || {}),
        isLoading: true,
        error: null,
        records: prev[typeToFetch]?.records || [],
        filteredRecords: prev[typeToFetch]?.filteredRecords || [],
        totalCount: prev[typeToFetch]?.totalCount || 0,
        lastUpdated: prev[typeToFetch]?.lastUpdated || null
      } as EntityState
    }));
    
    try {
      // Build query with date filter if date range is selected
      let query = null;
      if (selectedDateRange?.from && selectedDateRange?.to) {
        const fromDate = format(selectedDateRange.from, "yyyy-MM-dd");
        const toDate = format(selectedDateRange.to, "yyyy-MM-dd");
        
        // Different entities may have different date fields
        let dateField;
        switch(typeToFetch) {
          case "Invoice":
          case "Bill":
          case "CreditMemo":
          case "Estimate":
          case "SalesReceipt":
          case "Payment":
          case "RefundReceipt":
          case "PurchaseOrder":
          case "VendorCredit":
          case "Deposit":
          case "Transfer":
          case "JournalEntry":
            dateField = "TxnDate";
            break;
          default:
            dateField = "MetaData.CreateTime";
        }
        
        // For special entity types that are actually Purchase entity with filters
        if (typeToFetch === "Check") {
          query = `SELECT * FROM Purchase WHERE TxnDate >= '${fromDate}' AND TxnDate <= '${toDate}' AND PaymentType = 'Check' MAXRESULTS 1000`;
        } else {
          query = `SELECT * FROM ${typeToFetch} WHERE ${dateField} >= '${fromDate}' AND ${dateField} <= '${toDate}' MAXRESULTS 1000`;
        }
      } else {
        // For special entity types that are actually Purchase entity with filters
        if (typeToFetch === "Check") {
          query = `SELECT * FROM Purchase WHERE PaymentType = 'Check' MAXRESULTS 1000`;
        }
      }
      
      console.log(`Calling quickbooks-entities edge function to fetch ${typeToFetch} entities with query: ${query || 'default'}`);
      
      // Call our edge function to fetch entities
      const { data, error } = await supabase.functions.invoke("quickbooks-entities", {
        body: {
          operation: "fetch",
          entityType: typeToFetch,
          userId: userId,
          query: query
        }
      });
      
      if (error) {
        throw new Error(`Error invoking function: ${error.message}`);
      }
      
      if (data.error) {
        throw new Error(`Error from function: ${data.error}`);
      }
      
      // Extract the entities from the response
      let fetchedEntities = [];
      
      // Handle special cases for entities that are actually filtered Purchases
      if (typeToFetch === "Check") {
        fetchedEntities = data.data?.QueryResponse?.Purchase || [];
      } else {
        fetchedEntities = data.data?.QueryResponse?.[typeToFetch] || [];
      }
      
      console.log(`Fetched ${fetchedEntities.length} ${typeToFetch} entities`);
      
      // Log the operation in our database
      await logOperation({
        operationType: 'fetch',
        entityType: typeToFetch,
        status: 'success',
        details: {
          count: fetchedEntities.length,
          query: query
        }
      });
      
      // Update entity state with fetched data
      setEntityState(prev => ({
        ...prev,
        [typeToFetch]: {
          records: fetchedEntities,
          filteredRecords: fetchedEntities,
          isLoading: false,
          error: null,
          totalCount: fetchedEntities.length,
          lastUpdated: new Date()
        }
      }));
      
      // Show success message
      if (fetchedEntities.length > 0) {
        toast({
          title: "Data Loaded",
          description: `Successfully loaded ${fetchedEntities.length} ${typeToFetch} records`,
        });
      } else {
        toast({
          title: "No Records Found",
          description: `No ${typeToFetch} records match your criteria`,
        });
      }
    } catch (error: any) {
      console.error(`Error fetching ${typeToFetch} entities:`, error);
      
      // Log the error
      await logOperation({
        operationType: 'fetch',
        entityType: typeToFetch || 'unknown',
        status: 'error',
        details: {
          error: error.message
        }
      });
      
      // Update entity state with error
      setEntityState(prev => ({
        ...prev,
        [typeToFetch]: {
          ...(prev[typeToFetch] || {}),
          isLoading: false,
          error: error.message,
          records: prev[typeToFetch]?.records || [],
          filteredRecords: prev[typeToFetch]?.filteredRecords || [],
          totalCount: prev[typeToFetch]?.totalCount || 0,
          lastUpdated: prev[typeToFetch]?.lastUpdated || null
        } as EntityState
      }));
      
      toast({
        title: "Error",
        description: `Failed to fetch ${typeToFetch}: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [selectedEntity, selectedDateRange, userId, setEntityState]);

  // Function to filter entities based on search term
  const filterEntities = useCallback((searchTerm: string, entityType?: string) => {
    const typeToFilter = entityType || selectedEntity;
    if (!typeToFilter) return;
    
    const currentState = entityState[typeToFilter];
    if (!currentState || !currentState.records) return;
    
    const term = searchTerm.toLowerCase();
    const filtered = currentState.records.filter((record) => {
      // Generic search across common fields
      return (
        (record.DisplayName && record.DisplayName.toLowerCase().includes(term)) ||
        (record.Name && record.Name.toLowerCase().includes(term)) ||
        (record.DocNumber && record.DocNumber.toLowerCase().includes(term)) ||
        (record.Id && record.Id.toLowerCase().includes(term)) ||
        JSON.stringify(record).toLowerCase().includes(term)
      );
    });
    
    setEntityState(prev => ({
      ...prev,
      [typeToFilter]: {
        ...prev[typeToFilter],
        filteredRecords: filtered
      }
    }));
  }, [entityState, selectedEntity, setEntityState]);

  return {
    fetchEntities,
    filterEntities
  };
};

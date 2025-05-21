
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { logOperation } from "@/utils/operationLogger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronLeft } from "lucide-react";
import { EntityRecord } from "@/contexts/quickbooks/types";
import { DateRange as ReactDayPickerDateRange } from "react-day-picker";

// Import components
import { EntitySelect } from "./EntitySelect";
import { FilterControls } from "./FilterControls";
import { ExportControls } from "./ExportControls";
import { FieldSelectionPanel } from "./FieldSelectionPanel";
import { ExportTable } from "./ExportTable";
import { formatDisplayName, getEntityColumns, getNestedValue } from "@/contexts/quickbooks/entityMapping";

const Export = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fileName, setFileName] = useState("export");
  const [dateRange, setDateRange] = useState<ReactDayPickerDateRange | undefined>(undefined);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedRecords, setSelectedRecords] = useState<Record<string, boolean>>({});
  const [selectAllRecords, setSelectAllRecords] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    selectedEntity,
    setSelectedEntity,
    selectedDateRange,
    setSelectedDateRange,
    entityState,
    fetchEntities,
    filterEntities,
    entityOptions,
  } = useQuickbooksEntities();

  const currentEntityState = selectedEntity ? entityState[selectedEntity] : null;
  const filteredRecords = currentEntityState?.filteredRecords || [];
  const isLoading = currentEntityState?.isLoading || false;
  const error = currentEntityState?.error || null;

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = filteredRecords.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  // Handle date range change - now required
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setSelectedDateRange({ from: dateRange.from, to: dateRange.to });
    }
  }, [dateRange, setSelectedDateRange]);

  // Reset selected fields when entity changes
  useEffect(() => {
    setSelectedFields([]);
    setPageIndex(0);
    setSelectedRecords({});
    setSelectAllRecords(false);
    setSearchQuery("");
  }, [selectedEntity, entityState]);

  // Listen for select-all-records custom event
  useEffect(() => {
    const handleSelectAllRecords = (event: Event) => {
      const customEvent = event as CustomEvent<{ selectedIds: Record<string, boolean> }>;
      setSelectedRecords(customEvent.detail.selectedIds);
      setSelectAllRecords(true);
    };

    document.addEventListener('select-all-records', handleSelectAllRecords);
    
    return () => {
      document.removeEventListener('select-all-records', handleSelectAllRecords);
    };
  }, [filteredRecords]);

  // Get entity records with applied filters
  const getEntityRecords = (): EntityRecord[] => {
    if (!selectedEntity || !entityState[selectedEntity]) return [];
    
    // If there are selected records, only return those
    if (Object.keys(selectedRecords).length > 0) {
      return entityState[selectedEntity].filteredRecords.filter(record => 
        record.Id && selectedRecords[record.Id]
      );
    }
    
    return entityState[selectedEntity].filteredRecords || [];
  };

  // Get available fields for the current entity
  const getAvailableFields = (): string[] => {
    if (!selectedEntity) return [];
    
    // Use the predefined entity columns from our mapping
    const columnConfigs = getEntityColumns(selectedEntity);
    return columnConfigs.map(config => config.field);
  };
  
  // Filter fields based on search
  const getFilteredFields = (): string[] => {
    const fields = getAvailableFields();
    if (!searchQuery) return fields;
    
    return fields.filter(field => 
      formatDisplayName(field).toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Handle field selection
  const toggleFieldSelection = (field: string) => {
    setSelectedFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  // Handle select all fields
  const handleSelectAllFields = (select: boolean) => {
    if (select) {
      setSelectedFields(getAvailableFields());
    } else {
      setSelectedFields([]);
    }
  };

  // Handle entity selection with explicit fetch
  const handleEntitySelect = (entity: string) => {
    setSelectedEntity(entity);
    setSelectedFields([]);
    setSearchTerm("");
    setPageIndex(0);
    setSelectedRecords({});
    setSelectAllRecords(false);
  };

  // Explicitly fetch data when requested by user
  const handleFetchData = async () => {
    try {
      if (!selectedEntity) return;
      
      // Check if date range is selected
      if (!selectedDateRange?.from || !selectedDateRange?.to) {
        toast({
          title: "Date Range Required",
          description: "Please select a date range before fetching data.",
          variant: "destructive",
        });
        setDateRange((prev) => ({ ...prev, error: true }));
        return;
      }
      
      await fetchEntities();
    } catch (error: any) {
      console.error(`Error fetching ${selectedEntity} data:`, error);
      toast({
        title: "Error",
        description: `Failed to fetch data: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Handle search input
  const handleSearch = () => {
    if (!selectedEntity) return;
    filterEntities(searchTerm);
    setPageIndex(0);
  };

  // Handle record selection
  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecords(prev => {
      const newState = {
        ...prev,
        [recordId]: !prev[recordId]
      };
      
      // Update selectAllRecords state for current page
      const allPageItemsSelected = paginatedRecords.every(
        record => !record.Id || newState[record.Id]
      );
      
      setSelectAllRecords(allPageItemsSelected && paginatedRecords.length > 0);
      
      return newState;
    });
  };

  // Handle select all records on current page
  const toggleSelectAllRecords = useCallback(() => {
    const newSelectAll = !selectAllRecords;
    setSelectAllRecords(newSelectAll);
    
    const newSelectedRecords = { ...selectedRecords };
    
    paginatedRecords.forEach(record => {
      if (record.Id) {
        newSelectedRecords[record.Id] = newSelectAll;
      }
    });
    
    setSelectedRecords(newSelectedRecords);
  }, [selectAllRecords, selectedRecords, paginatedRecords]);

  // Handle select all records across all pages
  const handleSelectAllPages = useCallback(() => {
    const allIds: Record<string, boolean> = {};
    filteredRecords.forEach(record => {
      if (record.Id) {
        allIds[record.Id] = true;
      }
    });
    setSelectedRecords(allIds);
    setSelectAllRecords(true);
    toast({
      title: "Selection Complete",
      description: `Selected all ${filteredRecords.length} records across all pages.`,
    });
  }, [filteredRecords]);

  // Count selected records
  const selectedRecordsCount = Object.values(selectedRecords).filter(Boolean).length;

  // Export data
  const handleExport = async (format: "csv" | "json" = "csv") => {
    console.log('=== Starting export operation ===');
    let url: string | null = null;
    let link: HTMLAnchorElement | null = null;
    
    try {
      if (selectedFields.length === 0) {
        console.log('No fields selected for export');
        toast({
          title: "No Fields Selected",
          description: "Please select at least one field to export",
          variant: "destructive",
        });
        return;
      }
      
      const records = getEntityRecords();
      console.log(`Preparing to export ${records.length} records`);
      
      if (records.length === 0) {
        console.log('No records to export');
        toast({
          title: "No Data Available",
          description: "No records to export",
          variant: "destructive",
        });
        return;
      }

      // Process records based on selected fields
      console.log('Processing export data...');
      const exportData = handleExportData(records, selectedFields, format);
      
      // Log the export operation first
      try {
        console.log('Attempting to log export operation...');
        const logResult = await logOperation({
          operationType: 'export',
          entityType: selectedEntity || 'unknown',
          status: 'success',
          details: {
            format,
            recordCount: records.length,
            fields: selectedFields,
            timestamp: new Date().toISOString(),
            selectedOnly: Object.keys(selectedRecords).length > 0
          }
        });
        console.log('Export operation logged successfully:', logResult);
      } catch (logError) {
        console.error("Error logging export operation:", logError);
      }

      // Create download link
      console.log('Creating download link...');
      const fileExtension = format === "csv" ? "csv" : "json";
      const mimeType = format === "csv" ? "text/csv" : "application/json";
      const blob = new Blob([exportData], { type: `${mimeType};charset=utf-8;` });
      url = URL.createObjectURL(blob);
      link = document.createElement('a');
      link.href = url;
      link.download = `${fileName || selectedEntity || 'export'}.${fileExtension}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      console.log('Triggering download...');
      link.click();
      
      toast({
        title: "Export Successful",
        description: `${records.length} records exported to ${format.toUpperCase()}`,
      });
      
    } catch (error: any) {
      console.error("Export error:", error);
      
      try {
        console.log('Attempting to log export error...');
        await logOperation({
          operationType: 'export',
          entityType: selectedEntity || 'unknown',
          status: 'error',
          details: {
            error: error.message || 'Unknown error during export',
            format,
            timestamp: new Date().toISOString()
          }
        });
        console.log('Export error logged successfully');
      } catch (logError) {
        console.error("Error logging export error:", logError);
      }
      
      toast({
        title: "Export Failed",
        description: error.message || "An error occurred while exporting data",
        variant: "destructive",
      });
    } finally {
      // Cleanup
      if (link) {
        console.log('Cleaning up download resources...');
        // Use setTimeout to ensure the download has started before cleaning up
        setTimeout(() => {
          if (link && link.parentNode) {

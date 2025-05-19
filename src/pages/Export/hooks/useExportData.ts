
import { toast } from "@/components/ui/use-toast";
import { EntityRecord } from "@/contexts/quickbooks/types";
import { formatDisplayName, getNestedValue } from "@/contexts/quickbooks/entityMapping";

export const useExportData = (
  selectedEntity: string | null, 
  entityState: any,
  selectedFields: string[],
  fileName: string,
  selectedRecords: Record<string, boolean>
) => {
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

  // Convert data to CSV or JSON
  const handleExportData = (records: EntityRecord[], fields: string[], format: "csv" | "json") => {
    if (format === "json") {
      const jsonData = records.map(record => {
        const item: Record<string, any> = {};
        fields.forEach(field => {
          const value = getNestedValue(record, field);
          // Use the display name for the field
          const displayName = formatDisplayName(field);
          item[displayName] = value;
        });
        return item;
      });
      return JSON.stringify(jsonData, null, 2);
    } else {
      // Generate CSV
      const headers = fields.map(field => formatDisplayName(field));
      let csv = headers.join(',') + '\n';
      
      records.forEach(record => {
        const values = fields.map(field => {
          const value = getNestedValue(record, field);
          // Format value for CSV
          if (value === null || value === undefined) return '';
          if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
          if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          return value;
        });
        csv += values.join(',') + '\n';
      });
      
      return csv;
    }
  };

  // Export data
  const handleExport = (format: "csv" | "json" = "csv") => {
    try {
      if (selectedFields.length === 0) {
        toast({
          title: "No Fields Selected",
          description: "Please select at least one field to export",
          variant: "destructive",
        });
        return;
      }
      
      const records = getEntityRecords();
      if (records.length === 0) {
        toast({
          title: "No Data Available",
          description: "No records to export",
          variant: "destructive",
        });
        return;
      }

      // Process records based on selected fields
      const exportData = handleExportData(records, selectedFields, format);
      
      // Create download link
      const fileExtension = format === "csv" ? "csv" : "json";
      const mimeType = format === "csv" ? "text/csv" : "application/json";
      const blob = new Blob([exportData], { type: `${mimeType};charset=utf-8;` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName || selectedEntity || 'export'}.${fileExtension}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `${records.length} records exported to ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error.message || `Error generating ${format.toUpperCase()} file`,
        variant: "destructive",
      });
    }
  };

  return {
    getEntityRecords,
    handleExportData,
    handleExport
  };
};

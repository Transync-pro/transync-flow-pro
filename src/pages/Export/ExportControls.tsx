
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { logOperation } from "@/utils/operationLogger";

interface ExportControlsProps {
  onExportAll: (format: "csv" | "json") => void;
  onExportSelected: (format: "csv" | "json") => (e: React.MouseEvent<HTMLButtonElement>) => void;
  isLoading: boolean;
  hasData: boolean;
  hasSelection: boolean;
}

export const ExportControls = ({
  onExportAll,
  onExportSelected,
  isLoading,
  hasData,
  hasSelection,
}: ExportControlsProps) => {
  
  // Wrapper function to ensure logging happens
  const handleExportClick = async (format: "csv" | "json", isSelected: boolean) => {
    try {
      // Log the export operation before performing it
      await logOperation({
        operationType: 'export',
        entityType: 'data', // This will be overridden in the actual export handler with the specific entity
        status: 'pending',
        details: { 
          format,
          selectedOnly: isSelected,
          timestamp: new Date().toISOString()
        }
      });
      
      // Call the original handler
      if (isSelected) {
        onExportSelected(format)({} as React.MouseEvent<HTMLButtonElement>);
      } else {
        onExportAll(format);
      }
    } catch (error) {
      console.error("Error logging export operation:", error);
      // Still proceed with export even if logging fails
      if (isSelected) {
        onExportSelected(format)({} as React.MouseEvent<HTMLButtonElement>);
      } else {
        onExportAll(format);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium mb-2">Export Format</div>
      <div className="flex flex-col space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => handleExportClick("csv", false)}
            disabled={isLoading || !hasData}
            className="flex items-center justify-center"
            title="Export all records to CSV"
          >
            <Download className="mr-2 h-4 w-4" />
            CSV (All)
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportClick("json", false)}
            disabled={isLoading || !hasData}
            className="flex items-center justify-center"
            title="Export all records to JSON"
          >
            <Download className="mr-2 h-4 w-4" />
            JSON (All)
          </Button>
        </div>
        
        {/* Selected records export buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => handleExportClick("csv", true)}
            disabled={isLoading || !hasSelection}
            className="flex items-center justify-center"
            title="Export selected records to CSV"
          >
            <Download className="mr-2 h-4 w-4" />
            CSV (Selected)
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExportClick("json", true)}
            disabled={isLoading || !hasSelection}
            className="flex items-center justify-center"
            title="Export selected records to JSON"
          >
            <Download className="mr-2 h-4 w-4" />
            JSON (Selected)
          </Button>
        </div>
      </div>
    </div>
  );
};

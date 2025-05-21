
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { logOperation } from "@/utils/operationLogger";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dispatch, SetStateAction } from "react";

interface ExportControlsProps {
  onExportAll: (format: "csv" | "json") => void;
  onExportSelected: (format: "csv" | "json") => (e: React.MouseEvent<HTMLButtonElement>) => void;
  isLoading: boolean;
  hasData: boolean;
  hasSelection: boolean;
  selectedEntity?: string | null;
  // Add the missing props that are being passed from index.tsx
  fileName?: string;
  setFileName?: Dispatch<SetStateAction<string>>;
  selectedRecordsCount?: number;
  onExport?: (format?: "csv" | "json") => Promise<void>;
  disableExport?: boolean;
}

export const ExportControls = ({
  onExportAll,
  onExportSelected,
  isLoading,
  hasData,
  hasSelection,
  selectedEntity = null,
  // Include the new props with default values
  fileName,
  setFileName,
  selectedRecordsCount,
  onExport,
  disableExport,
}: ExportControlsProps) => {
  
  // Enhanced wrapper function with better error handling and logging
  const handleExportClick = async (format: "csv" | "json", isSelected: boolean) => {
    console.log(`Starting export process: ${format} format, selected only: ${isSelected}`);
    
    try {
      // Log the export operation before performing it
      await logOperation({
        operationType: 'export',
        entityType: selectedEntity || 'unknown',
        status: 'pending',
        details: { 
          format,
          selectedOnly: isSelected,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log("Export operation logged successfully, proceeding with export");
      
      // Call the original handler
      if (isSelected) {
        onExportSelected(format)({} as React.MouseEvent<HTMLButtonElement>);
      } else {
        onExportAll(format);
      }
      
      // Log successful completion
      await logOperation({
        operationType: 'export',
        entityType: selectedEntity || 'unknown',
        status: 'success',
        details: { 
          format,
          selectedOnly: isSelected,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log("Export operation completed and logged successfully");
    } catch (error) {
      console.error("Error during export operation:", error);
      
      // Log the failed operation
      try {
        await logOperation({
          operationType: 'export',
          entityType: selectedEntity || 'unknown',
          status: 'error',
          details: { 
            error: error instanceof Error ? error.message : String(error),
            format,
            selectedOnly: isSelected,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error("Failed to log export error:", logError);
      }
      
      toast({
        title: "Export Error",
        description: "An error occurred during the export process. Please try again.",
        variant: "destructive"
      });
    }
  };

  // If onExport function is provided, use it directly
  const handleExportAction = onExport 
    ? () => onExport()
    : undefined;

  return (
    <div className="flex flex-col space-y-4">
      {/* Add file name input if setFileName is provided */}
      {setFileName && (
        <div className="flex flex-col space-y-2">
          <Label htmlFor="file-name">File Name</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="file-name"
              value={fileName || ""}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name"
            />
            <span className="text-sm text-muted-foreground">.csv</span>
          </div>
        </div>
      )}

      {/* Show selected records count if provided */}
      {selectedRecordsCount && selectedRecordsCount > 0 && (
        <div className="bg-muted p-2 rounded-md text-sm">
          <p>{selectedRecordsCount} record(s) selected for export</p>
        </div>
      )}

      {/* Use original export buttons or simplified button based on props */}
      {onExport ? (
        <Button
          className="w-full flex items-center justify-center gap-2"
          onClick={handleExportAction}
          disabled={disableExport}
        >
          <Download className="h-4 w-4" />
          {selectedRecordsCount && selectedRecordsCount > 0
            ? `Export ${selectedRecordsCount} Selected Record${selectedRecordsCount > 1 ? 's' : ''}`
            : 'Export All Records'}
        </Button>
      ) : (
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium">Export All Records</span>
            <div className="flex space-x-2">
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
          </div>

          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium">Export Selected Records</span>
            <div className="flex space-x-2">
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
      )}
    </div>
  );
};


import React from "react";
import { Button } from "@/components/ui/button";
import { FileJson, FileSpreadsheet, Download } from "lucide-react";

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
  hasSelection
}: ExportControlsProps) => {
  return (
    <div className="space-y-2">
      <div className="space-x-2 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExportAll("csv")}
          disabled={isLoading || !hasData}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export All as CSV
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExportAll("json")}
          disabled={isLoading || !hasData}
        >
          <FileJson className="h-4 w-4 mr-2" />
          Export All as JSON
        </Button>
      </div>
      
      <div className="space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExportSelected("csv")}
          disabled={!hasSelection}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Selected as CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExportSelected("json")}
          disabled={!hasSelection}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Selected as JSON
        </Button>
      </div>
    </div>
  );
};

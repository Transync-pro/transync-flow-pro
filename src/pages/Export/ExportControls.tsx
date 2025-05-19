
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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
      <div className="flex flex-col space-y-2">
        <Button
          disabled={isLoading || !hasData}
          variant="outline"
          onClick={() => onExportAll("csv")}
          className="flex items-center justify-center w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          Export All to CSV
        </Button>
        
        <Button
          disabled={isLoading || !hasData}
          variant="outline"
          onClick={() => onExportAll("json")}
          className="flex items-center justify-center w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          Export All to JSON
        </Button>
      </div>
      
      {hasSelection && (
        <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="default"
            onClick={onExportSelected("csv")}
            className="flex items-center justify-center w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Selected to CSV
          </Button>
          
          <Button
            variant="default"
            onClick={onExportSelected("json")}
            className="flex items-center justify-center w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Selected to JSON
          </Button>
        </div>
      )}
    </div>
  );
};

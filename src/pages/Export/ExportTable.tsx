
import React from "react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEntityColumns } from "@/contexts/quickbooks/entityMapping";
import { getNestedValue } from "@/contexts/quickbooks/entityUtils";
import { EntityRecord } from "@/contexts/quickbooks/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface ExportTableProps {
  selectedEntity: string | null;
  isLoading: boolean;
  error: string | null;
  paginatedRecords: any[];
  filteredRecords: any[];
  pageIndex: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  onPageChange: (page: number) => void;
  selectedRecords: Record<string, boolean>;
  selectAllRecords: boolean;
  toggleRecordSelection: (recordId: string) => void;
  toggleSelectAllRecords: () => void;
  selectedRecordsCount: number;
  handleSelectAllPages?: () => void;
}

export const ExportTable: React.FC<ExportTableProps> = ({
  selectedEntity,
  isLoading,
  error,
  paginatedRecords,
  filteredRecords,
  pageIndex,
  pageSize,
  setPageSize,
  onPageChange,
  selectedRecords,
  selectAllRecords,
  toggleRecordSelection,
  toggleSelectAllRecords,
  selectedRecordsCount,
}) => {
  const totalPages = Math.ceil(filteredRecords.length / pageSize);

  // Generate columns for the data table
  const generateColumns = (): ColumnDef<EntityRecord>[] => {
    if (!selectedEntity || !filteredRecords.length) {
      return [];
    }

    // Add checkbox column as first column - updated to select all records across all pages
    const columns: ColumnDef<EntityRecord>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center">
            <Checkbox
              checked={selectAllRecords}
              onCheckedChange={toggleSelectAllRecords}
              aria-label="Select all records across all pages"
            />
            <span className="ml-2 text-xs text-muted-foreground">
              {selectAllRecords ? "All pages selected" : "Select all"}
            </span>
          </div>
        ),
        cell: ({ row }) => {
          const recordId = row.original.Id;
          return recordId ? (
            <Checkbox
              checked={!!selectedRecords[recordId]}
              onCheckedChange={() => toggleRecordSelection(recordId)}
              aria-label="Select row"
            />
          ) : null;
        },
        size: 150,
      },
      {
        accessorFn: (_, index) => pageIndex * pageSize + index + 1,
        header: "S. No.",
        size: 60,
      }
    ];

    // Get column definitions from our entity mapping
    const entityColumnConfigs = getEntityColumns(selectedEntity);
    
    // Convert the column configs to table columns
    const entityColumns = entityColumnConfigs.map(config => {
      return {
        accessorKey: config.field,
        header: config.header,
        cell: ({ row }) => {
          const value = config.accessor 
            ? config.accessor(row.original)
            : getNestedValue(row.original, config.field);
          
          // Format dates
          if (typeof value === 'string' && 
              (config.field.includes('Date') || config.field.includes('Expiration') || config.field.includes('Time'))) {
            try {
              return new Date(value).toLocaleDateString();
            } catch (e) {
              return value || "N/A";
            }
          }
          
          // Format currency amounts
          if ((typeof value === 'number' || !isNaN(parseFloat(value))) && 
              (config.field.includes('Amt') || config.field.includes('Balance') || 
               config.field.includes('Price') || config.field.includes('Amount'))) {
            try {
              return `$${parseFloat(value).toFixed(2)}`;
            } catch (e) {
              return value || "N/A";
            }
          }
          
          // Boolean values
          if (typeof value === 'boolean') {
            return value ? "Yes" : "No";
          }
          
          return value || "N/A";
        },
      };
    });

    return [...columns, ...entityColumns];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {selectedEntity || "Entity"} Records
          {filteredRecords.length > 0 && ` (${filteredRecords.length})`}
          {selectedRecordsCount > 0 && ` • ${selectedRecordsCount} selected`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Modified to show more results without scrolling */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="mt-4">Loading {selectedEntity} records...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8 text-red-500">
              <p className="mt-4">Error: {error}</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedEntity
                ? "No records found. Click 'Fetch Data' to load records."
                : "Select an entity type to get started"}
            </div>
          ) : (
            <div className="min-h-[500px]">
              <DataTable
                columns={generateColumns()}
                data={paginatedRecords}
                pageSize={pageSize}
                className="w-full"
              />
            </div>
          )}
        </div>
        {filteredRecords.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {pageIndex * pageSize + 1} to{" "}
              {Math.min((pageIndex + 1) * pageSize, filteredRecords.length)} of{" "}
              {filteredRecords.length} records
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  onPageChange(0);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>
              
              <Pagination
                currentPage={pageIndex}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


import React, { useState, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
  columns?: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  className?: string;
  // Extended props for our custom implementation
  fields?: string[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: (select: boolean) => void;
}

export function DataTable<TData, TValue>({
  columns: providedColumns,
  data,
  pageSize = 10,
  className,
  fields = [],
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  // Generate columns based on fields if no columns were provided
  const columns = useMemo(() => {
    if (providedColumns) return providedColumns;
    
    if (!fields || fields.length === 0) return [];
    
    const generatedColumns: ColumnDef<TData, any>[] = [];
    
    // Add selection column if onToggleSelect is provided
    if (onToggleSelect) {
      generatedColumns.push({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              if (onSelectAll) {
                onSelectAll(!!value);
              }
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => {
          // @ts-ignore - We know these properties exist even if TypeScript doesn't
          const id = row.original.Id || row.original.id;
          return (
            <Checkbox
              checked={selectedIds?.includes(id)}
              onCheckedChange={() => onToggleSelect?.(id)}
              aria-label="Select row"
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      });
    }
    
    // Add field columns
    fields.forEach(field => {
      generatedColumns.push({
        accessorKey: field,
        header: field,
        cell: ({ row }) => {
          const value = row.getValue(field);
          
          // Handle different value types
          if (value === null || value === undefined) {
            return "-";
          } else if (typeof value === "object") {
            return JSON.stringify(value).substring(0, 50) + "...";
          }
          
          return String(value);
        }
      });
    });
    
    return generatedColumns;
  }, [providedColumns, fields, selectedIds, onToggleSelect, onSelectAll]);
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  });

  return (
    <div className={cn(className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length || 1}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {data.length > pageSize && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

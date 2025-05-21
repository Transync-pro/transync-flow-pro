import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Trash2, AlertCircle, ChevronLeft, Calendar } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { logError } from "@/utils/errorLogger";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Pagination } from "@/components/ui/pagination";
import { getEntityColumns, getNestedValue } from "@/contexts/quickbooks/entityMapping";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";

const Delete = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAll, setSelectedAll] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | null, to: Date | null }>({ from: null, to: null });
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  
  const {
    selectedEntity,
    setSelectedEntity,
    selectedDateRange,
    setSelectedDateRange,
    entityState,
    fetchEntities,
    filterEntities,
    deleteEntity,
    deleteSelectedEntities,
    entityOptions,
    selectedEntityIds,
    setSelectedEntityIds,
    toggleEntitySelection,
    selectAllEntities,
    isDeleting,
    deleteProgress,
    getNestedValue: contextGetNestedValue
  } = useQuickbooksEntities();

  const currentEntityState = selectedEntity ? entityState[selectedEntity] : null;
  const filteredRecords = currentEntityState?.filteredRecords || [];
  const isLoading = currentEntityState?.isLoading || false;
  const error = currentEntityState?.error || null;

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = filteredRecords.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  // Handle date range change
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setSelectedDateRange({ from: dateRange.from, to: dateRange.to });
    }
  }, [dateRange, setSelectedDateRange]);

  // Handle entity selection with explicit fetch
  const handleEntitySelect = (entity: string) => {
    setSelectedEntity(entity);
    setSelectedEntityIds([]);
    setSelectedAll(false);
    // Clear search and don't fetch automatically
    setSearchTerm("");
    setPageIndex(0);
  };

  // Explicitly fetch data when requested by user
  const handleFetchData = async () => {
    try {
      if (!selectedEntity) {
        return;
      }
      if (!dateRange?.from || !dateRange?.to) {
        toast({
          title: "Date Range Required",
          description: "Please select a date range before fetching data.",
          variant: "destructive",
        });
        return;
      }
      await fetchEntities();
    } catch (error) {
      logError(`Error fetching ${selectedEntity} data for deletion`, {
        source: "Delete",
        stack: error instanceof Error ? error.stack : undefined,
        context: { selectedEntity }
      });
    }
  };

  // Handle search input
  const handleSearch = () => {
    if (!selectedEntity) return;
    filterEntities(searchTerm);
    setPageIndex(0);
  };

  // Handle checkbox select all
  const handleSelectAll = (checked: boolean) => {
    setSelectedAll(checked);
    selectAllEntities(checked, paginatedRecords);
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  // Handle actual deletion
  const handleDelete = async () => {
    try {
      await deleteSelectedEntities(selectedEntityIds);
      setSelectedEntityIds([]);
      setSelectedAll(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      logError(`Error deleting ${selectedEntity} entities`, {
        source: "Delete",
        stack: error instanceof Error ? error.stack : undefined,
        context: { selectedEntity, selectedEntityIds }
      });
    }
  };

  // Navigate back to dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
  };

  // Generate columns for the data table
  const generateColumns = (): ColumnDef<any>[] => {
    if (!selectedEntity || !filteredRecords.length) {
      return [];
    }

    // Add S. No. column as first column
    const columns: ColumnDef<any>[] = [
      {
        id: "select",
        header: ({ table }) => (
  <Checkbox
    checked={selectedAll && selectedEntityIds.length === filteredRecords.length}
    onCheckedChange={(checked) => {
      setSelectedAll(!!checked);
      selectAllEntities(!!checked, filteredRecords);
    }}
    aria-label="Select all records across all pages"
    data-testid="select-all-pages-checkbox"
  />
),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedEntityIds.includes(row.original.Id)}
            onCheckedChange={() => toggleEntitySelection(row.original.Id)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
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
    const entityColumns: ColumnDef<any>[] = entityColumnConfigs.map(config => {
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
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <DeleteConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={handleDelete}
          entityType={selectedEntity || ""}
          count={selectedEntityIds.length}
          isDeleting={isDeleting}
          progress={deleteProgress}
        />

        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            onClick={handleBackToDashboard} 
            className="flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-semibold">Delete QuickBooks Data</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Records to Delete</CardTitle>
            <CardDescription>
              Choose an entity type, fetch records, then select items to delete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col space-y-2 flex-grow">
                <Label htmlFor="entity-type">Entity Type</Label>
                <Select
                  value={selectedEntity || ""}
                  onValueChange={handleEntitySelect}
                >
                  <SelectTrigger id="entity-type">
                    <SelectValue placeholder="Select an entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {entityOptions.map((entity) => (
                      <SelectItem key={entity.value} value={entity.value}>
                        {entity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-2 flex-grow">
                <Label>Date Range (Required)</Label>
                <DatePicker
                  selectsRange
                  startDate={dateRange.from}
                  endDate={dateRange.to}
                  onChange={(dates) => {
                    const [start, end] = dates as [Date | null, Date | null];
                    setDateRange({ from: start, to: end });
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
        {selectedEntityIds.length > 0 && (
          <CardFooter className="flex justify-between">
            <p className="text-sm text-gray-500">
              {selectedEntityIds.length} item(s) selected
            </p>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="flex items-center"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Selected
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  </DashboardLayout>
);
                onClick={confirmDelete}
                className="flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Selected
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Delete;

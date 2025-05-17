
import { useEffect, useState } from "react";
import { useQuickbooksEntities } from "@/contexts/QuickbooksEntitiesContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Trash2, AlertCircle } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { logError } from "@/utils/errorLogger";

const Delete = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAll, setSelectedAll] = useState(false);
  
  const {
    selectedEntity,
    setSelectedEntity,
    entityState,
    fetchEntities,
    filterEntities,
    deleteSelectedEntities,
    entityOptions,
    selectedEntityIds,
    setSelectedEntityIds,
    toggleEntitySelection,
    selectAllEntities,
    isDeleting,
    deleteProgress
  } = useQuickbooksEntities();

  const currentEntityState = selectedEntity ? entityState[selectedEntity] : null;
  const filteredRecords = currentEntityState?.filteredRecords || [];
  const isLoading = currentEntityState?.isLoading || false;
  const error = currentEntityState?.error || null;

  // Handle entity selection with explicit fetch
  const handleEntitySelect = (entity: string) => {
    setSelectedEntity(entity);
    setSelectedEntityIds([]);
    setSelectedAll(false);
    // Clear search and don't fetch automatically
    setSearchTerm("");
  };

  // Explicitly fetch data when requested by user
  const handleFetchData = async () => {
    try {
      if (!selectedEntity) {
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
  };

  // Handle checkbox select all
  const handleSelectAll = (checked: boolean) => {
    setSelectedAll(checked);
    selectAllEntities(checked);
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

  // Generate columns for the data table
  const generateColumns = (): ColumnDef<any>[] => {
    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={selectedAll}
            onCheckedChange={(checked) => {
              handleSelectAll(!!checked);
            }}
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
        accessorKey: "Id",
        header: "ID",
      },
      {
        accessorKey: "DisplayName",
        header: "Name",
        cell: ({ row }) => row.original.DisplayName || row.original.Name || row.original.FullyQualifiedName || row.original.DocNumber || row.original.Id,
      },
      {
        accessorKey: "MetaData.CreateTime",
        header: "Created",
        cell: ({ row }) => {
          const createTime = row.original.MetaData?.CreateTime;
          return createTime ? new Date(createTime).toLocaleDateString() : "N/A";
        },
      },
      {
        accessorKey: "Active",
        header: "Status",
        cell: ({ row }) => (row.original.Active === false ? "Inactive" : "Active"),
      },
    ];
  };

  return (
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
          <div className="flex flex-col space-y-2">
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

          {selectedEntity && (
            <Button
              onClick={handleFetchData}
              disabled={isLoading}
              className="flex items-center"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isLoading ? "Loading Data..." : "Fetch Data"}
            </Button>
          )}

          {selectedEntity && !isLoading && filteredRecords.length > 0 && (
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleSearch}
                className="flex items-center"
              >
                <Search className="h-4 w-4" />
                <span className="ml-2 hidden md:inline">Search</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedEntity || "Entity"} Records
            {filteredRecords.length > 0 && ` (${filteredRecords.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="mt-4">Loading {selectedEntity} records...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8 text-red-500">
              <AlertCircle className="h-8 w-8" />
              <p className="mt-4">Error: {error}</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedEntity
                ? "No records found. Click 'Fetch Data' to load records."
                : "Select an entity type to get started"}
            </div>
          ) : (
            <>
              <DataTable
                columns={generateColumns()}
                data={filteredRecords}
                pageSize={10}
              />
            </>
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
  );
};

export default Delete;

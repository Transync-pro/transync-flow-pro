import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle, XCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { getAccessToken, getRealmId, deleteQuickbooksEntity, logOperation } from "@/services/quickbooksApi";

interface DeleteProgress {
  total: number;
  current: number;
  success: number;
  failed: number;
  details: { id: string; status: "success" | "error"; error?: string }[];
}

const Delete = () => {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [records, setRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<DeleteProgress>({
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    details: [],
  });
  const { user } = useAuth();
  const { getAccessToken, getRealmId } = useQuickbooks();
  const navigate = useNavigate();

  const entityOptions = [
    { value: "Customer", label: "Customer" },
    { value: "Invoice", label: "Invoice" },
    { value: "Item", label: "Item" },
    { value: "Bill", label: "Bill" },
  ];

  useEffect(() => {
    const fetchRecords = async () => {
      if (!selectedEntity || !selectedDateRange?.from || !selectedDateRange?.to) {
        setRecords([]);
        setFilteredRecords([]);
        return;
      }

      try {
        const accessToken = await getAccessToken();
        const realmId = await getRealmId();

        if (!accessToken || !realmId) {
          throw new Error("QuickBooks connection not available");
        }

        // Fetch records from QuickBooks based on entity and date range
        // (This is a placeholder - replace with actual API call)
        const fetchedRecords = [
          { id: "1", name: "Record 1", date: selectedDateRange.from.toISOString() },
          { id: "2", name: "Record 2", date: selectedDateRange.from.toISOString() },
          { id: "3", name: "Record 3", date: selectedDateRange.to.toISOString() },
        ];

        setRecords(fetchedRecords);
        setFilteredRecords(fetchedRecords);
      } catch (error) {
        console.error("Error fetching records:", error);
        toast({
          title: "Error",
          description: "Failed to fetch records from QuickBooks.",
          variant: "destructive",
        });
      }
    };

    fetchRecords();
  }, [selectedEntity, selectedDateRange, getAccessToken, getRealmId]);

  const handleFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = records.filter((record) => {
      // Customize the filter logic based on your record structure
      return record.name.toLowerCase().includes(searchTerm);
    });
    setFilteredRecords(filtered);
  };

  const handleDeleteRecords = async () => {
    if (!selectedEntity || !selectedDateRange || !filteredRecords.length) return;
    
    setIsDeleting(true);
    
    try {
      const accessToken = await getAccessToken();
      const realmId = await getRealmId();
      
      if (!accessToken || !realmId) {
        throw new Error("QuickBooks connection not available");
      }

      setDeleteProgress({
        total: recordsToDelete.length,
        current: 0,
        success: 0,
        failed: 0,
        details: []
      });
      
      const deletionResults = {
        success: 0,
        failed: 0,
        details: []
      };
      
      for (const [index, record] of recordsToDelete.entries()) {
        try {
          await deleteQuickbooksEntity(accessToken, realmId, selectedEntity, record.id);
          
          deletionResults.success++;
          deletionResults.details.push({ id: record.id, status: "success" });
        } catch (error) {
          deletionResults.failed++;
          deletionResults.details.push({ id: record.id, status: "error", error: error.message });
        } finally {
          setDeleteProgress(prev => ({
            ...prev,
            current: index + 1,
            success: deletionResults.success,
            failed: deletionResults.failed,
            details: deletionResults.details
          }));
        }
      }
      
      await logOperation({
        operationType: "delete",
        entityType: selectedEntity,
        recordId: "batch",
        status: deletionResults.failed > 0 ? "partial" : "success",
        details: {
          total: recordsToDelete.length,
          success: deletionResults.success,
          failed: deletionResults.failed,
          errors: deletionResults.details.filter(d => d.status === "error")
        }
      });
      
      toast({
        title: "Deletion Complete",
        description: `Successfully deleted ${deletionResults.success} records. ${deletionResults.failed} failed.`,
        variant: deletionResults.failed > 0 ? "warning" : "default"
      });
    } catch (error) {
      console.error("Error deleting records:", error);
      toast({
        title: "Deletion Failed",
        description: "An error occurred while deleting records.",
        variant: "destructive",
      });
      
      await logOperation({
        operationType: "delete",
        entityType: selectedEntity,
        recordId: "batch",
        status: "error",
        details: { error: error.message }
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const recordsToDelete = filteredRecords;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Delete Records</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="entity">Select Entity</Label>
          <Select onValueChange={setSelectedEntity}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an entity" />
            </SelectTrigger>
            <SelectContent>
              {entityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Select Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDateRange?.from ? (
                  selectedDateRange.to ? (
                    `${format(selectedDateRange.from, "PPP")} - ${format(
                      selectedDateRange.to,
                      "PPP"
                    )}`
                  ) : (
                    format(selectedDateRange.from, "PPP")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="range"
                defaultMonth={selectedDateRange?.from}
                selected={selectedDateRange}
                onSelect={setSelectedDateRange}
                disabled={{ before: new Date("2023-01-01") }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mb-4">
        <Label htmlFor="filter">Filter Records</Label>
        <Input
          type="text"
          id="filter"
          placeholder="Filter by name"
          onChange={handleFilter}
        />
      </div>

      <div className="mb-4">
        <Table>
          <TableCaption>
            Records to be deleted ({filteredRecords.length})
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.id}</TableCell>
                <TableCell>{record.name}</TableCell>
                <TableCell>{record.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isDeleting || filteredRecords.length === 0}
            >
              Delete Records
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you absolutely sure you want to delete these records?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All the selected records will be
                permanently deleted from QuickBooks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRecords} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {isDeleting && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Deletion Progress</h2>
          <progress
            max={deleteProgress.total}
            value={deleteProgress.current}
            className="w-full h-4"
          />
          <p className="text-sm mt-2">
            {deleteProgress.current} of {deleteProgress.total} records processed.
          </p>
          <p className="text-sm">
            Success: {deleteProgress.success}, Failed: {deleteProgress.failed}
          </p>

          {deleteProgress.details.length > 0 && (
            <div className="mt-4">
              <h3 className="text-md font-semibold">Deletion Details</h3>
              <ul>
                {deleteProgress.details.map((detail) => (
                  <li key={detail.id} className="flex items-center space-x-2">
                    <span>Record ID: {detail.id}</span>
                    {detail.status === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {detail.error && <span>Error: {detail.error}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Delete;


import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useState, useEffect } from "react";

interface EntitySelectProps {
  selectedEntity: string | null;
  entityOptions: { label: string; value: string }[];
  onChange: (entity: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
  isRequired?: boolean;
  onFetchData?: () => void;
}

export const EntitySelect = ({ 
  selectedEntity, 
  entityOptions, 
  onChange, 
  dateRange, 
  setDateRange,
  isRequired = true,
  onFetchData
}: EntitySelectProps) => {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // Clear error when dateRange changes
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setDateError(null);
    }
  }, [dateRange]);

  // Function to validate date before fetching data
  const validateAndFetch = () => {
    if (isRequired && (!dateRange?.from || !dateRange?.to)) {
      setDateError("Date range is required");
      return false;
    }
    
    if (onFetchData) {
      onFetchData();
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="entity" className="block mb-2">
          Entity Type
        </Label>
        <Select
          value={selectedEntity || ""}
          onValueChange={onChange}
        >
          <SelectTrigger id="entity">
            <SelectValue placeholder="Select an entity type" />
          </SelectTrigger>
          <SelectContent>
            {entityOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="block">
          Date Range {isRequired && <span className="text-red-500">*</span>}
        </Label>
        
        <div className="flex flex-col gap-2">
          {/* Start Date Picker */}
          <div className="w-full">
            <Label className="text-sm text-muted-foreground mb-1.5 block">Start Date</Label>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    (!dateRange?.from && isRequired) && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    format(dateRange.from, "LLL dd, y")
                  ) : (
                    <span>Select start date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="single"
                  defaultMonth={dateRange?.from || undefined}
                  selected={dateRange?.from || undefined}
                  onSelect={(date) => {
                    setDateRange({ 
                      from: date || undefined, 
                      to: dateRange?.to 
                    });
                    if (date) {
                      setStartDateOpen(false);
                    }
                  }}
                  numberOfMonths={1}
                  className="p-3 pointer-events-auto"
                  captionLayout="dropdown"
                  fromYear={2000}
                  toYear={2030}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* End Date Picker */}
          <div className="w-full">
            <Label className="text-sm text-muted-foreground mb-1.5 block">End Date</Label>
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    (!dateRange?.to && isRequired) && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.to ? (
                    format(dateRange.to, "LLL dd, y")
                  ) : (
                    <span>Select end date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="single"
                  defaultMonth={dateRange?.to || dateRange?.from || undefined}
                  selected={dateRange?.to || undefined}
                  onSelect={(date) => {
                    setDateRange({
                      from: dateRange?.from,
                      to: date || undefined
                    });
                    if (date) {
                      setEndDateOpen(false);
                    }
                  }}
                  numberOfMonths={1}
                  className="p-3 pointer-events-auto"
                  captionLayout="dropdown"
                  fromYear={2000}
                  toYear={2030}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {dateError && isRequired && (
          <p className="text-red-500 text-sm mt-1">{dateError}</p>
        )}
      </div>
      
      {onFetchData && selectedEntity && (
        <Button 
          onClick={validateAndFetch}
          className="mt-4"
          disabled={isRequired && (!dateRange?.from || !dateRange?.to)}
        >
          Fetch Data
        </Button>
      )}
    </div>
  );
};

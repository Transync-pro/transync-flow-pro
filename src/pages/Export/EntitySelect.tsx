
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useState } from "react";

interface EntitySelectProps {
  selectedEntity: string | null;
  entityOptions: { label: string; value: string }[];
  onChange: (entity: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
  isRequired?: boolean;
}

export const EntitySelect = ({ 
  selectedEntity, 
  entityOptions, 
  onChange, 
  dateRange, 
  setDateRange,
  isRequired = false 
}: EntitySelectProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  return (
    <div className="space-y-4">
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

      <div>
        <Label className="block mb-2">
          Date Range {isRequired && <span className="text-red-500">*</span>}
        </Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange?.from && "text-muted-foreground",
                isRequired && !dateRange?.from && "border-red-500"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : isRequired ? (
                <span className="text-red-500">Select a date range (required)</span>
              ) : (
                <span>Select a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                // Close the popover if both from and to dates are selected
                if (range?.from && range?.to) {
                  setIsCalendarOpen(false);
                }
              }}
              numberOfMonths={2}
              className="p-3"
            />
          </PopoverContent>
        </Popover>
        {isRequired && !dateRange?.from && (
          <p className="text-red-500 text-sm mt-1">Date range is required</p>
        )}
      </div>
    </div>
  );
};

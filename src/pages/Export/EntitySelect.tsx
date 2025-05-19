
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface EntitySelectProps {
  selectedEntity: string | null;
  entityOptions: { value: string; label: string }[];
  onChange: (entity: string) => void;
  dateRange?: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

export const EntitySelect = ({ 
  selectedEntity, 
  entityOptions, 
  onChange,
  dateRange,
  setDateRange 
}: EntitySelectProps) => {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col space-y-2 flex-grow">
        <Label htmlFor="entity-select">Entity Type</Label>
        <Select 
          value={selectedEntity || ""} 
          onValueChange={onChange}
        >
          <SelectTrigger id="entity-select">
            <SelectValue placeholder="Select an entity type" />
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
      
      <div className="flex flex-col space-y-2 flex-grow">
        <Label>Date Range (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Select date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        {dateRange && dateRange.from && (
          <Button 
            variant="ghost" 
            onClick={() => setDateRange(undefined)}
            size="sm"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

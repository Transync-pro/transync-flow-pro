
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FilterControlsProps {
  filterField: string | null;
  filterValue: string;
  availableFields: string[];
  setFilterField: (field: string | null) => void;
  setFilterValue: (value: string) => void;
  onApplyFilter: () => void;
}

export const FilterControls = ({
  filterField,
  filterValue,
  availableFields,
  setFilterField,
  setFilterValue,
  onApplyFilter
}: FilterControlsProps) => {
  return (
    <div className="p-4 border rounded-md space-y-4">
      <h3 className="font-medium">Filter Data</h3>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Select value={filterField || ""} onValueChange={(value) => setFilterField(value || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((field) => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Input
            placeholder="Filter value"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          />
        </div>
        <div>
          <Button onClick={onApplyFilter} disabled={!filterField}>
            Apply Filter
          </Button>
        </div>
      </div>
    </div>
  );
};

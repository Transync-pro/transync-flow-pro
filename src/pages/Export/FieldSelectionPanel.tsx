
import React from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FieldSelectionPanelProps {
  availableFields: string[];
  selectedFields: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onFieldToggle: (field: string) => void;
  onSelectAll: (select: boolean) => void;
  filteredFields: string[];
}

export const FieldSelectionPanel = ({
  availableFields,
  selectedFields,
  searchQuery,
  setSearchQuery,
  onFieldToggle,
  onSelectAll,
  filteredFields
}: FieldSelectionPanelProps) => {
  const allSelected = availableFields.length > 0 && 
    selectedFields.length === availableFields.length;
  
  const someSelected = selectedFields.length > 0 && 
    selectedFields.length < availableFields.length;

  return (
    <div className="border rounded-md p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Select Fields to Export</h3>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => onSelectAll(true)}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={() => onSelectAll(false)}>
            Clear All
          </Button>
        </div>
      </div>
      
      <div>
        <Input
          placeholder="Search fields..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-2 p-2">
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="select-all-fields"
            checked={allSelected}
            onCheckedChange={(checked) => onSelectAll(checked === true)}
            className="data-[state=indeterminate]:bg-primary"
            {...(someSelected ? { 'data-state': 'indeterminate' } as any : {})}
          />
          <Label htmlFor="select-all-fields" className="font-medium">
            {allSelected ? "Deselect All" : "Select All"} ({availableFields.length} fields)
          </Label>
        </div>
      
        {filteredFields.map((field) => (
          <div key={field} className="flex items-center space-x-2">
            <Checkbox
              id={`field-${field}`}
              checked={selectedFields.includes(field)}
              onCheckedChange={() => onFieldToggle(field)}
            />
            <Label htmlFor={`field-${field}`} className="cursor-pointer">
              {field}
            </Label>
          </div>
        ))}
        
        {filteredFields.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">
            No fields match your search
          </p>
        )}
      </div>
    </div>
  );
};

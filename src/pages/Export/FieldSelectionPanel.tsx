
import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDisplayName } from "@/contexts/quickbooks/entityMapping";

interface FieldSelectionPanelProps {
  availableFields: string[];
  selectedFields: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onFieldToggle: (field: string) => void;
  onSelectAll: (select: boolean) => void;
  filteredFields: string[];
  // Add the props being passed from index.tsx
  toggleFieldSelection?: (field: string) => void;
  handleSelectAllFields?: (select: boolean) => void;
}

export const FieldSelectionPanel = ({
  availableFields,
  selectedFields,
  searchQuery,
  setSearchQuery,
  onFieldToggle,
  onSelectAll,
  filteredFields,
  // Include the new props and set them to use the original props if provided
  toggleFieldSelection,
  handleSelectAllFields
}: FieldSelectionPanelProps) => {
  // Use the provided toggle function or fall back to the original
  const handleFieldToggle = toggleFieldSelection || onFieldToggle;
  
  // Use the provided select all function or fall back to the original
  const handleSelectAll = handleSelectAllFields || onSelectAll;
  
  const isAllSelected = availableFields.length > 0 && 
                        selectedFields.length === availableFields.length;
                        
  const isPartiallySelected = selectedFields.length > 0 && 
                              selectedFields.length < availableFields.length;

  return (
    <div className="mt-4">
      <div className="flex flex-col space-y-2">
        <Label htmlFor="search-fields">Select Fields to Export</Label>
        <Input
          id="search-fields"
          placeholder="Search fields..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-2"
        />
        
        <div className="flex items-center space-x-2 mb-2">
          <Checkbox
            id="select-all-fields"
            checked={isAllSelected}
            data-state={isPartiallySelected ? "indeterminate" : isAllSelected ? "checked" : "unchecked"}
            onCheckedChange={(checked) => handleSelectAll(!!checked)}
          />
          <Label htmlFor="select-all-fields">Select All Fields</Label>
        </div>
        
        <ScrollArea className="h-[200px] border rounded p-2">
          <div className="space-y-2">
            {filteredFields.map((field) => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox
                  id={`field-${field}`}
                  checked={selectedFields.includes(field)}
                  onCheckedChange={() => handleFieldToggle(field)}
                />
                <Label htmlFor={`field-${field}`} className="text-sm">
                  {formatDisplayName(field)}
                </Label>
              </div>
            ))}
            {filteredFields.length === 0 && (
              <div className="text-sm text-gray-500 p-2">
                No fields match your search
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

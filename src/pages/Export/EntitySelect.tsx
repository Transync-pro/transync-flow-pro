
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface EntitySelectProps {
  selectedEntity: string | null;
  entityOptions: { value: string; label: string }[];
  onChange: (entity: string) => void;
}

export const EntitySelect = ({ 
  selectedEntity, 
  entityOptions, 
  onChange 
}: EntitySelectProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="entity-select">Entity Type</Label>
      <Select 
        value={selectedEntity || ""} 
        onValueChange={onChange}
      >
        <SelectTrigger id="entity-select" className="w-full">
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
  );
};

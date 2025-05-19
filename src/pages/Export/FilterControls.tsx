
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FilterControlsProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onSearch: () => void;
}

export const FilterControls = ({
  searchTerm,
  setSearchTerm,
  onSearch
}: FilterControlsProps) => {
  return (
    <div className="flex space-x-2">
      <div className="flex-1">
        <Input
          placeholder="Search by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
      </div>
      <Button
        variant="outline"
        onClick={onSearch}
        className="flex items-center"
      >
        <Search className="h-4 w-4" />
        <span className="ml-2 hidden md:inline">Search</span>
      </Button>
    </div>
  );
};

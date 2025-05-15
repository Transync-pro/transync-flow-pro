
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Entity } from "./EntitySelection";

interface CategoryHeaderProps {
  category: string;
  entities: Entity[];
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: (category: string, entities: Entity[]) => void;
  onClick: () => void;
  isExpanded: boolean;
}

export const CategoryHeader = ({
  category,
  entities,
  allSelected,
  someSelected,
  onToggleAll,
  onClick,
  isExpanded
}: CategoryHeaderProps) => {
  return (
    <div
      className="p-4 border-b flex items-center justify-between cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          id={`category-${category}`}
          checked={allSelected}
          className={someSelected ? "bg-gray-400" : ""}
          onCheckedChange={() => onToggleAll(category, entities)}
          onClick={(e) => e.stopPropagation()}
        />
        <Label
          htmlFor={`category-${category}`}
          className="text-lg font-medium cursor-pointer"
        >
          {category}
        </Label>
        <Badge variant="outline" className="ml-2">
          {entities.length}
        </Badge>
      </div>
      <div>
        {isExpanded ? (
          <span className="text-lg">▼</span>
        ) : (
          <span className="text-lg">►</span>
        )}
      </div>
    </div>
  );
};

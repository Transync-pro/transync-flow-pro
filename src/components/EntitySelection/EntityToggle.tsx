
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Entity } from "./EntitySelection";

interface EntityToggleProps {
  entity: Entity;
  isSelected: boolean;
  onToggle: (entity: Entity) => void;
}

export const EntityToggle = ({ entity, isSelected, onToggle }: EntityToggleProps) => {
  return (
    <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
      <Checkbox
        id={entity.id}
        checked={isSelected}
        onCheckedChange={() => onToggle(entity)}
      />
      <Label
        htmlFor={entity.id}
        className="flex items-center cursor-pointer"
      >
        <span className="mr-2">{entity.icon}</span>
        {entity.name}
      </Label>
    </div>
  );
};

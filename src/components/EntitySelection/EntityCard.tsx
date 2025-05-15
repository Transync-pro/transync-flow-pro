
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Entity, EntityGroup } from "./EntityGroups";

interface EntityCardProps {
  group: EntityGroup;
  selectedEntities: Entity[];
  onEntityToggle: (entity: Entity) => void;
  onToggleAll: (category: string, entities: Entity[]) => void;
}

export const EntityCard = ({ 
  group, 
  selectedEntities, 
  onEntityToggle,
  onToggleAll
}: EntityCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const allSelected = group.entities.every((entity) =>
    selectedEntities.some((e) => e.id === entity.id)
  );
  
  const someSelected =
    !allSelected &&
    group.entities.some((entity) =>
      selectedEntities.some((e) => e.id === entity.id)
    );

  return (
    <Card key={group.category}>
      <div
        className="p-4 border-b flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Checkbox
            id={`category-${group.category}`}
            checked={allSelected}
            className={someSelected ? "bg-gray-400" : ""}
            onCheckedChange={() =>
              onToggleAll(group.category, group.entities)
            }
            onClick={(e) => e.stopPropagation()}
          />
          <Label
            htmlFor={`category-${group.category}`}
            className="text-lg font-medium cursor-pointer"
          >
            {group.category}
          </Label>
          <Badge variant="outline" className="ml-2">
            {group.entities.length}
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
      {isExpanded && (
        <CardContent className="pt-4 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.entities.map((entity) => (
              <div
                key={entity.id}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50"
              >
                <Checkbox
                  id={entity.id}
                  checked={selectedEntities.some(
                    (e) => e.id === entity.id
                  )}
                  onCheckedChange={() => onEntityToggle(entity)}
                />
                <Label
                  htmlFor={entity.id}
                  className="flex items-center cursor-pointer"
                >
                  <span className="mr-2">{entity.icon}</span>
                  {entity.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

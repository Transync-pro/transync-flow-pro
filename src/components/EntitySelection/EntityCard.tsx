
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Entity, EntityGroup } from "./EntityGroups";
import { CategoryHeader } from "./CategoryHeader";
import { EntityGrid } from "./EntityGrid";

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
      <CategoryHeader
        category={group.category}
        entities={group.entities}
        allSelected={allSelected}
        someSelected={someSelected}
        onToggleAll={onToggleAll}
        onClick={() => setIsExpanded(!isExpanded)}
        isExpanded={isExpanded}
      />
      
      {isExpanded && (
        <CardContent className="pt-4 pb-2">
          <EntityGrid
            entities={group.entities}
            selectedEntities={selectedEntities}
            onEntityToggle={onEntityToggle}
          />
        </CardContent>
      )}
    </Card>
  );
};

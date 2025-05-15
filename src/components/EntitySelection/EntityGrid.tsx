
import { Entity } from "./EntitySelection";
import { EntityToggle } from "./EntityToggle";

interface EntityGridProps {
  entities: Entity[];
  selectedEntities: Entity[];
  onEntityToggle: (entity: Entity) => void;
}

export const EntityGrid = ({ entities, selectedEntities, onEntityToggle }: EntityGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entities.map((entity) => (
        <EntityToggle
          key={entity.id}
          entity={entity}
          isSelected={selectedEntities.some((e) => e.id === entity.id)}
          onToggle={onEntityToggle}
        />
      ))}
    </div>
  );
};

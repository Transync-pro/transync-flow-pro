
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { entityGroups } from "./EntityGroups";
import { EntityCard } from "./EntityCard";

export type Entity = {
  id: string;
  name: string;
  icon: string;
};

interface EntitySelectionProps {
  title: string;
  description: string;
  actionText: string;
  onContinue: (selectedEntities: Entity[]) => void;
  actionColor?: string;
}

const EntitySelection = ({
  title,
  description,
  actionText,
  onContinue,
  actionColor = "bg-transyncpro-button hover:bg-transyncpro-button/90",
}: EntitySelectionProps) => {
  const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);

  const handleEntityToggle = (entity: Entity) => {
    setSelectedEntities((prev) => {
      const isSelected = prev.some((e) => e.id === entity.id);
      if (isSelected) {
        return prev.filter((e) => e.id !== entity.id);
      } else {
        return [...prev, entity];
      }
    });
  };

  const toggleAllInCategory = (category: string, entities: Entity[]) => {
    const categoryEntityIds = entities.map((e) => e.id);
    const allSelected = entities.every((entity) =>
      selectedEntities.some((e) => e.id === entity.id)
    );

    if (allSelected) {
      // Deselect all in this category
      setSelectedEntities((prev) =>
        prev.filter((e) => !categoryEntityIds.includes(e.id))
      );
    } else {
      // Select all in this category
      const currentSelected = selectedEntities.filter(
        (e) => !categoryEntityIds.includes(e.id)
      );
      setSelectedEntities([...currentSelected, ...entities]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-gray-500 mt-1">{description}</p>
      </div>

      <div className="grid gap-6">
        {entityGroups.map((group) => (
          <EntityCard
            key={group.category}
            group={group}
            selectedEntities={selectedEntities}
            onEntityToggle={handleEntityToggle}
            onToggleAll={toggleAllInCategory}
          />
        ))}
      </div>

      <div className="flex justify-end mt-6">
        <Button
          onClick={() => onContinue(selectedEntities)}
          className={`${actionColor} ${
            selectedEntities.length === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={selectedEntities.length === 0}
        >
          {actionText} ({selectedEntities.length})
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default EntitySelection;

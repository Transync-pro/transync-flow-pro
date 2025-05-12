
import { useState } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import EntitySelection, { Entity } from "@/components/EntitySelection/EntitySelection";
import { toast } from "@/hooks/use-toast";

const Import = () => {
  const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);
  const [step, setStep] = useState<"select" | "configure" | "map" | "review" | "import">("select");

  const handleEntitySelection = (entities: Entity[]) => {
    setSelectedEntities(entities);
    toast({
      title: "Entities Selected",
      description: `You've selected ${entities.length} entities for import.`,
    });
    setStep("configure");
    // In a real implementation, we would navigate to the next step here
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {step === "select" && (
          <EntitySelection
            title="Import Data"
            description="Select which QuickBooks entities you want to import data for."
            actionText="Continue to Import"
            onContinue={handleEntitySelection}
            actionColor="bg-blue-500 hover:bg-blue-600"
          />
        )}
        {step === "configure" && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Configure Import</h2>
            <p>
              This is where you would configure import settings for the selected entities:
              {selectedEntities.map((entity) => (
                <span
                  key={entity.id}
                  className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-800 mr-2 mt-2"
                >
                  {entity.icon} {entity.name}
                </span>
              ))}
            </p>
            <p className="text-gray-500 mt-4">
              Further implementation would include file upload, date range selection, and
              import settings configuration.
            </p>
          </div>
        )}
        {/* Additional steps would be implemented here */}
      </div>
    </DashboardLayout>
  );
};

export default Import;

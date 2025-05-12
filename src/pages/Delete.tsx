
import { useState } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import EntitySelection, { Entity } from "@/components/EntitySelection/EntitySelection";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Delete = () => {
  const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);
  const [step, setStep] = useState<"select" | "configure" | "confirm" | "delete">("select");
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  const handleEntitySelection = (entities: Entity[]) => {
    setSelectedEntities(entities);
    setShowWarningDialog(true);
  };

  const handleConfirmSelection = () => {
    setShowWarningDialog(false);
    toast({
      title: "Entities Selected",
      description: `You've selected ${selectedEntities.length} entities for deletion.`,
    });
    setStep("configure");
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {step === "select" && (
          <EntitySelection
            title="Delete Data"
            description="Select which QuickBooks entities you want to delete data from."
            actionText="Continue to Delete"
            onContinue={handleEntitySelection}
            actionColor="bg-red-500 hover:bg-red-600"
          />
        )}
        {step === "configure" && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Configure Deletion</h2>
            <p>
              This is where you would configure deletion settings for the selected entities:
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
              Further implementation would include filters, criteria selection, and
              date range options for the deletion operation.
            </p>
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 font-medium">
                Warning: Deletion operations cannot be undone and may affect related records.
                Please configure filters carefully to avoid unintended data loss.
              </p>
            </div>
          </div>
        )}
        {/* Additional steps would be implemented here */}

        <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Data Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                You're about to begin a process that could result in the permanent deletion of data from your QuickBooks account. 
                This action cannot be undone once completed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmSelection} className="bg-red-500 text-white hover:bg-red-600">
                I Understand, Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Delete;

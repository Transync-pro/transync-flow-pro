
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import EntitySelection from "@/components/EntitySelection/EntitySelection";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Entity } from "@/components/EntitySelection/EntitySelection";

const Dashboard = () => {
  const { toast } = useToast();
  const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);

  const handleContinue = (entities: Entity[]) => {
    setSelectedEntities(entities);
    
    toast({
      title: "Entities Selected",
      description: `You've selected ${entities.length} entities for processing.`,
    });
  };
  
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-text">TransyncPro Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Select the QuickBooks entities you want to work with
          </p>
        </div>
        
        <EntitySelection
          title="QuickBooks Entities"
          description="Choose the QuickBooks entities you want to include in your operations."
          actionText="Continue"
          onContinue={handleContinue}
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

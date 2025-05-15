import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const { toast } = useToast();
  
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-text">TransyncPro Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome to TransyncPro. Use the sidebar to navigate to different features.
          </p>
        </div>
        
        {/* We've reverted back to using DashboardHome as the main component instead of EntitySelection */}
        <div className="dashboard-content">
          {/* This will be filled by DashboardHome component that is rendered inside DashboardLayout */}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

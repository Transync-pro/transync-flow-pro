
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { Outlet } from "react-router-dom";

const Export = () => {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default Export;

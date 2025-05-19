
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import ComingSoon from "./ComingSoon";

const Import = () => {
  return (
    <DashboardLayout>
      <ComingSoon 
        title="Import Functionality"
        description="We're working on the ability to import data from various sources into QuickBooks."
        estimatedRelease="Coming in Q3 2025"
        features={[
          "CSV file imports with custom field mapping",
          "Data validation and error checking",
          "Scheduled automatic imports",
          "Support for all major QuickBooks entity types",
          "Import history and logs"
        ]}
      />
    </DashboardLayout>
  );
};

export default Import;

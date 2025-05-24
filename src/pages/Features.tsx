
import { Check } from "lucide-react";
import PageLayout from "@/components/PageLayout";

const Features = () => {
  const features = [
    {
      title: "Bulk Import",
      description: "Import multiple records at once from spreadsheets, CSVs, or other data sources directly into QuickBooks.",
      benefits: [
        "Save hours of manual data entry",
        "Reduce errors with validation checks",
        "Import customers, vendors, items, and transactions",
        "Custom field mapping for any data source"
      ],
      icon: "📥"
    },
    {
      title: "Bulk Export",
      description: "Export QuickBooks data into various formats for reporting, analysis, or migration purposes.",
      benefits: [
        "Create custom reports beyond QuickBooks capabilities",
        "Export data to Excel, CSV, or JSON formats",
        "Schedule automated exports",
        "Filter and select exactly what you need"
      ],
      icon: "📤"
    },
    {
      title: "Bulk Delete",
      description: "Safely remove multiple records at once with validation checks and backup options.",
      benefits: [
        "Clean up test or duplicate data quickly",
        "Preview deletion impact before committing",
        "Automatic backup creation",
        "Selective deletion with filtering options"
      ],
      icon: "🗑️"
    },
    {
      title: "Data Mapping",
      description: "Intelligent field mapping to match your source data to QuickBooks fields automatically.",
      benefits: [
        "AI-assisted field matching",
        "Save mapping templates for repeated use",
        "Handle custom fields and special formats",
        "Preview data transformations before importing"
      ],
      icon: "🔄"
    },
    {
      title: "Error Prevention",
      description: "Advanced validation to catch issues before they impact your QuickBooks data.",
      benefits: [
        "Pre-import validation checks",
        "Duplicate detection",
        "Format verification",
        "Transaction balance verification"
      ],
      icon: "🛡️"
    },
    {
      title: "Audit Trail",
      description: "Keep track of all data operations with detailed logs and audit capabilities.",
      benefits: [
        "Complete operation history",
        "User activity tracking",
        "Data change logs",
        "Exportable audit reports"
      ],
      icon: "📋"
    }
  ];

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-primary py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Powerful Features for QuickBooks Management</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Transform how you work with QuickBooks using our suite of specialized tools designed for efficiency and accuracy.
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold gradient-text mb-4">Core Features</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              TransyncPro provides the tools you need to manage QuickBooks data efficiently,
              saving you time and reducing errors in your workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 card-hover border border-gray-100">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-transyncpro-heading mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Security Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl font-bold gradient-text mb-4">Enterprise-Grade Security</h2>
              <p className="text-lg text-gray-600 mb-6">
                Your data security is our top priority. TransyncPro employs bank-level encryption and follows
                strict security protocols to ensure your QuickBooks data remains protected.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">End-to-end encryption for all data transfers</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">OAuth 2.0 authentication with Intuit</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">No storage of sensitive financial data</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">SOC 2 compliant infrastructure</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Regular security audits and penetration testing</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 md:pl-12">
              <img 
                src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Data Security" 
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Integration Showcase */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold gradient-text mb-4">Seamless QuickBooks Integration</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Connect directly to QuickBooks with just a few clicks. TransyncPro is an authorized Intuit 
              developer partner, ensuring reliable and secure integration.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <img 
              src="/QuickBooksProAdvisors.png" 
              alt="QuickBooks Certified" 
              className="h-16 md:h-24"
            />
            <img 
              src="/Quickbooks_certified_proadvisor_logo.png" 
              alt="QuickBooks Logo" 
              className="h-16 md:h-24"
            />
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Features;

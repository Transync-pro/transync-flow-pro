import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";

const Integrations = () => {
  const integrations = [
    {
      name: "QuickBooks Online",
      logo: "/Connect to QuickBooks Button.svg",
      description: "Connect directly to QuickBooks Online for seamless data management across all your company files.",
      features: [
        "Real-time data synchronization",
        "Complete access to all QuickBooks Online entities",
        "Support for multi-company environments",
        "Automatic authentication refresh"
      ],
      primary: true
    },
    {
      name: "QuickBooks Desktop",
      logo: "/Connect to QuickBooks Button.svg",
      description: "Connect to QuickBooks Desktop via our secure sync agent to manage your locally-stored company data.",
      features: [
        "Secure desktop sync agent",
        "Compatible with QuickBooks Pro, Premier, and Enterprise",
        "Support for multi-user environments",
        "Data security at rest and in transit"
      ],
      primary: true
    },
    {
      name: "Microsoft Excel",
      logo: "/Microsoft_logo.svg",
      description: "Import and export data directly to and from Excel files with smart column mapping and data validation.",
      features: [
        "Smart column mapping",
        "Data type validation",
        "Template saving for repeated operations",
        "Support for XLSX and legacy XLS formats"
      ],
      primary: false
    },
    {
      name: "CSV Files",
      logo: "https://cdn-icons-png.flaticon.com/512/6133/6133884.png",
      description: "Universal support for CSV file import and export with customizable delimiters and encoding options.",
      features: [
        "Customizable delimiters",
        "Character encoding options",
        "Header row detection",
        "Data preview before import"
      ],
      primary: false
    },
    {
      name: "Zapier",
      logo: "https://cdn.worldvectorlogo.com/logos/zapier-1.svg",
      description: "Automate workflows between TransyncPro and thousands of other apps through Zapier integration.",
      features: [
        "Hundreds of automation triggers",
        "Custom multi-step zaps",
        "Real-time data synchronization",
        "Error notification and handling"
      ],
      primary: false
    },
    {
      name: "REST API",
      logo: "https://cdn-icons-png.flaticon.com/512/2165/2165004.png",
      description: "Direct API access for custom integration with your existing systems and workflows (Business & Enterprise plans).",
      features: [
        "Comprehensive REST API",
        "OAuth 2.0 authentication",
        "Detailed documentation",
        "Rate limits based on plan tier"
      ],
      primary: false
    }
  ];

  const upcomingIntegrations = [
    {
      name: "Xero",
      logo: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Xero_software_logo.svg",
      status: "Coming Q3 2025"
    },
    {
      name: "Sage",
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/26/Sage_logo.svg",
      status: "Coming Q4 2025"
    },
    {
      name: "Shopify",
      logo: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg",
      status: "Coming Q2 2025"
    },
    {
      name: "WooCommerce",
      logo: "https://upload.wikimedia.org/wikipedia/commons/a/ae/WooCommerce_logo.svg",
      status: "Coming Q3 2025"
    }
  ];

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Integrations & Connections</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            TransyncPro seamlessly connects with QuickBooks and other systems to provide flexible data management solutions.
          </p>
        </div>
      </section>

      {/* QuickBooks Integration Highlight */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <img 
                src="/Connect to QuickBooks Button.svg" 
                alt="QuickBooks Logo" 
                className="h-16"
              />
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-4">Authorized QuickBooks Developer</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              As an Intuit-authorized developer partner, TransyncPro offers secure, reliable integration with 
              both QuickBooks Online and QuickBooks Desktop products.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 card-hover">
              <div className="flex items-center mb-6">
                <img 
                  src="/Connect to QuickBooks Button.svg" 
                  alt="QuickBooks Online Logo" 
                  className="h-10 mr-4"
                />
                <h3 className="text-2xl font-semibold text-transyncpro-heading">QuickBooks Online</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Connect directly to QuickBooks Online via OAuth for secure, token-based access to your company data.
                No credentials are stored, and your data remains protected.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Works with all QuickBooks Online tiers</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Access to customers, vendors, items, and transactions</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Real-time data synchronization</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Multi-company support on Business and Enterprise plans</span>
                </li>
              </ul>
              <Link to="/signup">
                <Button className="w-full bg-transyncpro-button hover:bg-transyncpro-button/90 text-white">
                  Connect to QuickBooks Online
                </Button>
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 card-hover">
              <div className="flex items-center mb-6">
                <img 
                  src="/Connect to QuickBooks Button.svg" 
                  alt="QuickBooks Desktop Logo" 
                  className="h-10 mr-4"
                />
                <h3 className="text-2xl font-semibold text-transyncpro-heading">QuickBooks Desktop</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Connect to QuickBooks Desktop through our secure desktop connector. The connector runs locally
                on your machine and communicates securely with our cloud service.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Compatible with QuickBooks Pro, Premier, and Enterprise</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Works with version 2019 and newer</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">End-to-end encryption for data security</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Support for multi-user environments</span>
                </li>
              </ul>
              <Link to="/signup">
                <Button className="w-full bg-transyncpro-button hover:bg-transyncpro-button/90 text-white">
                  Connect to QuickBooks Desktop
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* All Integrations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">All Supported Integrations</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {integrations.map((integration, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 h-full card-hover">
                <div className="flex items-center mb-4">
                  <img 
                    src={integration.logo} 
                    alt={`${integration.name} Logo`} 
                    className="h-10 w-10 object-contain mr-3"
                  />
                  <h3 className="text-xl font-semibold text-transyncpro-heading">{integration.name}</h3>
                </div>
                <p className="text-gray-600 mb-4">{integration.description}</p>
                <ul className="space-y-2 mb-4">
                  {integration.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Integrations */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold gradient-text text-center mb-12">Coming Soon</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {upcomingIntegrations.map((integration, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 text-center opacity-80 hover:opacity-100 transition-opacity">
                <img 
                  src={integration.logo} 
                  alt={`${integration.name} Logo`} 
                  className="h-12 mx-auto mb-4 object-contain"
                />
                <h3 className="text-lg font-semibold text-transyncpro-heading mb-2">{integration.name}</h3>
                <p className="text-gray-500 text-sm">{integration.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer API Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl font-bold gradient-text mb-6">Developer API</h2>
              <p className="text-lg text-gray-600 mb-6">
                Build custom integrations with our comprehensive REST API, available on Business and Enterprise plans.
                Our API gives you programmatic access to all the features of TransyncPro.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">RESTful JSON API with comprehensive documentation</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">OAuth 2.0 authentication for secure access</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Webhooks for real-time event notifications</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-transyncpro-success flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Rate limits based on your subscription plan</span>
                </li>
              </ul>
              <Link to="/documentation">
                <Button className="bg-transyncpro-button hover:bg-transyncpro-button/90 text-white">
                  View API Documentation
                </Button>
              </Link>
            </div>
            <div className="md:w-1/2 md:pl-12">
              <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm">
{`// Example API request
fetch('https://api.transyncpro.com/v1/quickbooks/customers', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Customers:', data);
})
.catch(error => {
  console.error('Error:', error);
});`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Request */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold gradient-text mb-6">Need a Custom Integration?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Don't see the integration you need? Let us know, and we'll consider adding it to our roadmap.
          </p>
          <Link to="/contact">
            <Button className="bg-transyncpro-button hover:bg-transyncpro-button/90 text-white">
              Request an Integration
            </Button>
          </Link>
        </div>
      </section>
    </PageLayout>
  );
};

export default Integrations;


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, Book, Video, Code, ExternalLink } from "lucide-react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import PageLayout from "@/components/PageLayout";

const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const docCategories = [
    {
      title: "Getting Started",
      icon: <Book className="h-5 w-5" />,
      docs: [
        { title: "Overview", link: "#overview" },
        { title: "Account Setup", link: "#account-setup" },
        { title: "Connecting to QuickBooks", link: "#connecting-quickbooks" },
        { title: "Dashboard Navigation", link: "#dashboard" },
        { title: "System Requirements", link: "#system-requirements" }
      ]
    },
    {
      title: "Import Operations",
      icon: <FileText className="h-5 w-5" />,
      docs: [
        { title: "Import Overview", link: "#import-overview" },
        { title: "Supported File Formats", link: "#file-formats" },
        { title: "Field Mapping Guide", link: "#field-mapping" },
        { title: "Data Validation", link: "#validation" },
        { title: "Error Handling", link: "#error-handling" },
        { title: "Importing Customers", link: "#import-customers" },
        { title: "Importing Vendors", link: "#import-vendors" },
        { title: "Importing Items", link: "#import-items" },
        { title: "Importing Transactions", link: "#import-transactions" }
      ]
    },
    {
      title: "Export Operations",
      icon: <FileText className="h-5 w-5" />,
      docs: [
        { title: "Export Overview", link: "#export-overview" },
        { title: "Export Formats", link: "#export-formats" },
        { title: "Custom Fields", link: "#custom-fields" },
        { title: "Filtering Data", link: "#filtering" },
        { title: "Exporting Customers", link: "#export-customers" },
        { title: "Exporting Transactions", link: "#export-transactions" },
        { title: "Exporting Reports", link: "#export-reports" }
      ]
    },
    {
      title: "Delete Operations",
      icon: <FileText className="h-5 w-5" />,
      docs: [
        { title: "Delete Overview", link: "#delete-overview" },
        { title: "Safety Measures", link: "#safety-measures" },
        { title: "Backup Before Deletion", link: "#backup" },
        { title: "Bulk Delete Workflow", link: "#delete-workflow" },
        { title: "Delete Customers", link: "#delete-customers" },
        { title: "Delete Vendors", link: "#delete-vendors" },
        { title: "Delete Items", link: "#delete-items" },
        { title: "Delete Transactions", link: "#delete-transactions" }
      ]
    },
    {
      title: "API Documentation",
      icon: <Code className="h-5 w-5" />,
      docs: [
        { title: "API Overview", link: "#api-overview" },
        { title: "Authentication", link: "#api-auth" },
        { title: "Rate Limits", link: "#rate-limits" },
        { title: "Endpoints Reference", link: "#endpoints" },
        { title: "Error Codes", link: "#error-codes" },
        { title: "Webhooks", link: "#webhooks" },
        { title: "API Examples", link: "#api-examples" }
      ]
    },
    {
      title: "Video Tutorials",
      icon: <Video className="h-5 w-5" />,
      docs: [
        { title: "Getting Started Tour", link: "#video-getting-started" },
        { title: "First Import Walkthrough", link: "#video-first-import" },
        { title: "Advanced Field Mapping", link: "#video-field-mapping" },
        { title: "Exporting Custom Reports", link: "#video-custom-reports" },
        { title: "Safe Deletion Guide", link: "#video-safe-deletion" }
      ]
    }
  ];

  // Filter docs by search query
  const filteredCategories = docCategories.map(category => {
    const filteredDocs = category.docs.filter(doc => 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      ...category,
      docs: filteredDocs,
      hasMatches: filteredDocs.length > 0
    };
  }).filter(category => category.hasMatches || searchQuery === "");

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Documentation</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Comprehensive guides, tutorials, and API documentation for TransyncPro.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex gap-8">
            {/* Sidebar */}
            <div className="md:w-1/4 mb-8 md:mb-0">
              <div className="sticky top-24">
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <nav className="space-y-1">
                  {docCategories.map((category, index) => (
                    <a 
                      key={index} 
                      href={`#${category.title.toLowerCase().replace(/\s+/g, '-')}`}
                      className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-transyncpro-heading rounded-md transition-colors"
                    >
                      {category.icon}
                      <span className="ml-2">{category.title}</span>
                    </a>
                  ))}
                </nav>
                
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="font-medium text-blue-800 mb-2">Need Help?</h3>
                  <p className="text-blue-700 text-sm mb-3">
                    Can't find what you're looking for in our documentation?
                  </p>
                  <Button variant="outline" className="w-full text-blue-700 border-blue-300 hover:bg-blue-100">
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="md:w-3/4">
              <div className="bg-gray-50 rounded-xl p-6 mb-10">
                <h2 className="text-2xl font-bold gradient-text mb-3">Documentation Overview</h2>
                <p className="text-gray-600 mb-4">
                  Welcome to the TransyncPro documentation. Here you'll find comprehensive guides and documentation to help you start working with
                  TransyncPro as quickly as possible, as well as support if you get stuck.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  <Button variant="outline" className="justify-start">
                    <Book className="mr-2 h-4 w-4" />
                    Quickstart Guide
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Video className="mr-2 h-4 w-4" />
                    Video Tutorials
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Code className="mr-2 h-4 w-4" />
                    API Reference
                  </Button>
                </div>
              </div>
              
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category, index) => (
                  <div 
                    key={index} 
                    id={category.title.toLowerCase().replace(/\s+/g, '-')} 
                    className="mb-10 scroll-mt-24"
                  >
                    <div className="flex items-center mb-4">
                      {category.icon}
                      <h2 className="text-2xl font-bold gradient-text ml-2">{category.title}</h2>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm divide-y">
                      <Accordion type="single" collapsible className="w-full">
                        {category.docs.map((doc, docIndex) => (
                          <AccordionItem key={docIndex} value={`${category.title}-${docIndex}`}>
                            <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                              <span className="text-left">{doc.title}</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <p className="text-gray-600 mb-3">
                                This is a placeholder for the {doc.title.toLowerCase()} documentation content.
                                In a real implementation, this would contain detailed information, code examples,
                                screenshots, and step-by-step instructions.
                              </p>
                              <a 
                                href={doc.link} 
                                className="text-transyncpro-button font-medium flex items-center"
                              >
                                Read full documentation
                                <ExternalLink className="ml-1 h-4 w-4" />
                              </a>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                  <p className="text-gray-500 mb-4">No documentation found matching your search criteria.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Help & Resources */}
      <section className="py-12 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold gradient-text text-center mb-8">Additional Resources</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Video className="h-8 w-8 text-transyncpro-button mb-4" />
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Video Library</h3>
              <p className="text-gray-600 mb-4">
                Browse our comprehensive collection of tutorial videos covering all aspects of TransyncPro.
              </p>
              <Button variant="outline" className="w-full">
                View Videos
              </Button>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Book className="h-8 w-8 text-transyncpro-button mb-4" />
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Knowledge Base</h3>
              <p className="text-gray-600 mb-4">
                Access our extensive knowledge base with answers to common questions and troubleshooting guides.
              </p>
              <Button variant="outline" className="w-full">
                Browse Articles
              </Button>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Code className="h-8 w-8 text-transyncpro-button mb-4" />
              <h3 className="text-xl font-semibold text-transyncpro-heading mb-2">Developer Hub</h3>
              <p className="text-gray-600 mb-4">
                Find API documentation, SDKs, and examples for integrating with TransyncPro.
              </p>
              <Button variant="outline" className="w-full">
                Developer Docs
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Documentation;

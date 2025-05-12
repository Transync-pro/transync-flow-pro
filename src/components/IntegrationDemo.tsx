
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const IntegrationDemo = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const startAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 3000);
  };

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            See How TransyncPro Works with QuickBooks
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Experience seamless data integration and management
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="import">Bulk Import</TabsTrigger>
              <TabsTrigger value="export">Bulk Export</TabsTrigger>
              <TabsTrigger value="delete">Bulk Delete</TabsTrigger>
            </TabsList>
            
            <TabsContent value="import" className="space-y-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/2">
                  <h3 className="text-2xl font-bold mb-4">Import Data in Seconds</h3>
                  <p className="text-gray-700 mb-6">
                    Effortlessly import customer data, invoices, transactions, and more into your QuickBooks account with just a few clicks.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-transyncpro-success text-white flex items-center justify-center text-xs font-bold">1</div>
                      <div className="ml-3">
                        <h4 className="text-lg font-semibold">Upload your file</h4>
                        <p className="text-gray-600">CSV, Excel, or other supported formats</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-transyncpro-success text-white flex items-center justify-center text-xs font-bold">2</div>
                      <div className="ml-3">
                        <h4 className="text-lg font-semibold">Map your fields</h4>
                        <p className="text-gray-600">Match your data fields with QuickBooks fields</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-transyncpro-success text-white flex items-center justify-center text-xs font-bold">3</div>
                      <div className="ml-3">
                        <h4 className="text-lg font-semibold">Validate and import</h4>
                        <p className="text-gray-600">Review and complete the import process</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={startAnimation}
                    className="mt-8 bg-transyncpro-button hover:bg-transyncpro-button/90"
                  >
                    Watch Demo
                  </Button>
                </div>
                
                <div className="lg:w-1/2">
                  <div className="border border-gray-200 rounded-lg shadow-sm p-4 bg-transyncpro-ui-light h-[400px] relative overflow-hidden">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="text-sm text-gray-500">TransyncPro Import Wizard</div>
                    </div>
                    
                    {/* Demo Animation Container */}
                    <div className="h-full">
                      <div className={`transition-all duration-1000 ${
                        isAnimating ? 'opacity-100' : 'opacity-0'
                      }`}>
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="w-16 h-16 border-4 border-transyncpro-button border-t-transparent rounded-full animate-spin"></div>
                          <p className="mt-4 text-transyncpro-heading font-semibold">Processing import...</p>
                          <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mt-4">
                            <div className="bg-transyncpro-button h-2.5 rounded-full animate-pulse" style={{width: '75%'}}></div>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">3500 of 5000 records</p>
                        </div>
                      </div>
                      
                      <div className={`transition-all duration-1000 ${
                        !isAnimating ? 'opacity-100' : 'opacity-0'
                      }`}>
                        <div className="border border-gray-200 rounded bg-white p-3 mb-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">customers.csv</span>
                            <span className="text-xs text-gray-500">5,000 records</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-white border border-gray-200 rounded p-3">
                            <h5 className="text-xs text-gray-500 mb-1">Source Field</h5>
                            <p className="font-medium">Customer Name</p>
                          </div>
                          <div className="bg-white border border-gray-200 rounded p-3">
                            <h5 className="text-xs text-gray-500 mb-1">QuickBooks Field</h5>
                            <p className="font-medium">DisplayName</p>
                          </div>
                          <div className="bg-white border border-gray-200 rounded p-3">
                            <h5 className="text-xs text-gray-500 mb-1">Source Field</h5>
                            <p className="font-medium">Email</p>
                          </div>
                          <div className="bg-white border border-gray-200 rounded p-3">
                            <h5 className="text-xs text-gray-500 mb-1">QuickBooks Field</h5>
                            <p className="font-medium">PrimaryEmailAddr</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <Button variant="outline" size="sm">Back</Button>
                          <Button size="sm" className="bg-transyncpro-button">Start Import</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="export" className="space-y-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/2">
                  <h3 className="text-2xl font-bold mb-4">Export and Analyze Your Data</h3>
                  <p className="text-gray-700 mb-6">
                    Quickly export all your QuickBooks data for reporting, analysis, or backup purposes.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-transyncpro-heading text-white flex items-center justify-center text-xs font-bold">1</div>
                      <div className="ml-3">
                        <h4 className="text-lg font-semibold">Select data type</h4>
                        <p className="text-gray-600">Choose what data you want to export</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-transyncpro-heading text-white flex items-center justify-center text-xs font-bold">2</div>
                      <div className="ml-3">
                        <h4 className="text-lg font-semibold">Apply filters</h4>
                        <p className="text-gray-600">Filter by date range, status, or custom fields</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-transyncpro-heading text-white flex items-center justify-center text-xs font-bold">3</div>
                      <div className="ml-3">
                        <h4 className="text-lg font-semibold">Download your data</h4>
                        <p className="text-gray-600">Get your data in CSV, Excel, or JSON format</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="mt-8 bg-transyncpro-button hover:bg-transyncpro-button/90">
                    Watch Demo
                  </Button>
                </div>
                
                <div className="lg:w-1/2">
                  <div className="border border-gray-200 rounded-lg shadow-sm p-4 bg-transyncpro-ui-light h-[400px]">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="text-sm text-gray-500">TransyncPro Export Wizard</div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Data Type</label>
                        <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-transyncpro-button">
                          <option>Customers</option>
                          <option>Invoices</option>
                          <option>Products & Services</option>
                          <option>Transactions</option>
                          <option>Vendors</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500">From</label>
                            <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-transyncpro-button" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500">To</label>
                            <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-transyncpro-button" />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="border border-transyncpro-button bg-transyncpro-button/10 rounded-md p-3 flex flex-col items-center">
                            <span className="text-xs font-medium">CSV</span>
                          </div>
                          <div className="border border-gray-200 rounded-md p-3 flex flex-col items-center">
                            <span className="text-xs font-medium">Excel</span>
                          </div>
                          <div className="border border-gray-200 rounded-md p-3 flex flex-col items-center">
                            <span className="text-xs font-medium">JSON</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <Button className="w-full bg-transyncpro-button hover:bg-transyncpro-button/90">
                          Export Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="delete" className="space-y-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/2">
                  <h3 className="text-2xl font-bold mb-4">Safely Delete Bulk Records</h3>
                  <p className="text-gray-700 mb-6">
                    Clean up your QuickBooks data with confidence using our validation and backup safeguards.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-transyncpro-error/80 text-white flex items-center justify-center text-xs font-bold">1</div>
                      <div className="ml-3">
                        <h4 className="text-lg font-semibold">Select records to delete</h4>
                        <p className="text-gray-600">Filter and choose what you want to remove</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-transyncpro-error/80 text-white flex items-center justify-center text-xs font-bold">2</div>
                      <div className="ml-3">
                        <h4 className="text-lg font-semibold">Review dependencies</h4>
                        <p className="text-gray-600">See what other data might be affected</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-transyncpro-error/80 text-white flex items-center justify-center text-xs font-bold">3</div>
                      <div className="ml-3">
                        <h4 className="text-lg font-semibold">Confirm and delete</h4>
                        <p className="text-gray-600">Create a backup and proceed with deletion</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="mt-8 bg-transyncpro-button hover:bg-transyncpro-button/90">
                    Watch Demo
                  </Button>
                </div>
                
                <div className="lg:w-1/2">
                  <div className="border border-gray-200 rounded-lg shadow-sm p-4 bg-transyncpro-ui-light h-[400px]">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="text-sm text-gray-500">TransyncPro Delete Wizard</div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-transyncpro-warning/10 border border-transyncpro-warning rounded-md p-3 flex items-start">
                        <div className="text-transyncpro-warning text-xl mr-3">⚠️</div>
                        <div className="text-sm">
                          <p className="font-medium text-transyncpro-warning">Warning: About to delete 47 inactive customers</p>
                          <p className="text-gray-600">This action cannot be undone after confirmation.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-2">Dependencies Found:</h5>
                        <div className="bg-white rounded border border-gray-200 p-3 max-h-36 overflow-y-auto">
                          <div className="text-sm mb-2">
                            <p className="font-medium">6 transactions</p>
                            <p className="text-gray-500 text-xs">Historical transactions will be preserved</p>
                          </div>
                          <div className="text-sm">
                            <p className="font-medium">2 recurring templates</p>
                            <p className="text-gray-500 text-xs">Will be deleted with customer records</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <input type="checkbox" id="backup" className="rounded border-gray-300 text-transyncpro-button focus:ring-transyncpro-button mr-2" />
                        <label htmlFor="backup" className="text-sm font-medium">Create a backup before deletion</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input type="checkbox" id="confirm" className="rounded border-gray-300 text-transyncpro-button focus:ring-transyncpro-button mr-2" />
                        <label htmlFor="confirm" className="text-sm font-medium">I understand this action cannot be undone</label>
                      </div>
                      
                      <div className="pt-4 flex justify-between">
                        <Button variant="outline">Cancel</Button>
                        <Button variant="destructive">Delete Records</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default IntegrationDemo;

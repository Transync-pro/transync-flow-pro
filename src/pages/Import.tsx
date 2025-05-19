
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Clock, Construction } from "lucide-react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";

const Import = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">Import Data to QuickBooks</h1>
        
        <Card className="border-2 border-dashed border-purple-200 bg-purple-50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-50">
            <CardTitle className="text-xl text-center text-purple-800 flex items-center justify-center">
              <Construction className="mr-2 h-6 w-6" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-8 px-6">
            <div className="text-center space-y-4">
              <p className="text-purple-700 font-medium">
                Our import functionality is currently under development.
              </p>
              <p className="text-gray-600">
                Soon you'll be able to easily import data from various sources directly into QuickBooks, 
                including CSV files, Excel spreadsheets, and third-party applications.
              </p>
              
              <div className="max-w-lg mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100 flex items-center">
                  <div className="rounded-full bg-purple-100 p-2 mr-3">
                    <CalendarClock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-purple-800">Expected Release</h3>
                    <p className="text-sm text-gray-500">Q3 2025</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100 flex items-center">
                  <div className="rounded-full bg-purple-100 p-2 mr-3">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-purple-800">Early Access</h3>
                    <p className="text-sm text-gray-500">Join waitlist for beta access</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-purple-100">
                <h3 className="font-medium mb-2 text-purple-800">Planned Features</h3>
                <ul className="text-sm text-gray-600 text-left space-y-1 list-disc list-inside">
                  <li>Drag-and-drop CSV file import</li>
                  <li>Smart field mapping with AI assistance</li>
                  <li>Data validation and error handling</li>
                  <li>Batch imports with scheduling</li>
                  <li>Import templates for recurring tasks</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Import;

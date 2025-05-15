
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Trash2, Clock, Plus } from "lucide-react";

const statsCards = [
  {
    title: "Total Imported",
    value: "12,458",
    description: "Records imported this month",
    trend: "+14%",
    trendDirection: "up",
  },
  {
    title: "Total Exported",
    value: "8,721",
    description: "Records exported this month",
    trend: "+7%",
    trendDirection: "up",
  },
  {
    title: "Total Deleted",
    value: "1,205",
    description: "Records deleted this month",
    trend: "-3%",
    trendDirection: "down",
  },
  {
    title: "QuickBooks Quota",
    value: "75%",
    description: "API quota remaining today",
    progress: 75,
    resetTime: "Resets in 6h 23m",
  },
];

const recentJobs = [
  {
    id: "JOB-3984",
    name: "Customer Import",
    type: "import",
    status: "completed",
    records: "234 records",
    date: "Today at 10:24 AM",
  },
  {
    id: "JOB-3983",
    name: "Transaction Export",
    type: "export",
    status: "completed",
    records: "1,523 records",
    date: "Yesterday at 4:12 PM",
  },
  {
    id: "JOB-3982",
    name: "Inactive Vendors",
    type: "delete",
    status: "completed",
    records: "48 records",
    date: "May 11, 2025 at 2:45 PM",
  },
  {
    id: "JOB-3981",
    name: "Monthly Invoices",
    type: "export",
    status: "completed",
    records: "875 records",
    date: "May 10, 2025 at 9:30 AM",
  },
];

const scheduledJobs = [
  {
    id: "SCH-284",
    name: "Weekly Customer Import",
    type: "import",
    frequency: "Weekly",
    nextRun: "May 18, 2025 at 6:00 AM",
  },
  {
    id: "SCH-283",
    name: "Monthly Transaction Export",
    type: "export",
    frequency: "Monthly",
    nextRun: "June 1, 2025 at 12:00 AM",
  },
  {
    id: "SCH-282",
    name: "Quarterly Cleanup",
    type: "delete",
    frequency: "Quarterly",
    nextRun: "July 1, 2025 at 3:00 AM",
  },
];

import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useNavigate } from "react-router-dom";

const DashboardHome = () => {
  const { isConnected, isLoading: isQbLoading, connect } = useQuickbooks();
  const navigate = useNavigate();

  if (isQbLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mb-4" />
        <p className="text-gray-600">Checking QuickBooks connection...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-2xl font-bold mb-2">QuickBooks Not Connected</div>
        <p className="mb-4 text-gray-600">You must connect to QuickBooks to use your dashboard.</p>
        <button
          className="bg-transyncpro-button hover:bg-transyncpro-button/90 text-white px-6 py-2 rounded"
          onClick={() => connect()}
        >
          Connect to QuickBooks
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening with your account.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <CardDescription className="flex items-center justify-between mt-1">
                <span>{card.description}</span>
                {card.trend && (
                  <span className={`flex items-center ${
                    card.trendDirection === "up" ? "text-transyncpro-success" : "text-transyncpro-error"
                  }`}>
                    {card.trend}
                  </span>
                )}
              </CardDescription>
              {card.progress && (
                <div className="mt-3">
                  <Progress value={card.progress} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">{card.resetTime}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Jobs</CardTitle>
              <Link to="/dashboard/history">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full mr-3 bg-gray-100">
                      {job.type === "import" && <ArrowDown size={18} className="text-blue-500" />}
                      {job.type === "export" && <ArrowUp size={18} className="text-purple-500" />}
                      {job.type === "delete" && <Trash2 size={18} className="text-red-500" />}
                    </div>
                    <div>
                      <div className="font-medium">{job.name}</div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <span className="mr-2">{job.id}</span>
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                          job.status === "completed" ? "bg-transyncpro-success" : 
                          job.status === "running" ? "bg-transyncpro-warning" : 
                          "bg-transyncpro-error"
                        }`}></span>
                        <span className="capitalize">{job.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{job.records}</div>
                    <div className="text-xs text-gray-500">{job.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Scheduled Jobs</CardTitle>
              <Link to="/dashboard/schedule">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full mr-3 bg-gray-100">
                      {job.type === "import" && <ArrowDown size={18} className="text-blue-500" />}
                      {job.type === "export" && <ArrowUp size={18} className="text-purple-500" />}
                      {job.type === "delete" && <Trash2 size={18} className="text-red-500" />}
                    </div>
                    <div>
                      <div className="font-medium">{job.name}</div>
                      <div className="text-xs text-gray-500">{job.id} • {job.frequency}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock size={12} className="mr-1" />
                      {job.nextRun}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4 bg-transyncpro-button hover:bg-transyncpro-button/90">
              <Plus size={16} className="mr-1" /> Schedule New Job
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;

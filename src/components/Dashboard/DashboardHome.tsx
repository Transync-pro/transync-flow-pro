import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { 
  ArrowDown, 
  ArrowUp, 
  Trash2, 
  LayoutDashboard, 
  TrendingUp,
  TrendingDown,
  Check,
  Database
} from "lucide-react";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useNavigate } from "react-router-dom";
import QuickbooksUserIdentity from '@/components/QuickbooksUserIdentity';
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/environmentClient";

// Stats card type definition
interface StatsCard {
  title: string;
  value: string;
  description: string;
  trend: string;
  trendDirection: "up" | "down" | "neutral";
  icon: any;
  iconBackground: string;
  iconColor: string;
}

// Recent activity data
interface Activity {
  id: string;
  name: string;
  type: string;
  status: string;
  records: string;
  date: string;
}

const DashboardHome = () => {
  const { isConnected, isLoading: isQbLoading, connect, companyName } = useQuickbooks();
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState<StatsCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  // Fetch operation stats from the database
  useEffect(() => {
    async function fetchOperationStats() {
      if (!isConnected) return;
      
      setIsLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        
        const userId = userData.user.id;
        
        // Fetch operation logs for the current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        // Fetch recent activities
        const { data: recentLogsData, error: recentError } = await supabase
          .from('operation_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(4);
          
        if (!recentError && recentLogsData) {
          const activities = recentLogsData.map(log => {
            let recordsCount = '';
            // Fix the type checking with proper handling
            if (log.details && typeof log.details === 'object') {
              // Check if details contains a count property
              const details = log.details as Record<string, any>;
              if (typeof details.count !== 'undefined') {
                recordsCount = `${details.count} records`;
              } else {
                recordsCount = log.record_id ? '1 record' : '';
              }
            } else {
              recordsCount = log.record_id ? '1 record' : '';
            }
            
            const date = new Date(log.created_at);
            const formattedDate = new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }).format(date);
            
            return {
              id: log.id,
              name: `${log.entity_type} ${log.operation_type.charAt(0).toUpperCase() + log.operation_type.slice(1)}`,
              type: log.operation_type,
              status: log.status,
              records: recordsCount,
              date: formattedDate
            };
          });
          
          setRecentActivities(activities);
        }
        
        // Fetch operation logs for statistics
        const { data: operationLogs, error } = await supabase
          .from('operation_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startOfMonth.toISOString());
          
        if (error) {
          console.error('Error fetching operation logs:', error);
          return;
        }
        
        // Calculate stats from operation logs
        const exports = operationLogs.filter(log => log.operation_type === 'export');
        const deletions = operationLogs.filter(log => log.operation_type === 'delete');
        const totalOperations = operationLogs.length;
        
        // For fetch and export operations, determine success rate
        const dataOperations = operationLogs.filter(log => 
          log.operation_type === 'export' || log.operation_type === 'fetch'
        );
        const successfulOperations = dataOperations.filter(log => log.status === 'success');
        
        // Calculate the export success rate
        const successRate = dataOperations.length > 0 
          ? ((successfulOperations.length / dataOperations.length) * 100).toFixed(1)
          : '100.0';
        
        // Get previous month statistics for trend comparison
        const startOfPrevMonth = new Date(startOfMonth);
        startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
        const endOfPrevMonth = new Date(startOfMonth);
        endOfPrevMonth.setDate(endOfPrevMonth.getDate() - 1);
        
        const { data: prevMonthLogs } = await supabase
          .from('operation_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startOfPrevMonth.toISOString())
          .lte('created_at', endOfPrevMonth.toISOString());
        
        const prevExports = prevMonthLogs?.filter(log => log.operation_type === 'export').length || 0;
        const prevDeletions = prevMonthLogs?.filter(log => log.operation_type === 'delete').length || 0;
        const prevDataOps = prevMonthLogs?.filter(log => 
          log.operation_type === 'export' || log.operation_type === 'fetch'
        ).length || 0;
        const prevSuccessOps = prevMonthLogs?.filter(log => 
          (log.operation_type === 'export' || log.operation_type === 'fetch') && 
          log.status === 'success'
        ).length || 0;
        
        const prevSuccessRate = prevDataOps > 0 ? (prevSuccessOps / prevDataOps) * 100 : 100;
        
        // Calculate trends
        const exportsTrendValue = prevExports > 0 
          ? (((exports.length - prevExports) / prevExports) * 100).toFixed(0)
          : '+100';
        const exportsTrend = exports.length >= prevExports ? `+${exportsTrendValue}%` : `${exportsTrendValue}%`;
        
        const deletionsTrendValue = prevDeletions > 0
          ? (((deletions.length - prevDeletions) / prevDeletions) * 100).toFixed(0)
          : '+100';
        const deletionsTrend = deletions.length >= prevDeletions ? `+${deletionsTrendValue}%` : `${deletionsTrendValue}%`;
        
        const successRateTrendValue = prevSuccessRate > 0
          ? ((parseFloat(successRate) - prevSuccessRate)).toFixed(1)
          : '+0.0';
        const successRateTrend = parseFloat(successRate) >= prevSuccessRate ? `+${successRateTrendValue}%` : `${successRateTrendValue}%`;
        
        // Update stats cards with real data
        setStatsData([
          {
            title: "Data Exports",
            value: exports.length.toString(),
            description: "Records exported this month",
            trend: exports.length >= prevExports ? exportsTrend : exportsTrend,
            trendDirection: exports.length >= prevExports ? "up" : "down",
            icon: ArrowUp,
            iconBackground: "bg-green-100",
            iconColor: "text-green-600"
          },
          {
            title: "Data Deletions",
            value: deletions.length.toString(),
            description: "Records deleted this month",
            trend: deletions.length >= prevDeletions ? deletionsTrend : deletionsTrend,
            trendDirection: deletions.length >= prevDeletions ? "up" : "down",
            icon: Trash2,
            iconBackground: "bg-red-100",
            iconColor: "text-red-600"
          },
          {
            title: "Export Success Rate",
            value: `${successRate}%`,
            description: "Average success rate",
            trend: parseFloat(successRate) >= prevSuccessRate ? successRateTrend : successRateTrend,
            trendDirection: parseFloat(successRate) >= prevSuccessRate ? "up" : "down",
            icon: Check,
            iconBackground: "bg-blue-100",
            iconColor: "text-blue-600"
          }
        ]);
      } catch (error) {
        console.error('Error calculating stats:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchOperationStats();
  }, [isConnected]);

  if (isQbLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mb-4" />
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Add QuickbooksUserIdentity component */}
        <QuickbooksUserIdentity />
        
        {/* Company Connection Card */}
        {companyName && (
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-white p-3 rounded-full shadow-sm mr-4">
                  <LayoutDashboard className="h-8 w-8 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">Connected to QuickBooks</h3>
                  <p className="text-purple-700">{companyName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Stats Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeleton for stats cards
            Array(3).fill(0).map((_, index) => (
              <Card key={`skeleton-${index}`} className="border border-gray-200">
                <CardHeader className="pb-2">
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            statsData.map((card, index) => (
              <Card key={index} className="border border-gray-200 hover:border-purple-200 transition-all hover:shadow-md">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-gray-500">{card.title}</CardTitle>
                  <div className={`p-2 rounded-full ${card.iconBackground}`}>
                    <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <CardDescription className="flex items-center justify-between mt-1">
                    <span>{card.description}</span>
                    {card.trend && (
                      <span className={`flex items-center ${
                        card.trendDirection === "up" ? "text-green-600" : 
                        card.trendDirection === "down" ? "text-red-600" : 
                        "text-gray-600"
                      }`}>
                        {card.trendDirection === "up" ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : card.trendDirection === "down" ? (
                          <TrendingDown className="h-3 w-3 mr-1" /> 
                        ) : null}
                        {card.trend}
                      </span>
                    )}
                  </CardDescription>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {/* Recent Activities */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Activities</CardTitle>
              <Link to="/dashboard/history">
                <span className="text-sm text-purple-600 hover:text-purple-800 transition-colors">View All</span>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentActivities.length > 0 ? recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${
                      activity.type === "export" ? "bg-green-100" : 
                      activity.type === "delete" ? "bg-red-100" : 
                      "bg-blue-100"
                    }`}>
                      {activity.type === "export" ? 
                        <ArrowUp size={18} className="text-green-600" /> : 
                        activity.type === "delete" ?
                        <Trash2 size={18} className="text-red-600" /> :
                        <Database size={18} className="text-blue-600" />
                      }
                    </div>
                    <div>
                      <div className="font-medium">{activity.name}</div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                          activity.status === "success" ? "bg-green-500" : 
                          activity.status === "pending" ? "bg-yellow-500" : 
                          "bg-red-500"
                        }`}></span>
                        <span className="capitalize">{activity.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{activity.records}</div>
                    <div className="text-xs text-gray-500">{activity.date}</div>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 flex flex-col items-center justify-center py-6 text-center">
                  <Database className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">No recent activities recorded</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Activities will appear here as you use the application
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/dashboard/export">
                <div className="flex items-center p-4 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 transition-colors">
                  <div className="p-2 bg-green-100 rounded-full mr-3">
                    <ArrowUp size={20} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-800">Export Data</h3>
                    <p className="text-sm text-green-600">Export your QB records</p>
                  </div>
                </div>
              </Link>
              
              <Link to="/dashboard/delete">
                <div className="flex items-center p-4 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors">
                  <div className="p-2 bg-red-100 rounded-full mr-3">
                    <Trash2 size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-red-800">Delete Records</h3>
                    <p className="text-sm text-red-600">Clean up unnecessary data</p>
                  </div>
                </div>
              </Link>
              
              <Link to="/dashboard/import">
                <div className="flex items-center p-4 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="p-2 bg-blue-100 rounded-full mr-3">
                    <ArrowDown size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800">Import Data</h3>
                    <p className="text-sm text-blue-600">Coming soon</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;

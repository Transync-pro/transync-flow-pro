
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { format } from "date-fns";
import { ChevronLeft, ArrowUp, ArrowDown, Trash2, Database, Calendar as CalendarIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  entity_type: string;
  operation_type: string;
  status: string;
  details: any;
  created_at: string;
  record_id: string | null;
}

const History = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    to: new Date()
  });
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>([]);
  const [entityTypeOptions, setEntityTypeOptions] = useState<string[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  
  // Fetch activities from the database
  useEffect(() => {
    async function fetchActivities() {
      setIsLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        
        let query = supabase
          .from('operation_logs')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false });
        
        if (dateRange.from) {
          query = query.gte('created_at', dateRange.from.toISOString());
        }
        
        if (dateRange.to) {
          query = query.lte('created_at', dateRange.to.toISOString());
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching activities:', error);
          return;
        }
        
        if (data) {
          setActivities(data);
          
          // Extract unique entity types for filtering
          const entityTypes = [...new Set(data.map(item => item.entity_type))];
          setEntityTypeOptions(entityTypes);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchActivities();
  }, [dateRange]);
  
  // Filter activities based on search, tab, and entity type
  useEffect(() => {
    let filtered = [...activities];
    
    // Filter by operation type based on active tab
    if (activeTab !== "all") {
      filtered = filtered.filter(activity => activity.operation_type === activeTab);
    }
    
    // Filter by selected entity types
    if (selectedEntityTypes.length > 0) {
      filtered = filtered.filter(activity => selectedEntityTypes.includes(activity.entity_type));
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.entity_type.toLowerCase().includes(query) ||
        activity.operation_type.toLowerCase().includes(query) ||
        (activity.record_id && activity.record_id.toLowerCase().includes(query))
      );
    }
    
    setFilteredActivities(filtered);
  }, [activities, activeTab, selectedEntityTypes, searchQuery]);
  
  // Handle entity type selection
  const toggleEntityType = (entityType: string) => {
    setSelectedEntityTypes(prev => 
      prev.includes(entityType)
        ? prev.filter(type => type !== entityType)
        : [...prev, entityType]
    );
  };
  
  // Format date for display
  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };
  
  // Get record count from activity details
  const getRecordCount = (activity: Activity): string => {
    if (activity.details && typeof activity.details === 'object') {
      const details = activity.details as Record<string, any>;
      if (typeof details.count !== 'undefined') {
        return `${details.count} records`;
      }
    }
    return activity.record_id ? '1 record' : '';
  };
  
  // Get icon for operation type
  const getOperationIcon = (operationType: string) => {
    switch (operationType) {
      case 'export':
        return <ArrowUp size={18} className="text-green-600" />;
      case 'import':
        return <ArrowDown size={18} className="text-blue-600" />;
      case 'delete':
        return <Trash2 size={18} className="text-red-600" />;
      case 'fetch':
      default:
        return <Database size={18} className="text-blue-600" />;
    }
  };
  
  // Get background color for operation type
  const getOperationBackground = (operationType: string) => {
    switch (operationType) {
      case 'export':
        return 'bg-green-100';
      case 'import':
        return 'bg-blue-100';
      case 'delete':
        return 'bg-red-100';
      case 'fetch':
      default:
        return 'bg-blue-100';
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'partial':
        return 'bg-orange-500';
      case 'error':
      default:
        return 'bg-red-500';
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-semibold">Activity History</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Activities</CardTitle>
          <CardDescription>
            Use the filters below to narrow down your activity history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search activities..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Date Range Picker */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from) setDateRange(range);
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Entity Type Selector */}
            <div className="space-y-2">
              <Label>Entity Types</Label>
              <Select
                onValueChange={(value) => {
                  if (value === "all") {
                    setSelectedEntityTypes([]);
                  } else {
                    toggleEntityType(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entityTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedEntityTypes.map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleEntityType(type)}
                  >
                    {type} ×
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="export">Exports</TabsTrigger>
          <TabsTrigger value="import">Imports</TabsTrigger>
          <TabsTrigger value="delete">Deletions</TabsTrigger>
          <TabsTrigger value="fetch">Data Fetches</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all" ? "All Activities" : 
                 activeTab === "export" ? "Export Activities" :
                 activeTab === "import" ? "Import Activities" :
                 activeTab === "delete" ? "Deletion Activities" :
                 "Data Fetch Activities"} 
                 {filteredActivities.length > 0 && ` (${filteredActivities.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mb-4" />
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Database className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Activities Found</h3>
                  <p className="text-gray-500 max-w-md">
                    No matching activities were found for your current filter criteria.
                    Try adjusting your filters or date range.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActivities.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start justify-between p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start">
                        <div className={`p-2 rounded-full mr-3 mt-1 ${getOperationBackground(activity.operation_type)}`}>
                          {getOperationIcon(activity.operation_type)}
                        </div>
                        <div>
                          <div className="font-medium text-lg">
                            {activity.entity_type} {activity.operation_type.charAt(0).toUpperCase() + activity.operation_type.slice(1)}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {activity.record_id && (
                              <div className="text-gray-600">Record ID: {activity.record_id}</div>
                            )}
                            <div className="flex items-center mt-1">
                              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${getStatusColor(activity.status)}`}></span>
                              <span className="capitalize">{activity.status}</span>
                            </div>
                            {activity.details && activity.details.error && (
                              <div className="text-red-500 mt-1">
                                Error: {activity.details.error}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {getRecordCount(activity)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatActivityDate(activity.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;

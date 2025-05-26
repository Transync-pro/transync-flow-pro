
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentConfig, getEnvironment } from "@/config/environment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Database, Settings, User } from "lucide-react";

const EnvironmentDebugger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDebugInfo();
    }
  }, [isOpen]);

  const fetchDebugInfo = async () => {
    try {
      // Get current environment config
      const config = getCurrentConfig();
      const environment = getEnvironment();
      
      // Test database connection
      const { data: testData, error: testError } = await supabase
        .from('quickbooks_connections')
        .select('count', { count: 'exact', head: true });

      // Get current user
      const { data: userData } = await supabase.auth.getUser();

      setConnectionInfo({
        environment,
        supabaseUrl: config.supabase.url,
        supabaseKey: `${config.supabase.anonKey.substring(0, 20)}...`,
        quickbooksEnv: config.quickbooks.environment,
        dbConnectionWorking: !testError,
        dbError: testError?.message,
        currentPath: window.location.pathname,
        currentOrigin: window.location.origin
      });

      setUserInfo(userData.user);
    } catch (error) {
      console.error('Debug info fetch error:', error);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm"
        >
          <Settings className="h-4 w-4 mr-2" />
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Environment Debug
            </CardTitle>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {connectionInfo && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Environment:</span>
                  <Badge variant={connectionInfo.environment === 'production' ? 'default' : 'secondary'}>
                    {connectionInfo.environment}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Supabase URL:</span>
                    <span className="text-right max-w-48 truncate" title={connectionInfo.supabaseUrl}>
                      {connectionInfo.supabaseUrl}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>QB Environment:</span>
                    <span>{connectionInfo.quickbooksEnv}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Path:</span>
                    <span>{connectionInfo.currentPath}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium">DB Connection:</span>
                  <Badge variant={connectionInfo.dbConnectionWorking ? 'default' : 'destructive'}>
                    {connectionInfo.dbConnectionWorking ? 'Working' : 'Error'}
                  </Badge>
                </div>

                {connectionInfo.dbError && (
                  <div className="text-red-600 text-xs bg-red-50 p-2 rounded">
                    {connectionInfo.dbError}
                  </div>
                )}
              </div>

              {userInfo && (
                <div className="border-t pt-3 space-y-1">
                  <div className="flex items-center gap-2 font-medium">
                    <User className="h-3 w-3" />
                    Current User
                  </div>
                  <div className="text-xs space-y-1">
                    <div>Email: {userInfo.email}</div>
                    <div>ID: {userInfo.id}</div>
                  </div>
                </div>
              )}

              <Button
                onClick={fetchDebugInfo}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Refresh
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvironmentDebugger;

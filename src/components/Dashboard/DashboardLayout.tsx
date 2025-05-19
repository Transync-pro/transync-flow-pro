
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ArrowDown,
  ArrowUp,
  Trash2,
  Search,
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account."
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out.",
        variant: "destructive"
      });
    }
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.user_metadata?.full_name) return "U";
    
    const fullName = user.user_metadata.full_name;
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length-1][0]}`.toUpperCase();
    }
    return fullName[0].toUpperCase();
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-1 focus:outline-none">
          <div className="h-8 w-8 rounded-full bg-transyncpro-button text-white flex items-center justify-center cursor-pointer">
            {getUserInitials()}
          </div>
          <ChevronDown size={14} className="text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-medium">
          {user?.email}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User size={16} className="mr-2" />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut size={16} className="mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DashboardHeader = () => {
  const navigate = useNavigate();
  
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center">
        <SidebarTrigger className="mr-4" />
        <Link to="/dashboard" className="text-2xl font-bold gradient-text">
          TransyncPro
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex bg-gray-100 rounded-full px-4 py-2 items-center">
          <Search size={16} className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none focus:outline-none text-sm"
          />
        </div>
        
        <UserMenu />
      </div>
    </header>
  );
};

const QuickbooksConnectionButton = () => {
  const { isConnected, disconnect, isLoading } = useQuickbooks();
  const navigate = useNavigate();

  const handleDisconnect = async () => {
    await disconnect();
    navigate("/disconnected");
  };

  const handleConnect = () => {
    navigate("/disconnected");
  };

  if (isLoading) {
    return (
      <Button className="w-full" variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  return isConnected ? (
    <button
      onClick={handleDisconnect}
      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
    >
      Disconnect QuickBooks
    </button>
  ) : (
    <button
      onClick={handleConnect}
      className="w-full bg-transyncpro-button hover:bg-transyncpro-button/90 text-white py-2 px-4 rounded transition-colors"
    >
      Connect to QuickBooks
    </button>
  );
};

const DashboardSidebar = () => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  // Helper function to check if a route is active
  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="pt-4 flex flex-col h-full">
        <div className="flex-1">
          <SidebarGroup>
            <SidebarGroupLabel>Data Management</SidebarGroupLabel>
            <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/dashboard" 
                    className={`flex items-center ${isActive("/dashboard") ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100"} rounded-md px-3 py-2 w-full transition-colors`}
                  >
                    <LayoutDashboard size={20} className={`${!isCollapsed ? "mr-3" : ""} ${isActive("/dashboard") ? "text-blue-600" : "text-gray-600"}`} />
                    {!isCollapsed && <span>Dashboard</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/dashboard/import" 
                    className={`flex items-center ${isActive("/dashboard/import") ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100"} rounded-md px-3 py-2 w-full transition-colors`}
                  >
                    <ArrowDown size={20} className={`${!isCollapsed ? "mr-3" : ""} ${isActive("/dashboard/import") ? "text-blue-600" : "text-gray-600"}`} />
                    {!isCollapsed && <span>Import</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/dashboard/export" 
                    className={`flex items-center ${isActive("/dashboard/export") ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100"} rounded-md px-3 py-2 w-full transition-colors`}
                  >
                    <ArrowUp size={20} className={`${!isCollapsed ? "mr-3" : ""} ${isActive("/dashboard/export") ? "text-blue-600" : "text-gray-600"}`} />
                    {!isCollapsed && <span>Export</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/dashboard/delete" 
                    className={`flex items-center ${isActive("/dashboard/delete") ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100"} rounded-md px-3 py-2 w-full transition-colors`}
                  >
                    <Trash2 size={20} className={`${!isCollapsed ? "mr-3" : ""} ${isActive("/dashboard/delete") ? "text-blue-600" : "text-gray-600"}`} />
                    {!isCollapsed && <span>Delete</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
      {/* QuickBooks connection button at the bottom */}
      <div className="p-4 border-t mt-4">
        <QuickbooksConnectionButton />
      </div>
    </SidebarContent>
  </Sidebar>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <DashboardHeader />
        <div className="flex flex-1 w-full">
          <DashboardSidebar />
          <div className="flex-1 overflow-auto p-6 bg-gray-50">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;

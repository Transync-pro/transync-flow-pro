
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  LayoutDashboard,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
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

  // Check if the current path matches the menu item path
  const isActivePath = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="pt-4 flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
        <div className="flex-1">
          <SidebarGroup>
            <SidebarGroupLabel className="text-purple-700 font-semibold">Data Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Dashboard">
                    <Link 
                      to="/dashboard" 
                      className={`flex items-center ${isActivePath('/dashboard') && !isCollapsed ? 'bg-purple-100 text-purple-800' : ''} hover:bg-purple-50 transition-colors rounded-md`}
                    >
                      <div className={`p-1.5 rounded-md ${isActivePath('/dashboard') ? 'bg-purple-200 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                        <LayoutDashboard size={16} />
                      </div>
                      {!isCollapsed && <span className="ml-2 font-medium">Dashboard</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Import">
                    <Link 
                      to="/dashboard/import" 
                      className={`flex items-center ${isActivePath('/dashboard/import') && !isCollapsed ? 'bg-purple-100 text-purple-800' : ''} hover:bg-purple-50 transition-colors rounded-md`}
                    >
                      <div className={`p-1.5 rounded-md ${isActivePath('/dashboard/import') ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                        <ArrowDown size={16} />
                      </div>
                      {!isCollapsed && <span className="ml-2 font-medium">Import</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Export">
                    <Link 
                      to="/dashboard/export" 
                      className={`flex items-center ${isActivePath('/dashboard/export') && !isCollapsed ? 'bg-purple-100 text-purple-800' : ''} hover:bg-purple-50 transition-colors rounded-md`}
                    >
                      <div className={`p-1.5 rounded-md ${isActivePath('/dashboard/export') ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        <ArrowUp size={16} />
                      </div>
                      {!isCollapsed && <span className="ml-2 font-medium">Export</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Delete">
                    <Link 
                      to="/dashboard/delete" 
                      className={`flex items-center ${isActivePath('/dashboard/delete') && !isCollapsed ? 'bg-purple-100 text-purple-800' : ''} hover:bg-purple-50 transition-colors rounded-md`}
                    >
                      <div className={`p-1.5 rounded-md ${isActivePath('/dashboard/delete') ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                        <Trash2 size={16} />
                      </div>
                      {!isCollapsed && <span className="ml-2 font-medium">Delete</span>}
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

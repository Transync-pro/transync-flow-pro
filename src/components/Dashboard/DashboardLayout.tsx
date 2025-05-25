import React, { useState } from "react";
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
  ArrowDown,
  ArrowUp,
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
        <Link to="/dashboard" className="flex items-center">
          <img 
            src="/TransyncProLogo.png" 
            alt="TransyncPro" 
            className="h-8"
          />
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

import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const QuickbooksConnectionButton = () => {
  // Track explicit user actions separately from background checks
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState(1);
  const [feedback, setFeedback] = useState("");
  const { isConnected, disconnect } = useQuickbooks();
  const navigate = useNavigate();

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      setDialogOpen(false);
      await disconnect();
      navigate("/authenticate", { replace: true });
    } catch (error) {
      console.error("Error disconnecting from QuickBooks:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect from QuickBooks",
        variant: "destructive"
      });
      setIsDisconnecting(false);
    }
  };

  const handleConnect = () => {
    navigate("/authenticate");
  };

  // Only show loading state during explicit user-initiated disconnect action
  if (isDisconnecting) {
    return (
      <Button className="w-full" variant="outline" disabled>
        Disconnecting...
      </Button>
    );
  }

  // Multi-step dialog content
  const renderDialogContent = () => {
    if (dialogStep === 1) {
      return (
        <>
          <DialogHeader>
            <DialogTitle>Are you sure you want to disconnect?</DialogTitle>
            <DialogDescription>
              Disconnecting will remove your QuickBooks connection.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setDialogStep(2)}
            >
              Yes, disconnect my account
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </>
      );
    }
    if (dialogStep === 2) {
      return (
        <>
          <DialogHeader>
            <DialogTitle>Why are you disconnecting?</DialogTitle>
            <DialogDescription>
              Please let us know your reason for disconnecting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[
              "The app is too expensive",
              "Switching to a different app",
              "The app is too complicated",
              "I don't need it anymore",
              "Others"
            ].map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="disconnect-feedback"
                  value={option}
                  checked={feedback === option}
                  onChange={() => setFeedback(option)}
                  className="accent-red-600"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setDialogStep(3)}
              disabled={!feedback}
            >
              Continue
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </>
      );
    }
    if (dialogStep === 3) {
      return (
        <>
          <DialogHeader>
            <DialogTitle>Things to Know Before You Disconnect</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4 text-left text-sm text-gray-700">
            <div>
              <span className="font-semibold">Subscription Cancellation</span><br />
              Disconnecting from QuickBooks will cancel your Transync Pro subscription. Please note that we do not offer refunds for any payments already made.
            </div>
            <div>
              <span className="font-semibold">Loss of Account Data</span><br />
              Once disconnected, all your account data, settings, and saved information will be permanently deleted and cannot be recovered.
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDisconnect}
            >
              Disconnect QuickBooks
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </>
      );
    }
    return null;
  };

  return isConnected ? (
    <>
      <Button
        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
        onClick={() => { setDialogOpen(true); setDialogStep(1); }}
      >
        Disconnect QuickBooks
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent hideCloseButton>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </>
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
  const isActivePath = (path: string) => {
    // For the dashboard path, only match exact '/dashboard' path
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    // For other paths, match exact or sub-paths
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

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
                        <ArrowUp size={16} />
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
                        <ArrowDown size={16} />
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

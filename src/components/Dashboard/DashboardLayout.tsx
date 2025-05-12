
import { useState } from "react";
import { Link } from "react-router-dom";
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
  Plus,
  File,
  ArrowUp,
  ArrowDown,
  Trash2,
  LayoutDashboard,
  Search,
  Calendar,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";

const DashboardHeader = () => {
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
        
        <div>
          <Button className="bg-transyncpro-button hover:bg-transyncpro-button/90 text-white">
            <Plus size={16} className="mr-2" /> New Task
          </Button>
        </div>
        
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-transyncpro-button text-white flex items-center justify-center">
            JS
          </div>
        </div>
      </div>
    </header>
  );
};

const DashboardSidebar = () => {
  const { collapsed } = useSidebar();
  
  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible>
      <SidebarContent className="pt-4">
        <SidebarGroup defaultOpen>
          <SidebarGroupLabel>Data Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard" className="flex items-center">
                    <LayoutDashboard size={20} className="mr-2" />
                    {!collapsed && <span>Dashboard</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard/import" className="flex items-center">
                    <ArrowDown size={20} className="mr-2" />
                    {!collapsed && <span>Import</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard/export" className="flex items-center">
                    <ArrowUp size={20} className="mr-2" />
                    {!collapsed && <span>Export</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard/delete" className="flex items-center">
                    <Trash2 size={20} className="mr-2" />
                    {!collapsed && <span>Delete</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Templates</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard/templates" className="flex items-center">
                    <File size={20} className="mr-2" />
                    {!collapsed && <span>My Templates</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard/schedule" className="flex items-center">
                    <Calendar size={20} className="mr-2" />
                    {!collapsed && <span>Scheduled Jobs</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard/completed" className="flex items-center">
                    <Check size={20} className="mr-2" />
                    {!collapsed && <span>Completed Jobs</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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

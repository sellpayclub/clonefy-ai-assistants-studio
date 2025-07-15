import { useState } from "react";
import { Bot, MessageSquare, Smartphone, LayoutDashboard } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Agentes", url: "/assistants", icon: Bot },
  { title: "WhatsApp", url: "/whatsapp", icon: Smartphone },
  { title: "Conversas", url: "/conversations", icon: MessageSquare },
];

const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-semibold border-r-3 border-primary shadow-sm" 
      : "hover:bg-gradient-to-r hover:from-primary/8 hover:to-primary/3 hover:text-primary transition-all duration-300 hover:translate-x-1";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-72"} collapsible="icon">
      <SidebarHeader className="border-b-0 p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-30"></div>
        {!collapsed && (
          <div className="flex items-center justify-center relative z-10">
            <img 
              src="/lovable-uploads/4ad83733-0d3f-4ea8-a2b8-74822c594588.png" 
              alt="CLONEFY Logo" 
              className="h-16 w-auto transition-all duration-300 hover:scale-105"
            />
          </div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center relative z-10">
            <img 
              src="/lovable-uploads/929d6edf-5859-4b0c-8ebc-9ee077349b6a.png" 
              alt="CLONEFY Icon" 
              className="w-10 h-10 transition-all duration-300 hover:scale-110"
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 pt-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 text-xs font-semibold uppercase tracking-wider mb-4 px-3">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink to={item.url} end className={getNavCls}>
                      <div className="flex items-center w-full">
                        <div className="flex items-center justify-center w-6 h-6 mr-3">
                          <item.icon className="h-5 w-5" />
                        </div>
                        {!collapsed && (
                          <span className="text-sm font-medium">{item.title}</span>
                        )}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
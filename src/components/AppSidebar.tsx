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
    isActive ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" : "hover:bg-primary/5 hover:text-primary transition-all duration-200";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarHeader className="border-b p-4 bg-gradient-to-r from-background to-muted/20">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/4ad83733-0d3f-4ea8-a2b8-74822c594588.png" 
              alt="CLONEFY Logo" 
              className="h-8 w-auto"
            />
          </div>
        )}
        {collapsed && (
          <img 
            src="/lovable-uploads/929d6edf-5859-4b0c-8ebc-9ee077349b6a.png" 
            alt="CLONEFY Icon" 
            className="w-8 h-8 mx-auto"
          />
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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
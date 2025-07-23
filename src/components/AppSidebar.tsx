import { useState, useCallback, useMemo, useEffect } from "react";
import { Bot, MessageSquare, Smartphone, LayoutDashboard, Settings, LogOut, Calendar } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState, forceCleanReload } from "@/lib/auth-utils";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { User } from "@supabase/supabase-js";

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
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { title: "dashboard.title", url: "/dashboard", icon: LayoutDashboard, description: "dashboard.description" },
  { title: "sidebar.agents.title", url: "/assistants", icon: Bot, description: "sidebar.agents.description" },
  { title: "sidebar.whatsapp.title", url: "/whatsapp", icon: Smartphone, description: "sidebar.whatsapp.description" },
  { title: "sidebar.conversations.title", url: "/conversations", icon: MessageSquare, description: "sidebar.conversations.description" },
  { title: "Calendário", url: "/calendar", icon: Calendar, description: "Gerencie agendamentos dos seus agentes" },
  { title: "sidebar.admin.title", url: "/admin", icon: Settings, description: "sidebar.admin.description" },
];

const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getCurrentUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Filter menu items based on user email
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      // Only show admin for personaldann@gmail.com
      if (item.url === '/admin') {
        return user?.email === 'personaldann@gmail.com';
      }
      return true;
    });
  }, [user?.email]);

  const isActive = useCallback((path: string) => currentPath === path, [currentPath]);

  const handleSignOut = useCallback(async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out (ignore errors)
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.warn('Error during signOut:', err);
      }
      
      // Force clean page reload for a fresh state
      forceCleanReload('/auth');
    } catch (error: any) {
      // Even if there are errors, clean up and redirect
      cleanupAuthState();
      toast({
        title: t("auth.signOutError"),
        description: error.message,
        variant: "destructive",
      });
      forceCleanReload('/auth');
    }
  }, [toast]);

  return (
    <Sidebar 
      className={`transition-all duration-300 ${collapsed ? "w-10 md:w-14" : "w-56 md:w-64"} border-r border-border/40 bg-gradient-to-b from-background via-background to-muted/20 backdrop-blur-sm`} 
      collapsible="icon"
    >
      {/* Header com Logo */}
      <SidebarHeader className="border-b border-border/40 p-4 md:p-6 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-center h-12 md:h-16">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              {/* Logo para modo claro */}
              <img 
                src="/lovable-uploads/fbe6c7af-7d70-474d-af99-5f513f7a14dc.png" 
                alt="CLONEFY" 
                className="h-16 w-auto dark:hidden md:h-20"
              />
              {/* Logo para modo escuro */}
              <img 
                src="/lovable-uploads/8f2944d9-660f-4eb7-bae6-e226176b6a6d.png" 
                alt="CLONEFY" 
                className="h-16 w-auto hidden dark:block md:h-20"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
              <img 
                src="/lovable-uploads/59070bb1-9779-4bbb-a3d5-a65bacf38b70.png" 
                alt="CLONEFY" 
                className="w-8 h-8"
              />
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Conteúdo Principal */}
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-3 px-2">
              {t("sidebar.mainMenu")}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMenuItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10 group">
                      <NavLink 
                        to={item.url} 
                        end 
                        className={`
                          flex items-center rounded-lg transition-all duration-200 relative
                          ${active 
                            ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-medium shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }
                          ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}
                        `}
                      >
                        {active && !collapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                        )}
                        
                        <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                          <item.icon className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                          {!collapsed && (
                            <span className="text-sm font-medium">{t(item.title)}</span>
                          )}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3 border-t border-border/40 space-y-2">
        {/* Language & Theme Toggle */}
        <div className="flex justify-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
        
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={handleSignOut}
          className={`w-full text-muted-foreground hover:text-foreground hover:bg-muted/50 ${collapsed ? 'h-10' : 'justify-start'}`}
        >
          <LogOut className={`${collapsed ? 'w-4 h-4' : 'w-4 h-4 mr-2'}`} />
          {!collapsed && t("sidebar.signOut")}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
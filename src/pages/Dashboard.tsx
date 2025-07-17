import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState, forceCleanReload } from "@/lib/auth-utils";
import { User, Session } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageSquare, Smartphone, Users, Plus, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import SupportChatWidget from "@/components/SupportChatWidget";
import { useUserLimits } from "@/hooks/useUserLimits";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";

interface DashboardStats {
  assistants: number;
  connections: number;
  conversations: number;
  messages: number;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { limits, loading: limitsLoading } = useUserLimits();

  // Optimized stats loading using React Query
  const { data: stats = { assistants: 0, connections: 0, conversations: 0, messages: 0 }, isLoading } = useOptimizedQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) return { assistants: 0, connections: 0, conversations: 0, messages: 0 };

      try {
        // Use the same RPC function to get actual data
        const { data: userStats, error } = await supabase.rpc('get_user_usage_stats', {
          target_user_id: user.id
        });

        if (error) throw error;

        // Get additional stats in parallel
        const [conversationsResult] = await Promise.all([
          supabase
            .from('conversations')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('is_active', true)
        ]);

        const currentStats = userStats?.[0];

        return {
          assistants: currentStats?.current_assistants || 0,
          connections: currentStats?.current_whatsapp_connections || 0,
          conversations: conversationsResult.count || 0,
          messages: 0 // Simplificado por enquanto
        };
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        return { assistants: 0, connections: 0, conversations: 0, messages: 0 };
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds - mais fresco
    refetchOnWindowFocus: true,
  });

  // Optimized auth state management
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return;
            
            setSession(session);
            setUser(session?.user ?? null);
            
            if (!session?.user) {
              navigate('/auth');
              return;
            }
          }
        );

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/auth');
          return;
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erro na inicialização Dashboard:', error);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Memoized sign out handler
  const handleSignOut = useCallback(async () => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.warn('Error during signOut:', err);
      }
      
      forceCleanReload('/auth');
    } catch (error: any) {
      cleanupAuthState();
      toast({
        title: t("auth.signOutError"),
        description: error.message,
        variant: "destructive",
      });
      forceCleanReload('/auth');
    }
  }, [toast, t]);

  // Memoized navigation handlers to prevent unnecessary re-renders
  const navigationHandlers = useMemo(() => ({
    toAssistants: () => navigate('/assistants'),
    toWhatsApp: () => navigate('/whatsapp'),
    toConversations: () => navigate('/conversations'),
  }), [navigate]);

  if (isLoading || limitsLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t("dashboard.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{t("dashboard.title")}</h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  {t("dashboard.welcome")}, {user?.user_metadata?.full_name || user?.email}!
                </p>
              </div>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="self-start md:self-auto">
              {t("dashboard.signOut")}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("dashboard.stats.agents")}</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.assistants}</div>
                <p className="text-xs text-muted-foreground">
                  {limits ? (
                    <span className={limits.can_create_assistant ? "text-green-600" : "text-red-600"}>
                      {limits.current_assistants}/{limits.max_assistants} {t("dashboard.stats.agentsDesc")}
                    </span>
                  ) : (
                    t("dashboard.stats.agentsDesc")
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("dashboard.stats.connections")}</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.connections}</div>
                <p className="text-xs text-muted-foreground">
                  {limits ? (
                    <span className={limits.can_create_whatsapp_connection ? "text-green-600" : "text-red-600"}>
                      {limits.current_whatsapp_connections}/{limits.max_whatsapp_connections} {t("dashboard.stats.connectionsDesc")}
                    </span>
                  ) : (
                    t("dashboard.stats.connectionsDesc")
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions - Melhor responsividade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20 border-border/50" onClick={navigationHandlers.toAssistants}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-semibold">{t("dashboard.quickActions.createAgent.title")}</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {t("dashboard.quickActions.createAgent.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-lg hover:shadow-xl transition-all group-hover:scale-105" onClick={navigationHandlers.toAssistants}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("dashboard.quickActions.createAgent.button")}
                </Button>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20 border-border/50" onClick={navigationHandlers.toWhatsApp}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Smartphone className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <span className="text-lg font-semibold">{t("dashboard.quickActions.connectWhatsApp.title")}</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {t("dashboard.quickActions.connectWhatsApp.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full bg-gradient-to-r from-secondary/80 to-muted hover:from-primary/20 hover:to-primary/10 border border-primary/20 transition-all group-hover:scale-105" variant="outline" onClick={navigationHandlers.toWhatsApp}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("dashboard.quickActions.connectWhatsApp.button")}
                </Button>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20 border-border/50" onClick={navigationHandlers.toConversations}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <span className="text-lg font-semibold">{t("dashboard.quickActions.startChat.title")}</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {t("dashboard.quickActions.startChat.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full bg-gradient-to-r from-accent/80 to-muted hover:from-primary/30 hover:to-primary/20 border border-primary/30 transition-all group-hover:scale-105" variant="secondary" onClick={navigationHandlers.toConversations}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t("dashboard.quickActions.startChat.button")}
                </Button>
              </CardContent>
            </Card>
          </div>

        </main>
        
        {/* Support Chat Widget for internal system */}
        <SupportChatWidget />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
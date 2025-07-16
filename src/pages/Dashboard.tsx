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

interface DashboardStats {
  assistants: number;
  connections: number;
  conversations: number;
  messages: number;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    assistants: 0,
    connections: 0,
    conversations: 0,
    messages: 0
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const loadDashboardStats = useCallback(async (currentUser?: User) => {
    const userToUse = currentUser || user;
    if (!userToUse) return;

    try {
      // Parallel requests for better performance
      const [assistantsResult, connectionsResult, conversationsResult] = await Promise.all([
        supabase
          .from('assistants')
          .select('*', { count: 'exact' })
          .eq('user_id', userToUse.id)
          .eq('is_active', true),
        supabase
          .from('n8n_fluxogpt')
          .select('*', { count: 'exact' })
          .eq('emailuser', userToUse.email),
        supabase
          .from('conversations')
          .select('*', { count: 'exact' })
          .eq('user_id', userToUse.id)
          .eq('is_active', true)
      ]);

      // Get messages count only if there are conversations
      let messagesCount = 0;
      if (conversationsResult.data && conversationsResult.data.length > 0) {
        const conversationIds = conversationsResult.data.map(c => c.id);
        const { count: totalMessages } = await supabase
          .from('messages')
          .select('*', { count: 'exact' })
          .in('conversation_id', conversationIds);
        messagesCount = totalMessages || 0;
      }

      const newStats = {
        assistants: assistantsResult.count || 0,
        connections: connectionsResult.count || 0,
        conversations: conversationsResult.count || 0,
        messages: messagesCount
      };

      setStats(newStats);

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  }, [user]);

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

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              setTimeout(async () => {
                if (isMounted) {
                  await loadDashboardStats(session?.user);
                  setLoading(false);
                }
              }, 100);
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
        
        await loadDashboardStats(session?.user);
        setLoading(false);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erro na inicialização Dashboard:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Memoized auto-refresh with cleanup
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadDashboardStats(user);
    }, 60000); // Increased to 60 seconds for better performance

    return () => clearInterval(interval);
  }, [user, loadDashboardStats]);

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

  if (loading) {
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
                  {t("dashboard.stats.agentsDesc")}
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
                  {t("dashboard.stats.connectionsDesc")}
                </p>
              </CardContent>
            </Card>

          </div>

          {/* Quick Actions - Melhor responsividade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20 border-border/50" onClick={() => navigate('/assistants')}>
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
                <Button className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-lg hover:shadow-xl transition-all group-hover:scale-105" onClick={() => navigate('/assistants')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("dashboard.quickActions.createAgent.button")}
                </Button>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20 border-border/50" onClick={() => navigate('/whatsapp')}>
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
                <Button className="w-full bg-gradient-to-r from-secondary/80 to-muted hover:from-primary/20 hover:to-primary/10 border border-primary/20 transition-all group-hover:scale-105" variant="outline" onClick={() => navigate('/whatsapp')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("dashboard.quickActions.connectWhatsApp.button")}
                </Button>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20 border-border/50" onClick={() => navigate('/conversations')}>
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
                <Button className="w-full bg-gradient-to-r from-accent/80 to-muted hover:from-primary/30 hover:to-primary/20 border border-primary/30 transition-all group-hover:scale-105" variant="secondary" onClick={() => navigate('/conversations')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t("dashboard.quickActions.startChat.button")}
                </Button>
              </CardContent>
            </Card>
          </div>

        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
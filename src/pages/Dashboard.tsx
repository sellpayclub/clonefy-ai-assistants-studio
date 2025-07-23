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
  
  // Estado para dados sempre frescos
  const [stats, setStats] = useState<DashboardStats>({ assistants: 0, connections: 0, conversations: 0, messages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Função para carregar dados sempre frescos
  const loadDashboardData = useCallback(async () => {
    if (!user) {
      console.log('Usuário não definido');
      return;
    }

    try {
      console.log('=== CARREGANDO DASHBOARD ===');
      console.log('User ID:', user.id);
      
      // Consulta direta para agentes ativos
      const { data: assistantsData, error: assistantsError } = await supabase
        .from('assistants')
        .select('is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (assistantsError) {
        console.error('Erro ao buscar agentes:', assistantsError);
      }
      
      // Consulta direta para conexões WhatsApp
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('whatsapp_connections')
        .select('id')
        .eq('user_id', user.id);
      
      if (connectionsError) {
        console.error('Erro ao buscar conexões:', connectionsError);
      }

      // Também contar da tabela n8n_fluxogpt para compatibilidade
      const { data: n8nConnectionsData, error: n8nConnectionsError } = await supabase
        .from('n8n_fluxogpt')
        .select('id')
        .eq('emailuser', user.email);

      if (n8nConnectionsError) {
        console.error('Erro ao buscar conexões n8n:', n8nConnectionsError);
      }

      const currentWhatsAppConnections = connectionsData?.length || 0;
      const currentN8nConnections = n8nConnectionsData?.length || 0;
      const totalConnections = currentWhatsAppConnections + currentN8nConnections;

      const result = {
        assistants: assistantsData?.length || 0,
        connections: totalConnections,
        conversations: 0,
        messages: 0
      };

      console.log('=== RESULTADO DASHBOARD ===');
      console.log('Agentes ativos:', result.assistants);
      console.log('Conexões WhatsApp:', currentWhatsAppConnections);
      console.log('Conexões N8N:', currentN8nConnections);
      console.log('Total conexões:', result.connections);
      console.log('Limites carregados:', limits);
      console.log('============================');
      
      setStats(result);
    } catch (error) {
      console.error('Erro crítico no dashboard:', error);
      setStats({ assistants: 0, connections: 0, conversations: 0, messages: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [user, limits]);

  // Carregar dados quando user estiver disponível
  useEffect(() => {
    if (user && !limitsLoading) {
      loadDashboardData();
    }
  }, [user, limitsLoading, loadDashboardData]);

  // Setup realtime subscriptions para atualizações automáticas
  useEffect(() => {
    if (!user) return;

    console.log('=== CONFIGURANDO REALTIME ===');
    
    // Subscription para assistants
    const assistantsChannel = supabase
      .channel('assistants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assistants',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Mudança detectada em assistants:', payload);
          loadDashboardData();
        }
      )
      .subscribe();

    // Subscription para whatsapp_connections
    const connectionsChannel = supabase
      .channel('connections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_connections',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Mudança detectada em conexões:', payload);
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assistantsChannel);
      supabase.removeChannel(connectionsChannel);
    };
  }, [user, loadDashboardData]);

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

  // Fallback para garantir que stats sempre existe
  const safeStats = stats || { assistants: 0, connections: 0, conversations: 0, messages: 0 };

  if (isLoading || limitsLoading || !user) {
    console.log('=== DASHBOARD LOADING STATE ===');
    console.log('isLoading:', isLoading);
    console.log('limitsLoading:', limitsLoading);
    console.log('user:', user ? 'existe' : 'null');
    console.log('==============================');
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t("dashboard.loading")}</p>
        </div>
      </div>
    );
  }

  console.log('=== DASHBOARD RENDERIZANDO ===');
  console.log('Stats:', safeStats);
  console.log('Limits:', limits);
  console.log('User:', user?.email);
  console.log('===============================');

  
  try {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
        
        <main className="flex-1 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{t("dashboard.title")}</h1>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                  {t("dashboard.welcome")}, {user?.user_metadata?.full_name || user?.email}!
                </p>
              </div>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="w-full sm:w-auto text-sm">
              {t("dashboard.signOut")}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">{t("dashboard.stats.agents")}</CardTitle>
                <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{safeStats.assistants}</div>
                <p className="text-xs text-muted-foreground">
                  {limits ? (
                    <span className="text-green-600">
                      {safeStats.assistants}/{limits.max_assistants} agentes utilizados
                    </span>
                  ) : (
                    t("dashboard.stats.agentsDesc")
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">{t("dashboard.stats.connections")}</CardTitle>
                <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{safeStats.connections}</div>
                <p className="text-xs text-muted-foreground">
                  {limits ? (
                    <span className="text-green-600">
                      {safeStats.connections}/{limits.max_whatsapp_connections} conexões utilizadas
                    </span>
                  ) : (
                    t("dashboard.stats.connectionsDesc")
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions - Responsividade Mobile Melhorada */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20 border-border/50" onClick={navigationHandlers.toAssistants}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold">{t("dashboard.quickActions.createAgent.title")}</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                  {t("dashboard.quickActions.createAgent.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-lg hover:shadow-xl transition-all group-hover:scale-105 text-sm sm:text-base" onClick={navigationHandlers.toAssistants}>
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  {t("dashboard.quickActions.createAgent.button")}
                </Button>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20 border-border/50" onClick={navigationHandlers.toWhatsApp}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-foreground" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold">{t("dashboard.quickActions.connectWhatsApp.title")}</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                  {t("dashboard.quickActions.connectWhatsApp.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full bg-gradient-to-r from-secondary/80 to-muted hover:from-primary/20 hover:to-primary/10 border border-primary/20 transition-all group-hover:scale-105 text-sm sm:text-base" variant="outline" onClick={navigationHandlers.toWhatsApp}>
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  {t("dashboard.quickActions.connectWhatsApp.button")}
                </Button>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20 border-border/50" onClick={navigationHandlers.toConversations}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold">{t("dashboard.quickActions.startChat.title")}</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                  {t("dashboard.quickActions.startChat.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full bg-gradient-to-r from-accent/80 to-muted hover:from-primary/30 hover:to-primary/20 border border-primary/30 transition-all group-hover:scale-105 text-sm sm:text-base" variant="secondary" onClick={navigationHandlers.toConversations}>
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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
  } catch (error) {
    console.error('ERRO NO DASHBOARD RENDER:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600">Erro no Dashboard</h1>
          <p className="text-muted-foreground">{error?.message || 'Erro desconhecido'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }
};

export default Dashboard;
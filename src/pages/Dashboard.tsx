import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageSquare, Smartphone, Users, Plus, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          window.location.href = '/auth';
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        window.location.href = '/auth';
        return;
      }
      
      loadDashboardStats();
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadDashboardStats = async () => {
    if (!user) return;

    try {
      const [assistantsData, connectionsData, conversationsData, messagesData] = await Promise.all([
        supabase.from('assistants').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_active', true),
        supabase.from('whatsapp_connections').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('conversations').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_active', true),
        supabase.from('messages').select('id', { count: 'exact' }).in('conversation_id', 
          (await supabase.from('conversations').select('id').eq('user_id', user.id).eq('is_active', true)).data?.map(c => c.id) || []
        )
      ]);

      setStats({
        assistants: assistantsData.count || 0,
        connections: connectionsData.count || 0,
        conversations: conversationsData.count || 0,
        messages: messagesData.count || 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/auth';
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                  Bem-vindo de volta, {user?.user_metadata?.full_name || user?.email}!
                </p>
              </div>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              Sair
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assistentes</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.assistants}</div>
                <p className="text-xs text-muted-foreground">
                  Total de assistentes criados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conexões WhatsApp</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.connections}</div>
                <p className="text-xs text-muted-foreground">
                  Instâncias conectadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversas</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversations}</div>
                <p className="text-xs text-muted-foreground">
                  Threads ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.messages}</div>
                <p className="text-xs text-muted-foreground">
                  Total processadas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20" onClick={() => navigate('/assistants')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  Criar Assistente
                </CardTitle>
                <CardDescription>
                  Configure um novo assistente de IA personalizado
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-lg" onClick={() => navigate('/assistants')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Assistente
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20" onClick={() => navigate('/whatsapp')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
                    <Smartphone className="h-5 w-5 text-primary-foreground" />
                  </div>
                  Conectar WhatsApp
                </CardTitle>
                <CardDescription>
                  Adicione uma nova conexão WhatsApp via QR Code
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full bg-gradient-to-r from-secondary/80 to-muted hover:from-primary/20 hover:to-primary/10 border border-primary/20" variant="outline" onClick={() => navigate('/whatsapp')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Conexão
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20" onClick={() => navigate('/conversations')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
                    <MessageSquare className="h-5 w-5 text-primary-foreground" />
                  </div>
                  Iniciar Chat
                </CardTitle>
                <CardDescription>
                  Teste seus assistentes em uma conversa
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full bg-gradient-to-r from-accent/80 to-muted hover:from-primary/30 hover:to-primary/20 border border-primary/30" variant="secondary" onClick={() => navigate('/conversations')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat de Teste
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas ações na sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Conta criada com sucesso</p>
                    <p className="text-xs text-muted-foreground">Bem-vindo à CLONEFY!</p>
                  </div>
                  <Badge variant="secondary">Agora</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Smartphone, QrCode, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface Assistant {
  id: string;
  name: string;
  description?: string;
  openai_assistant_id: string;
}

interface WhatsAppConnection {
  id: number;
  nomeinstancia: string;
  idassistentgpt: string;
  emailuser: string;
  created_at: string;
  threadid?: string;
  whatsappuser?: string;
}

const WhatsApp = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [creating, setCreating] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("connections");
  
  // Form states
  const [instanceName, setInstanceName] = useState("");
  const [selectedAssistant, setSelectedAssistant] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return;
            
            setSession(session);
            setUser(session?.user ?? null);
            
            if (!session?.user) {
              window.location.href = '/auth';
              return;
            }

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              setTimeout(async () => {
                if (isMounted) {
                  await loadData();
                  setLoading(false);
                }
              }, 100);
            }
          }
        );

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          window.location.href = '/auth';
          return;
        }
        
        await loadData();
        setLoading(false);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erro na inicialização WhatsApp:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadData = async () => {
    let currentSession = session;
    if (!currentSession) {
      const { data } = await supabase.auth.getSession();
      currentSession = data.session;
    }

    if (!currentSession) {
      console.log('WhatsApp: Sem sessão disponível');
      return;
    }

    try {
      console.log('WhatsApp: Carregando dados...');
      
      // Load assistants
      const assistantsResponse = await supabase.functions.invoke('openai-assistants', {
        body: { action: 'list' },
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });

      if (!assistantsResponse.error && assistantsResponse.data?.assistants) {
        setAssistants(assistantsResponse.data.assistants);
      }

      // Load WhatsApp connections
      const connectionsResponse = await supabase.functions.invoke('whatsapp-evolution', {
        body: { action: 'list' },
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });

      if (!connectionsResponse.error && connectionsResponse.data?.connections) {
        setConnections(connectionsResponse.data.connections);
      }
    } catch (error: any) {
      console.error('WhatsApp: Error loading data:', error);
    }
  };

  const createConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceName || !selectedAssistant || !user?.email) return;

    setCreating(true);
    setQrCode(null);

    try {
      const response = await supabase.functions.invoke('whatsapp-evolution', {
        body: {
          action: 'create',
          instanceName: instanceName,
          assistantId: selectedAssistant,
          userEmail: user.email,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar conexão');
      }

      const data = response.data;
      setQrCode(data.qrCode);
      
      toast({
        title: "Conexão criada com sucesso!",
        description: `Instância ${data.instanceName} criada. Escaneie o QR Code para conectar.`,
      });

      // Reset form
      setInstanceName("");
      setSelectedAssistant("");
      
      // Reload connections
      await loadData();

    } catch (error: any) {
      console.error('Error creating connection:', error);
      let errorMessage = error.message;
      
      // Try to extract more detailed error info
      if (error.message === 'Edge Function returned a non-2xx status code') {
        errorMessage = 'Erro na comunicação com a API Evolution. Verifique os logs da função.';
      }
      
      toast({
        title: "Erro ao criar conexão",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteConnection = async (connection: WhatsAppConnection) => {
    try {
      const response = await supabase.functions.invoke('whatsapp-evolution', {
        body: {
          action: 'delete',
          instanceName: connection.nomeinstancia,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao deletar conexão');
      }

      toast({
        title: "Conexão deletada!",
        description: `A instância ${connection.nomeinstancia} foi removida.`,
      });

      await loadData();
    } catch (error: any) {
      console.error('Error deleting connection:', error);
      toast({
        title: "Erro ao deletar conexão",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (connection: WhatsAppConnection) => {
    if (connection.whatsappuser) {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Conectado</Badge>;
    }
    return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Aguardando QR</Badge>;
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
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Smartphone className="h-8 w-8 text-primary" />
                  WhatsApp
                </h1>
                <p className="text-muted-foreground">
                  Conecte suas instâncias WhatsApp aos agentes de IA
                </p>
              </div>
            </div>
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="connections">Gerenciar Conexões</TabsTrigger>
              <TabsTrigger value="create">Nova Conexão</TabsTrigger>
            </TabsList>

            {/* Lista de Conexões */}
            <TabsContent value="connections" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Suas Conexões WhatsApp
                  </CardTitle>
                  <CardDescription>
                    Gerencie suas instâncias WhatsApp conectadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {connections.length === 0 ? (
                    <div className="text-center py-8">
                      <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">Nenhuma conexão WhatsApp encontrada</p>
                      <Button 
                        onClick={() => setActiveTab("create")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar primeira conexão
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {connections.map((connection) => (
                        <Card key={connection.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold">{connection.nomeinstancia}</h3>
                                  {getStatusBadge(connection)}
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Agente:</strong> {assistants.find(a => a.openai_assistant_id === connection.idassistentgpt)?.name || 'Agente não encontrado'}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Email:</strong> {connection.emailuser}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  <strong>Criado em:</strong> {new Date(connection.created_at).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir a conexão "{connection.nomeinstancia}"? 
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => deleteConnection(connection)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Criar Nova Conexão */}
            <TabsContent value="create" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulário */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Nova Conexão WhatsApp
                    </CardTitle>
                    <CardDescription>
                      Crie uma nova instância WhatsApp e conecte a um agente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createConnection} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="instanceName">Nome da Instância</Label>
                        <Input
                          id="instanceName"
                          value={instanceName}
                          onChange={(e) => setInstanceName(e.target.value)}
                          placeholder="Ex: empresa_vendas"
                          required
                          disabled={creating}
                        />
                        <p className="text-xs text-muted-foreground">
                          Nome será: cristina_{instanceName.toLowerCase()}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="assistant">Selecionar Agente</Label>
                        <Select value={selectedAssistant} onValueChange={setSelectedAssistant} disabled={creating}>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha um agente" />
                          </SelectTrigger>
                          <SelectContent>
                            {assistants.length === 0 ? (
                              <div className="p-3 text-center text-muted-foreground">
                                <p className="text-sm">Nenhum agente encontrado</p>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  onClick={() => window.location.href = '/assistants'}
                                  className="text-xs mt-1"
                                >
                                  Criar primeiro agente
                                </Button>
                              </div>
                            ) : (
                              assistants.map((assistant) => (
                                <SelectItem key={assistant.id} value={assistant.openai_assistant_id}>
                                  {assistant.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={creating || !instanceName || !selectedAssistant}
                      >
                        {creating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Criando instância...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Conexão
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* QR Code */}
                {qrCode && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        QR Code WhatsApp
                      </CardTitle>
                      <CardDescription>
                        Escaneie este QR Code no seu WhatsApp para conectar
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="bg-white p-4 rounded-lg inline-block mb-4">
                        <img 
                          src={`data:image/png;base64,${qrCode}`} 
                          alt="QR Code WhatsApp"
                          className="w-64 h-64"
                        />
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">Como conectar:</p>
                        <ol className="text-left space-y-1">
                          <li>1. Abra o WhatsApp no seu celular</li>
                          <li>2. Toque em "Mais opções" ou "Configurações"</li>
                          <li>3. Toque em "Aparelhos conectados"</li>
                          <li>4. Toque em "Conectar um aparelho"</li>
                          <li>5. Aponte a câmera para este QR Code</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default WhatsApp;
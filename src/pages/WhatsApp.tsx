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
  id: string;
  instance_id: string;
  instance_name: string;
  user_id: string;
  status: string;
  phone_number?: string;
  qr_code?: string;
  webhook_url?: string;
  connected_at?: string;
  created_at: string;
  updated_at: string;
  // Legacy fields from n8n_fluxogpt table
  nomeinstancia?: string;
  idassistentgpt?: string;
  emailuser?: string;
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
      console.log('Creating connection with params:', { instanceName, selectedAssistant, userEmail: user.email });
      
      const response = await supabase.functions.invoke('whatsapp-evolution', {
        body: {
          action: 'create',
          instanceName: instanceName,
          assistantId: selectedAssistant,
          userEmail: user.email,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      console.log('Response from whatsapp-evolution:', response);

      if (response.error) {
        console.error('Response error:', response.error);
        throw new Error(response.error.message || 'Erro ao criar conexão');
      }

      const data = response.data;
      console.log('Response data:', data);
      console.log('QR Code data:', data.qrCode);
      
      // Verificar diferentes possíveis formatos do QR Code
      let qrCodeData = null;
      if (data.qrCode) {
        // Se já é uma string base64, usar diretamente
        if (typeof data.qrCode === 'string') {
          qrCodeData = data.qrCode.replace('data:image/png;base64,', '');
        } else if (data.qrCode.base64) {
          qrCodeData = data.qrCode.base64.replace('data:image/png;base64,', '');
        } else if (data.qrCode.code) {
          qrCodeData = data.qrCode.code.replace('data:image/png;base64,', '');
        }
      }

      console.log('Processed QR Code data:', qrCodeData ? 'Found' : 'Not found');
      
      if (qrCodeData) {
        setQrCode(qrCodeData);
        console.log('QR Code set successfully');
      } else {
        console.warn('No QR Code found in response, showing data for debugging:', data);
      }
      
      toast({
        title: "Conexão criada com sucesso!",
        description: `Instância ${data.instanceName} criada.${qrCodeData ? ' Escaneie o QR Code para conectar.' : ' QR Code não disponível.'}`,
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

  const testAPI = async () => {
    try {
      const response = await supabase.functions.invoke('whatsapp-evolution', {
        body: { action: 'test_api' },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      console.log('Test API Response:', response);
      
      if (response.error) {
        throw new Error(response.error.message || 'Erro no teste da API');
      }

      toast({
        title: "Teste da API Evolution",
        description: `Status: ${response.data.status} - ${response.data.success ? 'Sucesso' : 'Falhou'}`,
        variant: response.data.success ? "default" : "destructive",
      });
    } catch (error: any) {
      console.error('Error testing API:', error);
      toast({
        title: "Erro no teste da API",
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
            <div className="flex gap-2">
              <Button onClick={testAPI} variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Testar API
              </Button>
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
            </div>
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
                    <div className="space-y-6">
                      {connections.map((connection, index) => {
                        const isConnected = connection.status === 'open' || connection.whatsappuser;
                        const assistant = assistants.find(a => a.openai_assistant_id === connection.idassistentgpt);
                        
                        return (
                          <div key={connection.id || index} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                  <Smartphone className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {connection.instance_name || connection.nomeinstancia || 'Instância sem nome'}
                                  </h3>
                                  {isConnected ? (
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Conectado
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Desconectado
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" className="h-8 w-8 p-0">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a conexão "{connection.instance_name || connection.nomeinstancia}"? 
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">👤</span>
                                  </div>
                                  <span className="text-green-800 font-medium text-sm">NOME</span>
                                </div>
                                <p className="text-green-900 font-semibold">
                                  {assistant?.name || 'Agente não encontrado'}
                                </p>
                              </div>

                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">📱</span>
                                  </div>
                                  <span className="text-blue-800 font-medium text-sm">NÚMERO</span>
                                </div>
                                <p className="text-blue-900 font-semibold">
                                  {connection.phone_number || connection.whatsappuser || 'Não conectado'}
                                </p>
                              </div>
                            </div>

                            {isConnected && (
                              <div className="bg-green-100 border border-green-200 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                  <span className="text-green-800 font-medium">Agente de IA ativo e pronto para atender</span>
                                </div>
                              </div>
                            )}

                            {!isConnected && (
                              <div className="bg-orange-100 border border-orange-200 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                  <AlertCircle className="w-5 h-5 text-orange-600" />
                                  <span className="text-orange-800 font-medium">Status: Conectando...</span>
                                </div>
                                <div className="bg-orange-200 rounded-full h-2 overflow-hidden">
                                  <div className="bg-orange-500 h-full w-3/4 rounded-full animate-pulse"></div>
                                </div>
                                <p className="text-orange-700 text-sm mt-2">Aguardando scan do QR Code...</p>
                              </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-gray-500 text-sm">
                                Criado em: {new Date(connection.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit', 
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Criar Nova Conexão */}
            <TabsContent value="create" className="space-y-6">
              {!creating && !qrCode && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">💡</span>
                    </div>
                    <span className="text-blue-800 font-medium">Este nome será usado para identificar sua conexão.</span>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Será criado como: <strong>{user?.email?.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_')}_{instanceName.toLowerCase() || 'nome_instancia'}</strong>
                  </p>
                </div>
              )}
              
              {creating && (
                <div className="bg-purple-100 border border-purple-200 rounded-2xl p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                    <span className="text-purple-800 font-semibold text-lg">Criando Conexão...</span>
                  </div>
                </div>
              )}

              {qrCode && (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">QR Code do WhatsApp</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-6">
                    Escaneie este código com seu WhatsApp para conectar
                  </p>
                  
                  <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 inline-block shadow-sm">
                    <img 
                      src={`data:image/png;base64,${qrCode}`} 
                      alt="QR Code WhatsApp"
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                    <div className="flex items-center gap-2 justify-center">
                      <Smartphone className="w-4 h-4" />
                      <span className="text-sm font-medium">Abra o WhatsApp e escaneie o código acima</span>
                    </div>
                  </div>
                </div>
              )}

              {!creating && !qrCode && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-lg">⚡</span>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-900">Como conectar:</h3>
                  </div>
                  
                  <div className="space-y-3 text-blue-800">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                      <span>Clique em <strong>"Gerar QR Code"</strong> abaixo</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                      <span>Abra o <strong>WhatsApp</strong> no seu celular</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                      <span>Vá em <strong>Menu (⋮) → Dispositivos conectados</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</span>
                      <span>Toque em <strong>"Conectar um dispositivo"</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">5</span>
                      <span>Escaneie o QR Code que aparecerá na tela</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">6</span>
                      <span>Aguarde a confirmação da conexão</span>
                    </div>
                  </div>
                </div>
              )}

              {!qrCode && (
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
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3" 
                        disabled={creating || !instanceName || !selectedAssistant}
                      >
                        {creating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Criando instância...
                          </>
                        ) : (
                          <>
                            <QrCode className="h-4 w-4 mr-2" />
                            Gerar QR Code
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default WhatsApp;
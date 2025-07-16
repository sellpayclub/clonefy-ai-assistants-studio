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
import { useNavigate } from "react-router-dom";

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
  threadid?: string;
  whatsappuser?: string;
  message?: string;
  timeout?: string;
  created_at: string;
}

const WhatsApp = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [creating, setCreating] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeTimeout, setQrCodeTimeout] = useState<NodeJS.Timeout | null>(null);
  const [qrTimeLeft, setQrTimeLeft] = useState(0);
  const [qrCountdown, setQrCountdown] = useState<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState("connections");
  
  // Form states
  const [instanceName, setInstanceName] = useState("");
  const [selectedAssistant, setSelectedAssistant] = useState("");
  
  const { toast } = useToast();
  const navigate = useNavigate();

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
                  await loadData();
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
      if (qrCodeTimeout) clearTimeout(qrCodeTimeout);
      if (qrCountdown) clearInterval(qrCountdown);
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
      } else {
        console.warn('No assistants found or error:', assistantsResponse.error);
        setAssistants([]);
      }

      // Load WhatsApp connections
      const connectionsResponse = await supabase.functions.invoke('whatsapp-evolution', {
        body: { action: 'list' },
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });

      if (!connectionsResponse.error && connectionsResponse.data?.connections) {
        setConnections(connectionsResponse.data.connections);
      } else {
        console.warn('No connections found or error:', connectionsResponse.error);
        setConnections([]);
      }
    } catch (error: any) {
      console.error('WhatsApp: Error loading data:', error);
    }
  };

  const createConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar nome da instância
    const instanceNameRegex = /^[a-zA-Z0-9_]+$/;
    if (!instanceNameRegex.test(instanceName)) {
      toast({
        title: "Nome inválido",
        description: "Use apenas letras, números e underscore (_)",
        variant: "destructive",
      });
      return;
    }

    // Verificar se instância já existe
    const existingConnection = connections.find(c => c.nomeinstancia === instanceName);
    if (existingConnection) {
      toast({
        title: "Nome já existe",
        description: "Escolha um nome diferente para a instância",
        variant: "destructive",
      });
      return;
    }
    
    if (!instanceName || !selectedAssistant || !user?.email) return;

    setCreating(true);
    setQrCode(null);
    
    // Limpar timeout anterior se existir
    if (qrCodeTimeout) {
      clearTimeout(qrCodeTimeout);
      setQrCodeTimeout(null);
    }

    // Get current session like in loadData
    let currentSession = session;
    if (!currentSession) {
      const { data } = await supabase.auth.getSession();
      currentSession = data.session;
    }

    if (!currentSession) {
      console.error('Sem sessão válida para criar conexão');
      return;
    }

    try {
      console.log('Creating connection with params:', { instanceName, selectedAssistant, userEmail: user.email });
      
      const response = await supabase.functions.invoke('whatsapp-evolution', {
        body: {
          action: 'create',
          instanceName: instanceName,
          assistantId: selectedAssistant,
          userEmail: user.email,
        },
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });

      console.log('Response from whatsapp-evolution:', response);

      if (response.error) {
        console.error('Response error:', response.error);
        throw new Error(response.error.message || 'Erro ao criar conexão');
      }

      const data = response.data;
      console.log('Response data:', data);
      
      if (!data || !data.success) {
        console.error('Invalid response data:', data);
        throw new Error(data?.error || 'Resposta inválida do servidor');
      }
      
      toast({
        title: "Conexão criada com sucesso!",
        description: `Instância ${data.instanceName} criada.`,
      });

      // Reset form
      setInstanceName("");
      setSelectedAssistant("");
      
      // Reload connections
      await loadData();
      
      // Show QR code if available
      if (data.qrCode) {
        setQrCode(data.qrCode);
        setActiveTab("qr-code");
        
        // QR Code expires in 45 seconds
        setQrTimeLeft(45);
        const timeout = setTimeout(() => {
          setQrCode(null);
          setQrCodeTimeout(null);
          setQrTimeLeft(0);
          if (qrCountdown) clearInterval(qrCountdown);
          setQrCountdown(null);
          toast({
            title: "QR Code expirado",
            description: "Gere um novo QR Code para conectar.",
            variant: "destructive",
          });
        }, 45000);
        setQrCodeTimeout(timeout);
        
        // Start countdown
        const countdown = setInterval(() => {
          setQrTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(countdown);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setQrCountdown(countdown);
        
        toast({
          title: "QR Code disponível",
          description: "Escaneie o código para conectar o WhatsApp. Expira em 45 segundos.",
        });
      }

    } catch (error: any) {
      console.error('Error creating connection:', error);
      toast({
        title: "Erro ao criar conexão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteConnection = async (connection: WhatsAppConnection) => {
    // Get current session
    let currentSession = session;
    if (!currentSession) {
      const { data } = await supabase.auth.getSession();
      currentSession = data.session;
    }

    if (!currentSession) {
      console.error('Sem sessão válida para deletar conexão');
      return;
    }

    try {
      const response = await supabase.functions.invoke('whatsapp-evolution', {
        body: {
          action: 'delete',
          instanceName: connection.nomeinstancia,
        },
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao deletar conexão');
      }

      toast({
        title: "Conexão deletada!",
        description: `A instância foi removida.`,
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

  const refreshQrCode = async (connection: WhatsAppConnection) => {
    // Clear existing timers
    if (qrCodeTimeout) {
      clearTimeout(qrCodeTimeout);
      setQrCodeTimeout(null);
    }
    if (qrCountdown) {
      clearInterval(qrCountdown);
      setQrCountdown(null);
    }
    setQrCode(null);
    setQrTimeLeft(0);
    
    await fetchQrCode(connection);
  };

  const fetchQrCode = async (connection: WhatsAppConnection) => {
    // Get current session
    let currentSession = session;
    if (!currentSession) {
      const { data } = await supabase.auth.getSession();
      currentSession = data.session;
    }

    if (!currentSession) {
      console.error('Sem sessão válida para obter QR code');
      return;
    }

    try {
      console.log('fetchQrCode: Buscando QR code para:', connection.nomeinstancia);
      
      const response = await supabase.functions.invoke('whatsapp-evolution', {
        body: {
          action: 'get_qr',
          instanceName: connection.nomeinstancia,
        },
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });

      console.log('fetchQrCode: Resposta:', response);

      if (response.error) {
        throw new Error(response.error.message || 'Erro na requisição');
      }

      if (!response.data) {
        throw new Error('Nenhum dado retornado');
      }

      const data = response.data;
      
      if (!data.success) {
        throw new Error(data.error || 'Falha ao obter QR code');
      }

      // Conforme especificação: usar campo base64
      if (data.base64) {
        console.log('fetchQrCode: QR code encontrado');
        setQrCode(data.base64);
        setActiveTab("qr-code");
        
        // Limpar timeout anterior se existir
        if (qrCodeTimeout) {
          clearTimeout(qrCodeTimeout);
        }
        
        // QR Code expires in 45 seconds
        setQrTimeLeft(45);
        const timeout = setTimeout(() => {
          setQrCode(null);
          setQrCodeTimeout(null);
          setQrTimeLeft(0);
          if (qrCountdown) clearInterval(qrCountdown);
          setQrCountdown(null);
          toast({
            title: "QR Code expirado",
            description: "Gere um novo QR Code para conectar.",
            variant: "destructive",
          });
        }, 45000);
        setQrCodeTimeout(timeout);
        
        // Start countdown
        const countdown = setInterval(() => {
          setQrTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(countdown);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setQrCountdown(countdown);
        
        toast({
          title: "QR Code gerado",
          description: "Escaneie o código para conectar o WhatsApp. Expira em 45 segundos.",
        });
      } else {
        throw new Error('QR code não encontrado na resposta');
      }

    } catch (error: any) {
      console.error('fetchQrCode: Erro:', error);
      toast({
        title: "Erro ao obter QR Code",
        description: error.message || "Não foi possível obter o QR Code desta instância.",
        variant: "destructive",
      });
    }
  };

  const testAPI = async () => {
    // Get current session
    let currentSession = session;
    if (!currentSession) {
      const { data } = await supabase.auth.getSession();
      currentSession = data.session;
    }

    if (!currentSession) {
      console.error('Sem sessão válida para testar API');
      return;
    }

    try {
      const response = await supabase.functions.invoke('whatsapp-evolution', {
        body: { action: 'test_api' },
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
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

  const checkIndividualStatus = async (connection: WhatsAppConnection) => {
    // Get current session
    let currentSession = session;
    if (!currentSession) {
      const { data } = await supabase.auth.getSession();
      currentSession = data.session;
    }

    if (!currentSession) {
      console.error('Sem sessão válida para verificar status');
      return;
    }

    try {
      console.log('Verificando status individual para:', connection.nomeinstancia);
      
      const response = await supabase.functions.invoke('whatsapp-evolution', {
        body: {
          action: 'check_status',
          instanceName: connection.nomeinstancia,
        },
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });

      console.log('Resposta do check individual:', response);

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao verificar status');
      }

      if (response.data?.success) {
        toast({
          title: "Status atualizado!",
          description: `${connection.nomeinstancia}: ${response.data.isConnected ? `Conectado (${response.data.whatsappUser})` : 'Desconectado'}`,
        });
        
        // Recarregar dados para mostrar mudanças
        await loadData();
      } else {
        throw new Error(response.data?.error || 'Falha na verificação');
      }

    } catch (error: any) {
      console.error('Erro ao verificar status individual:', error);
      toast({
        title: "Erro ao verificar status",
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connections">Gerenciar Conexões</TabsTrigger>
              <TabsTrigger value="create">Nova Conexão</TabsTrigger>
              <TabsTrigger value="qr-code">QR Code</TabsTrigger>
            </TabsList>

            {/* Lista de Conexões */}
            <TabsContent value="connections" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Suas Conexões WhatsApp
                      </CardTitle>
                      <CardDescription>
                        Gerencie suas instâncias WhatsApp conectadas
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={loadData} 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Atualizar Conexões
                    </Button>
                  </div>
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
                        const isConnected = !!connection.whatsappuser;
                        const assistant = assistants.find(a => a.id === connection.idassistentgpt);
                        
                        return (
                          <div key={connection.id || index} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                  <Smartphone className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {connection.nomeinstancia || 'Instância sem nome'}
                                  </h3>
                                  {isConnected ? (
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Conectado ({connection.whatsappuser})
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Aguardando QR Code
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                {!isConnected && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-8 border-green-300 text-green-700 hover:bg-green-50"
                                      onClick={() => fetchQrCode(connection)}
                                    >
                                      <QrCode className="h-4 w-4 mr-1" />
                                      QR Code
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-8 border-blue-300 text-blue-700 hover:bg-blue-50"
                                      onClick={() => checkIndividualStatus(connection)}
                                    >
                                      <RefreshCw className="h-4 w-4 mr-1" />
                                      Verificar Status
                                    </Button>
                                  </>
                                )}
                                {isConnected && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 border-blue-300 text-blue-700 hover:bg-blue-50"
                                    onClick={() => checkIndividualStatus(connection)}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Verificar Status
                                  </Button>
                                )}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-8 border-red-300 text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Deletar
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Deletar Conexão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja deletar esta conexão WhatsApp? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => deleteConnection(connection)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Deletar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Assistente:</span> {assistant?.name || 'Não encontrado'}
                              </div>
                              <div>
                                <span className="font-medium">Status:</span> {isConnected ? 'Conectado' : 'Desconectado'}
                              </div>
                              <div>
                                <span className="font-medium">Email:</span> {connection.emailuser || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Criado em:</span> {new Date(connection.created_at).toLocaleDateString('pt-BR')}
                              </div>
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
            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Criar Nova Conexão WhatsApp
                  </CardTitle>
                  <CardDescription>
                    Configure uma nova instância WhatsApp e conecte a um assistente de IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createConnection} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="instanceName">Nome da Instância</Label>
                      <Input
                        id="instanceName"
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                        placeholder="Ex: atendimento_loja"
                        required
                        disabled={creating}
                      />
                      <p className="text-sm text-muted-foreground">
                        Use apenas letras, números e underscore (_)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assistant">Assistente de IA</Label>
                      <Select 
                        value={selectedAssistant} 
                        onValueChange={setSelectedAssistant}
                        disabled={creating}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um assistente" />
                        </SelectTrigger>
                        <SelectContent>
                          {assistants.map((assistant) => (
                            <SelectItem key={assistant.id} value={assistant.id}>
                              {assistant.name}
                              {assistant.description && (
                                <span className="text-muted-foreground ml-2">
                                  - {assistant.description}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {assistants.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Nenhum assistente encontrado. Crie um assistente primeiro.
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={creating || !instanceName || !selectedAssistant}
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando conexão...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Conexão WhatsApp
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* QR Code Tab */}
            <TabsContent value="qr-code" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    QR Code do WhatsApp
                  </CardTitle>
                  <CardDescription>
                    Escaneie este código QR com seu WhatsApp para conectar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {qrCode ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                        <img 
                          src={qrCode}
                          alt="QR Code do WhatsApp" 
                          className="w-64 h-64 object-contain"
                        />
                      </div>
                      
                      {/* Timer progressivo e botão de atualizar */}
                      <div className="flex flex-col items-center gap-4">
                        {qrTimeLeft > 0 ? (
                          <div className="flex flex-col items-center gap-3">
                            {/* Progress bar */}
                            <div className="w-64 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${(qrTimeLeft / 45) * 100}%` }}
                              ></div>
                            </div>
                            {/* Timer display */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-lg">
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                              <span className="font-medium text-lg">Expira em {qrTimeLeft}s</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">QR Code expirado</span>
                          </div>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const lastConnection = connections.find(c => !c.whatsappuser);
                            if (lastConnection) refreshQrCode(lastConnection);
                          }}
                          className="flex items-center gap-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Atualizar QR Code
                        </Button>
                      </div>
                      
                      <div className="text-center space-y-2">
                        <p className="font-medium text-gray-900">
                          Como conectar:
                        </p>
                        <ol className="text-sm text-gray-600 text-left space-y-1">
                          <li>1. Abra o WhatsApp no seu celular</li>
                          <li>2. Toque nos três pontos (⋮) e selecione "Aparelhos conectados"</li>
                          <li>3. Toque em "Conectar um aparelho"</li>
                          <li>4. Aponte a câmera para este QR Code</li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Nenhum QR Code disponível
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Clique em "QR Code" em uma conexão desconectada para gerar o código
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default WhatsApp;
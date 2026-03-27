import { useState, useEffect, memo, useCallback, useMemo } from "react";
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
import { Smartphone, QrCode, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle, Loader2, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useUserLimits } from "@/hooks/useUserLimits";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { performanceCache, requestCache } from '@/utils/performance';

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
  IDvoz?: string;
  ApiELEVEN?: string;
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
  
  // ElevenLabs states (optional)
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState("");
  const [voiceId, setVoiceId] = useState("");
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { limits, reloadLimits } = useUserLimits();

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
                  await loadData(true); // Force refresh on auth change
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

  // Otimizar loadData com cache e requisições paralelas + request cache
  const loadData = useCallback(async (forceRefresh = false) => {
    const requestKey = 'whatsapp-loaddata';
    
    return requestCache.getOrExecute(requestKey, async () => {
      let currentSession = session;
      if (!currentSession) {
        const { data } = await supabase.auth.getSession();
        currentSession = data.session;
      }

      if (!currentSession) {
        return;
      }

      const userId = currentSession.user.id;
      const assistantsCacheKey = `assistants_${userId}`;
      const connectionsCacheKey = `whatsapp_connections_${userId}`;

      try {
        // Verificar cache primeiro (só se não for refresh forçado)
        let assistantsData, connectionsData;
        
        if (!forceRefresh) {
          assistantsData = performanceCache.get(assistantsCacheKey);
          connectionsData = performanceCache.get(connectionsCacheKey);
        }

        // Se ambos estão em cache, retornar rapidamente
        if (assistantsData && connectionsData) {
          setAssistants(assistantsData);
          setConnections(connectionsData);
          return;
        }

        // Se algum dos dados não estiver em cache, carregar em paralelo
        const promises = [];
        
        if (!assistantsData) {
          promises.push(
            supabase.functions.invoke('openai-assistants', {
              body: { action: 'list' },
              headers: { Authorization: `Bearer ${currentSession.access_token}` },
            }).then(response => ({ type: 'assistants', response }))
          );
        }

        if (!connectionsData) {
          promises.push(
            supabase.functions.invoke('whatsapp-evolution', {
              body: { action: 'list' },
              headers: { Authorization: `Bearer ${currentSession.access_token}` },
            }).then(response => ({ type: 'connections', response }))
          );
        }

        // Executar todas as chamadas em paralelo
        if (promises.length > 0) {
          const results = await Promise.all(promises);
          
          results.forEach(({ type, response }) => {
            if (type === 'assistants') {
              if (!response.error && response.data?.assistants) {
                assistantsData = response.data.assistants;
        // Cache assistentes por 15 minutos, conexões por 10 minutos
        performanceCache.set(assistantsCacheKey, assistantsData, 15);
        performanceCache.set(connectionsCacheKey, connectionsData, 10);
              } else {
                console.warn('No assistants found or error:', response.error);
                assistantsData = assistantsData || [];
              }
            } else if (type === 'connections') {
              if (!response.error && response.data?.connections) {
                connectionsData = response.data.connections;
                performanceCache.set(connectionsCacheKey, connectionsData, 5); // Cache por 5 minutos
              } else {
                console.warn('No connections found or error:', response.error);
                connectionsData = connectionsData || [];
              }
            }
          });
        }

        // Garantir que temos dados válidos
        assistantsData = assistantsData || [];
        connectionsData = connectionsData || [];

        setAssistants(assistantsData);
        setConnections(connectionsData);
      } catch (error: any) {
        console.error('WhatsApp: Error loading data:', error);
        // Em caso de erro, garantir que os estados não fiquem undefined
        setAssistants([]);
        setConnections([]);
      }
    });
  }, [session]);

  const createConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user can create more WhatsApp connections
    if (limits && !limits.can_create_whatsapp_connection) {
      toast({
        title: "Limite atingido",
        description: `Você já criou ${limits.current_whatsapp_connections}/${limits.max_whatsapp_connections} conexão(s). Faça upgrade para criar mais!`,
        variant: "destructive",
      });
      return;
    }
    
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
          // ElevenLabs optional fields
          elevenLabsApiKey: elevenLabsApiKey.trim() || null,
          voiceId: voiceId.trim() || null,
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
      setElevenLabsApiKey("");
      setVoiceId("");
      
      // Invalidar cache e reload connections
      if (user) {
        performanceCache.invalidate(`whatsapp_connections_${user.id}`);
      }
      await loadData(true); // Force refresh
      await reloadLimits(); // Reload limits after creating
      
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

      // Invalidar cache e reload
      if (user) {
        performanceCache.invalidate(`whatsapp_connections_${user.id}`);
      }
      await loadData(true); // Force refresh
      await reloadLimits(); // Reload limits after deleting
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


  // Update voice settings for existing connection
  const updateVoiceSettings = useCallback(async (connection: WhatsAppConnection, voiceId: string | null, apiKey: string | null) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-evolution', {
        body: {
          action: 'update_voice',
          instance_name: connection.nomeinstancia,
          voice_id: voiceId,
          api_key: apiKey
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Sucesso!",
          description: "Configurações de voz atualizadas com sucesso!",
        });
        loadData(true); // Refresh data
      } else {
        throw new Error(data?.error || 'Erro ao atualizar configurações de voz');
      }
    } catch (error) {
      console.error('Error updating voice settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações de voz: " + (error as Error).message,
        variant: "destructive",
      });
    }
  }, [user, loadData]);

  // Memoized handlers for performance
  const handleRefreshData = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const handleCheckStatus = useCallback((connection: WhatsAppConnection) => {
    checkIndividualStatus(connection);
  }, []);

  const handleFetchQrCode = useCallback((connection: WhatsAppConnection) => {
    fetchQrCode(connection);
  }, []);

  const handleDeleteConnection = useCallback((connection: WhatsAppConnection) => {
    deleteConnection(connection);
  }, []);

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
      <main className="flex-1 p-4 md:p-6">
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Smartphone className="h-6 md:h-8 w-6 md:w-8 text-primary" />
                  WhatsApp
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Conecte suas instâncias WhatsApp aos agentes de IA
                </p>
                {limits && (
                  <div className="text-xs md:text-sm text-muted-foreground mt-1">
                    <span className={limits.can_create_whatsapp_connection ? "text-green-600" : "text-red-600"}>
                      {limits.current_whatsapp_connections}/{limits.max_whatsapp_connections} conexões utilizadas
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleRefreshData} variant="outline" size="sm" className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Banner de upgrade se limite atingido */}
          {limits && !limits.can_create_whatsapp_connection && (
            <div className="mb-6">
              <UpgradeBanner 
                type="connections" 
                currentCount={limits.current_whatsapp_connections}
                maxCount={limits.max_whatsapp_connections}
              />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto md:h-10">
              <TabsTrigger value="connections" className="text-xs md:text-sm">Gerenciar Conexões</TabsTrigger>
              <TabsTrigger value="create" className="text-xs md:text-sm">Nova Conexão</TabsTrigger>
              <TabsTrigger value="qr-code" className="text-xs md:text-sm">QR Code</TabsTrigger>
            </TabsList>

            {/* Lista de Conexões */}
            <TabsContent value="connections" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                        <Smartphone className="h-4 w-4 md:h-5 md:w-5" />
                        Suas Conexões WhatsApp
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Gerencie suas instâncias WhatsApp conectadas
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={handleRefreshData} 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2 w-full md:w-auto"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="md:inline">Atualizar Conexões</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {connections.length === 0 ? (
                    <div className="text-center py-8">
                      <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4 text-sm md:text-base">Nenhuma conexão WhatsApp encontrada</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button 
                        onClick={() => {
                          if (limits && !limits.can_create_whatsapp_connection) {
                            toast({
                              title: "Limite atingido",
                              description: `Você já criou ${limits.max_whatsapp_connections} conexão(s). Para criar mais, solicite um aumento de limite.`,
                              variant: "destructive",
                            });
                            return;
                          }
                          setActiveTab("create");
                        }}
                        disabled={limits && !limits.can_create_whatsapp_connection}
                        className="w-full sm:w-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar primeira conexão
                      </Button>
                      {limits && !limits.can_create_whatsapp_connection && (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            toast({
                              title: "Solicitar mais conexões",
                              description: "Entre em contato para solicitar mais conexões WhatsApp.",
                            });
                          }}
                          className="w-full sm:w-auto"
                        >
                          Solicitar Mais
                        </Button>
                      )}
                    </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {connections.map((connection, index) => {
                        const isConnected = !!connection.whatsappuser;
                        // Find assistant using OpenAI assistant ID (correct way)
                        const assistant = assistants.find(a => a.openai_assistant_id === connection.idassistentgpt);
                        
                        // Parse profile data from message field
                        let profileData = null;
                        try {
                          if (connection.message) {
                            profileData = JSON.parse(connection.message);
                          }
                        } catch (e) {
                          // Ignore parsing errors
                        }

                        return (
                          <div key={connection.id || index} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                                  <Smartphone className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                                    {connection.nomeinstancia || 'Instância sem nome'}
                                  </h3>
                                  {isConnected ? (
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Conectado
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
                            
                            {/* WhatsApp Profile Section */}
                            {isConnected && profileData && (
                              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                <div className="flex items-center gap-4">
                                  {profileData.profilePicUrl ? (
                                    <img 
                                      src={profileData.profilePicUrl} 
                                      alt="Profile"
                                      className="w-16 h-16 rounded-full border-2 border-green-300 shadow-sm"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                      {profileData.profileName ? profileData.profileName.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-green-900 mb-1">
                                      {profileData.profileName || connection.whatsappuser}
                                    </h4>
                                    {profileData.phoneNumber && (
                                      <p className="text-green-700 font-medium">
                                        📱 {profileData.phoneNumber}
                                      </p>
                                    )}
                                    <p className="text-green-600 text-sm mt-1">
                                      ✅ WhatsApp Conectado
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Connection Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
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
                              {connection.IDvoz && (
                                <div>
                                  <span className="font-medium">Voz ElevenLabs:</span> {connection.IDvoz}
                                </div>
                              )}
                              {connection.ApiELEVEN && (
                                <div>
                                  <span className="font-medium">ElevenLabs API:</span> ****{connection.ApiELEVEN.slice(-4)}
                                </div>
                              )}
                            </div>

                            {/* Group AI Toggle */}
                            {isConnected && (
                              <div className="mt-4 p-4 border rounded-lg bg-blue-50 border-blue-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                      <Users className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-blue-900">IA responde em grupos</h4>
                                      <p className="text-xs text-blue-600">Ativar para a IA responder mensagens em grupos WhatsApp</p>
                                    </div>
                                  </div>
                                  <Switch
                                    defaultChecked={false}
                                    onCheckedChange={async (checked) => {
                                      try {
                                        const { data, error } = await supabase.functions.invoke('group-connection', {
                                          body: {
                                            action: 'configure_webhook',
                                            user_id: user?.id,
                                            instanceName: connection.nomeinstancia,
                                            enabled: checked,
                                          },
                                        });
                                        if (error) throw error;
                                        toast({
                                          title: checked ? "Grupos ativados!" : "Grupos desativados!",
                                          description: checked
                                            ? "A IA agora responde em grupos WhatsApp."
                                            : "A IA não responderá mais em grupos.",
                                        });
                                      } catch (err: any) {
                                        console.error('Erro ao configurar grupos:', err);
                                        toast({
                                          title: "Erro",
                                          description: err.message || "Não foi possível alterar configuração de grupos.",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* ElevenLabs Voice Settings Update */}
                              <div className="mt-4 p-4 border rounded-lg bg-primary/5 border-primary/20">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                  <span className="text-primary-foreground text-xs">🎙️</span>
                                </div>
                                <h4 className="font-medium text-foreground">Configurações de Voz ElevenLabs</h4>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`voice-id-${connection.id}`} className="text-sm text-foreground">Voice ID</Label>
                                  <Input
                                    id={`voice-id-${connection.id}`}
                                    placeholder="Ex: 9BWtsMINqrJLrRacOk9x"
                                    defaultValue={connection.IDvoz || ''}
                                    className="mt-1 border-primary/20 focus:border-primary/40"
                                    onBlur={(e) => updateVoiceSettings(connection, e.target.value, null)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`api-key-${connection.id}`} className="text-sm text-foreground">API Key</Label>
                                  <Input
                                    id={`api-key-${connection.id}`}
                                    type="password"
                                    placeholder="sk_..."
                                    defaultValue={connection.ApiELEVEN || ''}
                                    className="mt-1 border-primary/20 focus:border-primary/40"
                                    onBlur={(e) => updateVoiceSettings(connection, null, e.target.value)}
                                  />
                                </div>
                              </div>
                              
                              <p className="text-xs text-muted-foreground mt-2">
                                Deixe vazio para desativar a voz. As alterações são salvas automaticamente.
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

                    {/* ElevenLabs Voice Integration - Optional */}
                    <div className="space-y-4 p-4 border rounded-lg bg-primary/5 border-primary/20">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-xs font-bold">🎙️</span>
                        </div>
                        <h3 className="font-semibold text-foreground">ElevenLabs - Voz para IA (Opcional)</h3>
                      </div>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Adicione voz natural às respostas da sua IA! Seus clientes poderão ouvir as respostas em áudio.
                        <br />
                        <strong>Como obter:</strong> Acesse <a href="https://elevenlabs.io" target="_blank" className="underline">elevenlabs.io</a> → 
                        Crie conta → Copie sua API Key e escolha uma voz.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="elevenLabsApiKey" className="text-foreground">
                            API Key do ElevenLabs
                          </Label>
                          <Input
                            id="elevenLabsApiKey"
                            value={elevenLabsApiKey}
                            onChange={(e) => setElevenLabsApiKey(e.target.value)}
                            placeholder="sk-..."
                            disabled={creating}
                            className="border-primary/20 focus:border-primary/40"
                          />
                          <p className="text-xs text-muted-foreground">
                            Encontre em: Settings → API Keys
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="voiceId" className="text-foreground">
                            ID da Voz
                          </Label>
                          <Input
                            id="voiceId"
                            value={voiceId}
                            onChange={(e) => setVoiceId(e.target.value)}
                            placeholder="Ex: 9BWtsMINqrJLrRacOk9x"
                            disabled={creating}
                            className="border-primary/20 focus:border-primary/40"
                          />
                          <p className="text-xs text-muted-foreground">
                            Encontre em: Voice Lab → Escolha uma voz → Copie ID
                          </p>
                        </div>
                      </div>

                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          💡 <strong>Dica:</strong> Vozes populares - Aria: <code className="bg-white px-1 rounded">9BWtsMINqrJLrRacOk9x</code>, 
                          Sarah: <code className="bg-white px-1 rounded">EXAVITQu4vr4xnSDxMaL</code>, 
                          Charlie: <code className="bg-white px-1 rounded">IKne3meq5aSn9XLyUdCD</code>
                        </p>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={creating || !instanceName || !selectedAssistant || (limits && !limits.can_create_whatsapp_connection)}
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
                          (() => {
                            // Verificar se existe alguma conexão conectada antes de mostrar o aviso de expiração
                            const lastConnection = connections.find(c => !c.whatsappuser);
                            const isConnectionConnected = lastConnection ? !!lastConnection.whatsappuser : false;
                            
                            // Só mostrar aviso de expiração se a conexão NÃO estiver conectada
                            return !isConnectionConnected ? (
                              <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-medium">QR Code expirado</span>
                              </div>
                            ) : null;
                          })()
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
  );
};

export default WhatsApp;
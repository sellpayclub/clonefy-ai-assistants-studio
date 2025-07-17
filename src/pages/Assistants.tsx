import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Edit, Trash2, MessageSquare, Settings, RefreshCw, Code, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useUserLimits } from "@/hooks/useUserLimits";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AgentTutorial from "@/components/AgentTutorial";
import { AssistantMediaUpload } from "@/components/AssistantMediaUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import SupportChatWidget from "@/components/SupportChatWidget";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { AssistantTemplates } from "@/components/AssistantTemplates";
import { OptimizedAssistantCard } from "@/components/OptimizedAssistantCard";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";

interface Assistant {
  id: string;
  name: string;
  description: string;
  instructions: string;
  model: string;
  openai_assistant_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Assistants = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { limits, reloadLimits } = useUserLimits();
  const { t } = useLanguage();
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [selectedAgentForEmbed, setSelectedAgentForEmbed] = useState<Assistant | null>(null);
  const [activeTab, setActiveTab] = useState("assistants");

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [model] = useState("gpt-4o"); // Always use GPT-4o for now

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
              navigate('/auth');
              return;
            }

            // Carregar dados sempre que a sessão mudar
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              setTimeout(async () => {
                if (isMounted) {
                  await loadAssistants();
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
          navigate('/auth');
          return;
        }
        
        // Carregar dados iniciais
        await loadAssistants();
        setLoading(false);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erro na inicialização:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []); // Array vazio - só executa uma vez

  // Check for onboarding trigger
  useEffect(() => {
    const shouldTrigger = localStorage.getItem("trigger-create-agent");
    if (shouldTrigger && assistants.length === 0) {
      localStorage.removeItem("trigger-create-agent");
      setTimeout(() => {
        openCreateDialog();
      }, 500);
    }
  }, [assistants]);


  const loadAssistants = async () => {
    // Aguarda a sessão estar disponível
    let currentSession = session;
    if (!currentSession) {
      const { data } = await supabase.auth.getSession();
      currentSession = data.session;
    }

    if (!currentSession) {
      return;
    }

    try {
      const response = await supabase.functions.invoke('openai-assistants', {
        body: { action: 'list' },
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const assistantsList = response.data?.assistants || [];
      
      setAssistants(assistantsList);
    } catch (error: any) {
      console.error('Error loading assistants:', error);
      toast({
        title: "Erro ao carregar agentes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setInstructions("");
    setEditingAssistant(null);
  };

  const openCreateDialog = () => {
    // Check if user can create more assistants
    if (limits && !limits.can_create_assistant) {
      toast({
        title: "Limite atingido",
        description: `Você já criou ${limits.max_assistants} agente(s). Para criar mais, solicite um aumento de limite.`,
        variant: "destructive",
      });
      return;
    }
    
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditDialog = (assistant: Assistant) => {
    setName(assistant.name);
    setDescription(assistant.description || "");
    setInstructions(assistant.instructions || "");
    setEditingAssistant(assistant);
    setIsCreateOpen(true);
  };

  const handleSelectTemplate = (template: any) => {
    setName(template.name);
    setDescription(template.description);
    setInstructions(template.instructions);
    setActiveTab("assistants");
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    setFormLoading(true);

    try {
      const action = editingAssistant ? 'update' : 'create';
      const body = editingAssistant 
        ? { action, assistantId: editingAssistant.id, name, description, instructions, model: "gpt-4o" }
        : { action, name, description, instructions, model: "gpt-4o" };

      const response = await supabase.functions.invoke('openai-assistants', {
        body,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: editingAssistant ? "Agente atualizado!" : "Agente criado!",
        description: editingAssistant 
          ? "As alterações foram salvas com sucesso." 
          : "Seu novo agente está pronto para uso.",
      });

      setIsCreateOpen(false);
      resetForm();
      await loadAssistants(); // Aguarda o reload
      await reloadLimits(); // Reload limits after creating
    } catch (error: any) {
      console.error('Error saving assistant:', error);
      toast({
        title: "Erro ao salvar agente",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (assistant: Assistant) => {
    if (!session) return;
    
    if (!confirm(`Tem certeza que deseja excluir o agente "${assistant.name}"?`)) {
      return;
    }

    try {
      const response = await supabase.functions.invoke('openai-assistants', {
        body: { action: 'delete', assistantId: assistant.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Agente excluído!",
        description: "O agente foi removido com sucesso.",
      });

      await loadAssistants(); // Aguarda o reload
      await reloadLimits(); // Reload limits after deleting
    } catch (error: any) {
      console.error('Error deleting assistant:', error);
      toast({
        title: "Erro ao excluir agente",
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
        
        <main className="flex-1 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Bot className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />
                  {t("sidebar.agents.title")}
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                  {t("sidebar.agents.description")}
                </p>
                {limits && (
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    <span className={limits.can_create_assistant ? "text-green-600" : "text-red-600"}>
                      {limits.current_assistants}/{limits.max_assistants} {t("assistants.used")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={loadAssistants} variant="outline" size="sm" className="w-full sm:w-auto text-sm">
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Recarregar
              </Button>
              <Button 
                onClick={openCreateDialog}
                disabled={limits && !limits.can_create_assistant}
                className="w-full sm:w-auto text-sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Novo Agente
              </Button>
              {limits && !limits.can_create_assistant && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    toast({
                      title: "Solicitar mais agentes",
                      description: "Entre em contato para solicitar mais agentes.",
                    });
                  }}
                  className="w-full sm:w-auto"
                >
                  Solicitar Mais
                </Button>
              )}
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assistants">Meus Agentes</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="assistants" className="space-y-6">
              {/* Assistants Grid */}
              {assistants.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nenhum agente criado</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie seu primeiro agente para começar a automatizar conversas
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={openCreateDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Agente
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab("templates")}>
                      Ver Templates
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                  {assistants.map((assistant) => (
                    <OptimizedAssistantCard
                      key={assistant.id}
                      assistant={assistant}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                      onTest={(assistant) => {
                        // Salva o assistente no localStorage para seleção automática
                        localStorage.setItem('selectedAssistantId', assistant.id);
                        localStorage.setItem('selectedAssistantName', assistant.name);
                        localStorage.setItem('autoStartConversation', 'true');
                        navigate('/conversations');
                      }}
                      onEmbed={(assistant) => {
                        setSelectedAgentForEmbed(assistant);
                        setEmbedDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <AssistantTemplates onSelectTemplate={handleSelectTemplate} />
            </TabsContent>
          </Tabs>

          {/* Tutorial Section */}
          <div className="mt-8">
            <AgentTutorial />
          </div>

          {/* Create/Edit Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAssistant ? "Editar Agente" : "Criar Novo Agente"}
                </DialogTitle>
                <DialogDescription>
                  {editingAssistant 
                    ? "Modifique as configurações do seu agente e gerencie arquivos" 
                    : "Configure seu agente de IA personalizado"
                  }
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="config" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="config">Configurações</TabsTrigger>
                  <TabsTrigger value="files" disabled={!editingAssistant}>
                    Arquivos
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="config" className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Agente</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Agente Virtual"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição (Opcional)</Label>
                      <Input
                        id="description"
                        placeholder="Breve descrição do agente"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instruções</Label>
                      <Textarea
                        id="instructions"
                        placeholder="Descreva como o agente deve se comportar, seu tom de voz, conhecimentos específicos..."
                        rows={6}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Seja específico sobre como o agente deve responder e se comportar.
                      </p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={formLoading}>
                        {formLoading ? "Salvando..." : editingAssistant ? "Salvar Alterações" : "Criar Agente"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="files" className="space-y-4">
                  {editingAssistant && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        Arquivos do Agente
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adicione imagens, vídeos e documentos que a IA poderá enviar automaticamente nas conversas do WhatsApp.
                      </p>
                      <AssistantMediaUpload 
                        assistantId={editingAssistant.id}
                        onUploadComplete={() => {
                          // Recarregar assistentes para atualizar instruções
                          loadAssistants();
                        }}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          {/* Embed Dialog */}
          <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Code className="h-5 w-5" />
                  CHAT FLUTUANTE
                </DialogTitle>
                <DialogDescription>
                  Incorpore este agente em qualquer site como um chat flutuante de suporte
                </DialogDescription>
              </DialogHeader>
              
              {selectedAgentForEmbed && (
                <div className="space-y-6">
                  {/* Preview */}
                  <div>
                    <Label className="text-sm font-medium">Visualização</Label>
                    <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{selectedAgentForEmbed.name}</p>
                          <p className="text-xs text-muted-foreground">Widget de chat embarcável</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Este chat aparecerá como um botão flutuante azul no site do usuário
                      </p>
                      
                      {/* Preview Demo */}
                      <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            💡 Demonstração
                          </span>
                          <a 
                            href={`/embed/chat/${selectedAgentForEmbed.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 underline"
                          >
                            Testar agora →
                          </a>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Clique em "Testar agora" para ver como ficará para seus visitantes
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Código HTML */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Código de Incorporação</Label>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // Usar domínio customizado se disponível
                          const baseUrl = window.location.hostname.includes('lovableproject.com') 
                            ? window.location.origin 
                            : window.location.origin; // Aqui você pode colocar seu domínio customizado
                          
                          const code = `<!-- Chat Flutuante CLONEFY -->
<script>
  (function(){
    var w=window,d=document;
    var chatWidget = {
      agentId: '${selectedAgentForEmbed.id}',
      agentName: '${selectedAgentForEmbed.name}',
      baseUrl: '${baseUrl}',
      init: function() {
        var iframe = d.createElement('iframe');
        iframe.src = this.baseUrl + '/embed/chat/' + this.agentId;
        iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:999999;display:none;';
        iframe.id = 'clonefy-chat-widget';
        
        // Responsivo para mobile
        if(window.innerWidth <= 768) {
          iframe.style.cssText = 'position:fixed;bottom:10px;left:10px;right:10px;top:80px;width:auto;height:auto;border:none;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:999999;display:none;';
        }
        
        d.body.appendChild(iframe);
        
        var button = d.createElement('div');
        button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        button.style.cssText = 'position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#007bff,#0056b3);color:white;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,123,255,0.3);z-index:999998;transition:all 0.3s ease;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;';
        button.title = 'Chat com ' + this.agentName;
        button.id = 'clonefy-chat-button';
        
        button.onmouseover = function() { this.style.transform = 'scale(1.1)'; };
        button.onmouseout = function() { this.style.transform = 'scale(1)'; };
        
        var isOpen = false;
        button.onclick = function() {
          isOpen = !isOpen;
          iframe.style.display = isOpen ? 'block' : 'none';
          button.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
        };
        
        // Responsividade
        window.addEventListener('resize', function() {
          if(window.innerWidth <= 768 && isOpen) {
            iframe.style.cssText = 'position:fixed;bottom:10px;left:10px;right:10px;top:80px;width:auto;height:auto;border:none;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:999999;display:block;';
          } else if(isOpen) {
            iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:999999;display:block;';
          }
        });
        
        d.body.appendChild(button);
      }
    };
    
    if(d.readyState === 'loading') {
      d.addEventListener('DOMContentLoaded', function() { chatWidget.init(); });
    } else {
      chatWidget.init();
    }
  })();
</script>
<!-- Fim Chat Flutuante CLONEFY -->`;
                          
                          navigator.clipboard.writeText(code);
                          toast({
                            title: "Código copiado!",
                            description: "Cole este código antes da tag </body> do seu site.",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar Código
                      </Button>
                    </div>
                    <div className="p-4 bg-muted rounded-lg overflow-auto">
                      <code className="text-xs text-muted-foreground break-all whitespace-pre-wrap">
                        {`<!-- Chat Flutuante CLONEFY -->
<script>
  (function(){
    var chatWidget = {
      agentId: '${selectedAgentForEmbed.id}',
      agentName: '${selectedAgentForEmbed.name}',
      baseUrl: '${window.location.origin}',
      // Código do chat flutuante...
    };
    // Inicialização automática...
  })();
</script>`}
                      </code>
                    </div>
                  </div>

                  {/* Instruções melhoradas */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      📋 Como usar o Chat Flutuante:
                    </h4>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">1</div>
                        <div className="text-sm">
                          <strong>Copie o código</strong> clicando no botão "Copiar Código"
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">2</div>
                        <div className="text-sm">
                          <strong>Cole no seu site</strong> antes da tag <code className="bg-white dark:bg-gray-800 px-1 rounded">&lt;/body&gt;</code>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">3</div>
                        <div className="text-sm">
                          <strong>Aparecerá um botão azul</strong> flutuante no canto inferior direito
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">✓</div>
                        <div className="text-sm">
                          <strong>Visitantes clicam e conversam</strong> com sua IA automaticamente!
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Link direto responsivo */}
                  <div>
                    <Label className="text-sm font-medium">Link Direto do Chat (Responsivo)</Label>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <Input 
                        value={`${window.location.origin}/embed/chat/${selectedAgentForEmbed.id}`}
                        readOnly
                        className="flex-1 text-xs sm:text-sm"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          const url = `${window.location.origin}/embed/chat/${selectedAgentForEmbed.id}`;
                          navigator.clipboard.writeText(url);
                          toast({
                            title: "Link copiado!",
                            description: "Compartilhe este link para acesso direto ao chat.",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar Link
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <p className="text-xs text-muted-foreground flex-1">
                        Link direto para teste ou compartilhamento - totalmente responsivo
                      </p>
                      <a 
                        href={`/embed/chat/${selectedAgentForEmbed.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        Abrir chat em nova aba →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
        
        {/* Support Chat Widget for internal system */}
        <SupportChatWidget />
        <OnboardingGuide />
      </div>
    </SidebarProvider>
  );
};

export default memo(Assistants);
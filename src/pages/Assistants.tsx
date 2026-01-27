import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Edit, Trash2, MessageSquare, Settings, RefreshCw, Code, Copy, Expand } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useUserLimits } from "@/hooks/useUserLimits";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import AgentTutorial from "@/components/AgentTutorial";
import { AssistantMediaUpload } from "@/components/AssistantMediaUpload";
import { AssistantKnowledgeUpload } from "@/components/AssistantKnowledgeUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { AssistantTemplates } from "@/components/AssistantTemplates";
import { OptimizedAssistantCard } from "@/components/OptimizedAssistantCard";
import { useOptimizedAssistants } from "@/hooks/useOptimizedAssistants";

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
  tools?: any[];
}

const Assistants = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { limits, reloadLimits } = useUserLimits();
  const { assistants, loading: assistantsLoading, reloadAssistants } = useOptimizedAssistants(session);
  const { t } = useLanguage();
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [selectedAgentForEmbed, setSelectedAgentForEmbed] = useState<Assistant | null>(null);
  const [activeTab, setActiveTab] = useState("assistants");

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [model] = useState("gpt-4o"); // Always use GPT-4o for now
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [agentRole, setAgentRole] = useState<string>("atendente/suporte");
  const [customRole, setCustomRole] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [knowledgeUrls, setKnowledgeUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");

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
  }, [navigate]);

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



  const resetForm = () => {
    setName("");
    setDescription("");
    setInstructions("");
    setEditingAssistant(null);
    setAgentRole("atendente/suporte");
    setCustomRole("");
    setPendingFiles([]);
    setKnowledgeUrls([]);
    setNewUrl("");
  };

  const openCreateDialog = () => {
    // Check if user can create more assistants
    if (limits && !limits.can_create_assistant) {
      toast({
        title: "Limite atingido",
        description: `Você já criou ${limits.current_assistants}/${limits.max_assistants} agente(s). Faça upgrade para criar mais!`,
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

  // Função para construir instruções com função do agente
  const buildInstructionsWithRole = () => {
    let roleText = "";
    if (agentRole === "custom" && customRole.trim()) {
      roleText = customRole.trim();
    } else {
      const roleMap: { [key: string]: string } = {
        "atendente/suporte": "Você é um atendente/suporte especializado em ajudar clientes com dúvidas, problemas e solicitações. Seu objetivo é fornecer suporte excepcional, resolver problemas rapidamente e garantir a satisfação do cliente.",
        "vendedor/closer": "Você é um vendedor/closer especializado em identificar necessidades, apresentar soluções e fechar vendas. Seu objetivo é entender o cliente, apresentar o valor da solução e conduzir o processo de compra de forma natural e consultiva.",
        "sdr/qualificador": "Você é um SDR (Sales Development Representative)/qualificador especializado em identificar leads qualificados, fazer perguntas estratégicas e qualificar oportunidades. Seu objetivo é entender o perfil do cliente, suas necessidades e determinar se há fit para uma conversa comercial."
      };
      roleText = roleMap[agentRole] || roleMap["atendente/suporte"];
    }
    
    return `${roleText}\n\n${instructions}`;
  };

  // Função para fazer upload de arquivos pendentes
  const uploadPendingFiles = async (assistantId: string) => {
    if (pendingFiles.length === 0) return;

    for (const file of pendingFiles) {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) continue;

        // Upload para Supabase Storage
        const fileName = `${user.user.id}/${assistantId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('assistant-knowledge')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Erro ao fazer upload:', uploadError);
          continue;
        }

        // Obter URL público
        const { data: { publicUrl } } = supabase.storage
          .from('assistant-knowledge')
          .getPublicUrl(fileName);

        // Converter arquivo para base64
        const fileToBase64 = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = error => reject(error);
          });
        };

        // Upload para OpenAI
        const response = await supabase.functions.invoke('openai-assistants', {
          body: {
            action: 'upload-knowledge-file',
            file: await fileToBase64(file),
            fileName: file.name,
            mimeType: file.type
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (response.error) {
          console.error('Erro ao fazer upload para OpenAI:', response.error);
          continue;
        }

        // Salvar metadados no banco
        await supabase
          .from('assistant_knowledge_files')
          .insert({
            assistant_id: assistantId,
            user_id: user.user.id,
            file_name: file.name,
            file_url: publicUrl,
            openai_file_id: response.data.openai_file_id,
            file_size: file.size,
            mime_type: file.type,
          });
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
      }
    }
  };

  // Função para processar URLs
  const processKnowledgeUrls = async (assistantId: string) => {
    if (knowledgeUrls.length === 0) return;

    for (const url of knowledgeUrls) {
      try {
        // Chamar função de scraper
        const response = await supabase.functions.invoke('web-scraper', {
          body: {
            url: url,
            assistantId: assistantId
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (response.error) {
          console.error('Erro ao processar URL:', response.error);
        }
      } catch (error) {
        console.error('Erro ao processar URL:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    setFormLoading(true);

    try {
      // Construir instruções com função
      const finalInstructions = buildInstructionsWithRole();
      
      const action = editingAssistant ? 'update' : 'create';
      const body = editingAssistant 
        ? { action, assistantId: editingAssistant.id, name, description, instructions: finalInstructions, model: "gpt-4o" }
        : { action, name, description, instructions: finalInstructions, model: "gpt-4o" };

      const response = await supabase.functions.invoke('openai-assistants', {
        body,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const createdAssistantId = response.data?.assistant?.id || response.data?.id;

      // Se for criação, processar arquivos e URLs
      if (!editingAssistant && createdAssistantId) {
        // Upload de arquivos pendentes
        if (pendingFiles.length > 0) {
          await uploadPendingFiles(createdAssistantId);
        }

        // Processar URLs
        if (knowledgeUrls.length > 0) {
          await processKnowledgeUrls(createdAssistantId);
        }
      }

      toast({
        title: editingAssistant ? "Agente atualizado!" : "Agente criado!",
        description: editingAssistant 
          ? "As alterações foram salvas com sucesso." 
          : "Seu novo agente está pronto para uso.",
      });

      setIsCreateOpen(false);
      resetForm();
      await reloadAssistants(); // Aguarda o reload
      await reloadLimits(); // Reload limits after creating
    } catch (error: any) {
      console.error('Error saving assistant:', error);
      
      // Mensagens de erro mais específicas
      let errorMessage = error.message;
      let errorTitle = "Erro ao salvar agente";
      
      if (error.message?.includes('duplicate') || error.message?.includes('unique') || error.message?.includes('already exists')) {
        errorTitle = "Nome já utilizado";
        errorMessage = "Já existe um agente com esse nome. Por favor, escolha um nome diferente.";
      } else if (error.message?.includes('OpenAI API')) {
        errorTitle = "Erro na API do OpenAI";
        errorMessage = "Houve um problema ao conectar com o OpenAI. Tente novamente em alguns instantes.";
      } else if (error.message?.includes('Database error')) {
        errorTitle = "Erro no banco de dados";
        errorMessage = "Houve um problema ao salvar no banco de dados. Tente novamente.";
      } else if (error.message?.includes('Invalid token') || error.message?.includes('authorization')) {
        errorTitle = "Erro de autenticação";
        errorMessage = "Sua sessão expirou. Por favor, faça login novamente.";
      } else if (!error.message || error.message === 'undefined') {
        errorMessage = "Ocorreu um erro inesperado. Tente novamente.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
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

      await reloadAssistants(); // Aguarda o reload
      await reloadLimits(); // Reload limits after deleting
    } catch (error: any) {
      console.error('Error deleting assistant:', error);
      
      // Mensagens de erro mais específicas para exclusão
      let errorMessage = error.message;
      let errorTitle = "Erro ao excluir agente";
      
      if (error.message?.includes('not found') || error.message?.includes('não encontrado')) {
        errorTitle = "Agente não encontrado";
        errorMessage = "O agente não foi encontrado. Talvez já tenha sido excluído.";
      } else if (error.message?.includes('Invalid token') || error.message?.includes('authorization')) {
        errorTitle = "Erro de autenticação";
        errorMessage = "Sua sessão expirou. Por favor, faça login novamente.";
      } else if (!error.message || error.message === 'undefined') {
        errorMessage = "Ocorreu um erro inesperado ao excluir o agente. Tente novamente.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading || assistantsLoading) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6">
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
              <Button onClick={reloadAssistants} variant="outline" size="sm" className="w-full sm:w-auto text-sm">
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {t("common.reload")}
              </Button>
              <Button 
                onClick={openCreateDialog}
                disabled={limits && !limits.can_create_assistant}
                className="w-full sm:w-auto text-sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                {t("dashboard.quickActions.createAgent.button")}
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

          {/* Banner de upgrade se limite atingido */}
          {limits && !limits.can_create_assistant && (
            <div className="mb-6">
              <UpgradeBanner 
                type="assistants" 
                currentCount={limits.current_assistants}
                maxCount={limits.max_assistants}
              />
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assistants">{t('assistants.tabs.myAgents')}</TabsTrigger>
              <TabsTrigger value="templates">{t('assistants.tabs.templates')}</TabsTrigger>
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
                  {editingAssistant ? t('assistants.createDialog.editTitle') : t('assistants.createDialog.createTitle')}
                </DialogTitle>
                <DialogDescription>
                  {editingAssistant 
                    ? t('assistants.createDialog.editDescription')
                    : t('assistants.createDialog.createDescription')
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
                      <Label htmlFor="agentRole">Função do Agente</Label>
                      <Select value={agentRole} onValueChange={setAgentRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="atendente/suporte">Atendente/Suporte</SelectItem>
                          <SelectItem value="vendedor/closer">Vendedor/Closer</SelectItem>
                          <SelectItem value="sdr/qualificador">SDR/Qualificador</SelectItem>
                          <SelectItem value="custom">Função Personalizada</SelectItem>
                        </SelectContent>
                      </Select>
                      {agentRole === "custom" && (
                        <Input
                          placeholder="Descreva a função do agente (ex: Consultor de vendas, Especialista em onboarding...)"
                          value={customRole}
                          onChange={(e) => setCustomRole(e.target.value)}
                          className="mt-2"
                        />
                      )}
                      <p className="text-xs text-muted-foreground">
                        A função será incluída automaticamente nas instruções do agente.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Base de Conhecimento - Arquivos</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.txt,.csv,.json,.md"
                          onChange={(e) => {
                            if (e.target.files) {
                              setPendingFiles(Array.from(e.target.files));
                            }
                          }}
                          className="hidden"
                          id="knowledge-files-input"
                        />
                        <label
                          htmlFor="knowledge-files-input"
                          className="cursor-pointer flex flex-col items-center justify-center gap-2"
                        >
                          <Bot className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Clique para adicionar arquivos (PDF, DOC, DOCX, TXT, CSV, JSON, MD)
                          </span>
                        </label>
                        {pendingFiles.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {pendingFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">{file.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setPendingFiles(pendingFiles.filter((_, i) => i !== index));
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Arquivos serão adicionados à base de conhecimento após criar o agente.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Base de Conhecimento - URLs</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://exemplo.com"
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newUrl.trim()) {
                              e.preventDefault();
                              if (!knowledgeUrls.includes(newUrl.trim())) {
                                setKnowledgeUrls([...knowledgeUrls, newUrl.trim()]);
                                setNewUrl("");
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (newUrl.trim() && !knowledgeUrls.includes(newUrl.trim())) {
                              setKnowledgeUrls([...knowledgeUrls, newUrl.trim()]);
                              setNewUrl("");
                            }
                          }}
                        >
                          Adicionar
                        </Button>
                      </div>
                      {knowledgeUrls.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {knowledgeUrls.map((url, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-sm truncate flex-1">{url}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setKnowledgeUrls(knowledgeUrls.filter((_, i) => i !== index));
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        URLs serão processadas e adicionadas à base de conhecimento após criar o agente.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="instructions">Instruções</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setInstructionsExpanded(true)}
                          className="text-xs"
                        >
                          <Expand className="h-3 w-3 mr-1" />
                          Expandir
                        </Button>
                      </div>
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
                    <Tabs defaultValue="media" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="media">Arquivos de Mídia</TabsTrigger>
                        <TabsTrigger value="knowledge">Base de Conhecimento</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="media" className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Arquivos de Mídia</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Arquivos que o assistente pode <strong>ENVIAR</strong> nas conversas do WhatsApp 
                            (imagens, vídeos, documentos).
                          </p>
                          <AssistantMediaUpload 
                            assistantId={editingAssistant.id}
                            onUploadComplete={() => {
                              // Recarregar assistentes para atualizar instruções
                              reloadAssistants();
                            }}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="knowledge" className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Base de Conhecimento</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Documentos que o assistente pode <strong>CONSULTAR</strong> para gerar respostas 
                            (PDFs, catálogos, manuais, etc.).
                          </p>
                          <AssistantKnowledgeUpload 
                            assistantId={editingAssistant.id}
                            onUploadComplete={() => {
                              // Recarregar assistentes se necessário
                              reloadAssistants();
                            }}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
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
                            href={`${window.location.origin}/embed/chat/${selectedAgentForEmbed.id}`}
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
                          // Usar domínio customizado CLONEFY
                          const baseUrl = window.location.hostname.includes('lovable') 
                            ? window.location.origin 
                            : 'https://clonefyia.com'; // Domínio customizado CLONEFY
                          
                          const code = `<!-- Chat Flutuante CLONEFY -->
<!-- IMPORTANTE: Este código carrega o chat dinamicamente. 
     As atualizações do agente (instruções, customização, templates, etc.) aparecem automaticamente
     sem precisar atualizar este código no seu site. -->
<script src="${baseUrl}/embed-widget-v2.js" data-assistant-id="${selectedAgentForEmbed.id}"></script>`;
                          
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
                        {(() => {
                          const exampleBaseUrl = window.location.hostname.includes('lovable') 
                            ? window.location.origin 
                            : 'https://clonefyia.com';
                          return `<!-- Chat Flutuante CLONEFY -->
<!-- IMPORTANTE: Este código carrega o chat dinamicamente. 
     As atualizações do agente (instruções, customização, templates, etc.) aparecem automaticamente
     sem precisar atualizar este código no seu site. -->
<script src="${exampleBaseUrl}/embed-widget-v2.js" data-assistant-id="${selectedAgentForEmbed.id}"></script>`;
                        })()}
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
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-800 dark:text-green-200 font-medium mb-1">
                        ✨ Atualizações Automáticas
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        <strong>Importante:</strong> Quando você atualizar as instruções, customização ou base de conhecimento do agente, 
                        as mudanças aparecerão automaticamente no chat do site do cliente. 
                        <strong> Não é necessário copiar o código novamente!</strong> O chat carrega as informações dinamicamente.
                      </p>
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
                        href={`${window.location.origin}/embed/chat/${selectedAgentForEmbed.id}`}
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

          {/* Expanded Instructions Dialog */}
          <Dialog open={instructionsExpanded} onOpenChange={setInstructionsExpanded}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('assistants.instructionsDialog.title')}</DialogTitle>
                <DialogDescription>
                  {t('assistants.instructionsDialog.description')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expanded-instructions">{t('assistants.instructionsDialog.label')}</Label>
                  <Textarea
                    id="expanded-instructions"
                    placeholder={t('assistants.instructionsDialog.placeholder')}
                    rows={20}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="min-h-[500px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Seja específico sobre como o agente deve responder e se comportar. 
                    Incluir exemplos e cenários específicos melhorará a qualidade das respostas.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setInstructionsExpanded(false)}
                  >
                    Fechar
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => {
                      setInstructionsExpanded(false);
                      toast({
                        title: "Instruções salvas!",
                        description: "As alterações foram aplicadas ao formulário.",
                      });
                    }}
                  >
                    Salvar e Fechar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
      <OnboardingGuide />
    </main>
  );
};

export default memo(Assistants);
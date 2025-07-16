import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Edit, Trash2, MessageSquare, Settings, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AgentTutorial from "@/components/AgentTutorial";

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


  const loadAssistants = async () => {
    // Aguarda a sessão estar disponível
    let currentSession = session;
    if (!currentSession) {
      const { data } = await supabase.auth.getSession();
      currentSession = data.session;
    }

    if (!currentSession) {
      console.log('Agentes: Sem sessão disponível');
      return;
    }

    try {
      console.log('Agentes: Carregando agentes...');
      const response = await supabase.functions.invoke('openai-assistants', {
        body: { action: 'list' },
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      console.log('Agentes: Resposta completa:', response);

      if (response.error) {
        console.error('Agentes: Erro na resposta:', response.error);
        throw response.error;
      }

      const assistantsList = response.data?.assistants || [];
      console.log('Agentes: Lista recebida:', assistantsList.length, 'agentes');
      
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
        
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Bot className="h-8 w-8 text-primary" />
                  Agentes
                </h1>
                <p className="text-muted-foreground">
                  Crie e gerencie seus agentes de IA personalizados
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadAssistants} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Recarregar
              </Button>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Agente
              </Button>
            </div>
          </div>

          {/* Tutorial Section */}
          <AgentTutorial />

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
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Agente
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assistants.map((assistant) => (
                <Card key={assistant.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{assistant.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            GPT-4o
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(assistant)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(assistant)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {assistant.description && (
                      <CardDescription>{assistant.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        <strong>Instruções:</strong>
                      </div>
                      <p className="text-sm line-clamp-3">
                        {assistant.instructions || "Nenhuma instrução definida"}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="flex-1" onClick={() => {
                        // Salva o assistente no localStorage para seleção automática
                        localStorage.setItem('selectedAssistantId', assistant.id);
                        localStorage.setItem('selectedAssistantName', assistant.name);
                        localStorage.setItem('autoStartConversation', 'true');
                        navigate('/conversations');
                      }}>
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Testar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(assistant)}>
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create/Edit Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAssistant ? "Editar Agente" : "Criar Novo Agente"}
                </DialogTitle>
                <DialogDescription>
                  {editingAssistant 
                    ? "Modifique as configurações do seu agente" 
                    : "Configure seu agente de IA personalizado"
                  }
                </DialogDescription>
              </DialogHeader>
              
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
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Assistants;
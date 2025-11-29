import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Palette, Settings, BarChart3, Copy, Eye, ArrowLeft, MessageCircle, Layout, Plus, Trash2, HelpCircle, User, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import OptimizedWidgetPreview from '@/components/widget/OptimizedWidgetPreview';
import ColorPicker from '@/components/widget/ColorPicker';
import ImageUpload from '@/components/widget/ImageUpload';
import { useOptimizedWidgetCustomization, WidgetTemplate, ActionButton } from '@/hooks/useOptimizedWidgetCustomization';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

// Template options with visual cards
const TEMPLATE_OPTIONS: { id: WidgetTemplate; name: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'classic',
    name: 'Clássico',
    description: 'Apenas o botão flutuante no canto da tela',
    icon: <MessageCircle className="h-8 w-8" />
  },
  {
    id: 'bubble',
    name: 'Balão de Mensagem',
    description: 'Botão + balão com mensagem de boas-vindas',
    icon: <MessageSquare className="h-8 w-8" />
  },
  {
    id: 'agent_card',
    name: 'Card do Agente',
    description: 'Card expandido com foto, nome, status e botões de ação',
    icon: <User className="h-8 w-8" />
  },
  {
    id: 'quick_questions',
    name: 'Perguntas Rápidas',
    description: 'Balões com perguntas pré-definidas clicáveis',
    icon: <HelpCircle className="h-8 w-8" />
  }
];

const WidgetCustomization = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const assistantId = searchParams.get('assistant');
  const [selectedAssistant, setSelectedAssistant] = useState<string>('');
  const [assistants, setAssistants] = useState<any[]>([]);
  const { toast } = useToast();
  
  const {
    customization,
    loading,
    saveCustomization,
    loadCustomization,
    clearCache
  } = useOptimizedWidgetCustomization(selectedAssistant || assistantId || '');

  const [formData, setFormData] = useState({
    widget_name: 'Assistente Virtual',
    avatar_url: '',
    button_icon_url: '',
    welcome_message: 'Olá! Como posso ajudar você hoje?',
    primary_color: '#0066cc',
    secondary_color: '#f8f9fa',
    text_color: '#333333',
    button_position: 'right' as 'left' | 'right',
    is_active: true,
    // New template fields
    widget_template: 'classic' as WidgetTemplate,
    bubble_message: 'Oi! Como posso te ajudar?',
    quick_questions: [] as string[],
    action_buttons: [] as ActionButton[],
    show_status_indicator: true,
    status_text: 'Online agora'
  });
  
  const [previewKey, setPreviewKey] = useState(0);

  // Update formData diretamente - removido preview separado para evitar conflitos
  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Forçar re-render do preview para mudanças importantes
    if (['avatar_url', 'widget_name', 'primary_color', 'secondary_color', 'welcome_message', 'widget_template', 'bubble_message', 'quick_questions', 'action_buttons', 'show_status_indicator', 'status_text'].includes(field)) {
      setPreviewKey(prev => prev + 1);
    }
  }, []);

  // Helper functions for managing quick questions
  const addQuickQuestion = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      quick_questions: [...prev.quick_questions, '']
    }));
  }, []);

  const updateQuickQuestion = useCallback((index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      quick_questions: prev.quick_questions.map((q, i) => i === index ? value : q)
    }));
    setPreviewKey(prev => prev + 1);
  }, []);

  const removeQuickQuestion = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      quick_questions: prev.quick_questions.filter((_, i) => i !== index)
    }));
    setPreviewKey(prev => prev + 1);
  }, []);

  // Helper functions for managing action buttons
  const addActionButton = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      action_buttons: [...prev.action_buttons, { label: '', message: '' }]
    }));
  }, []);

  const updateActionButton = useCallback((index: number, field: 'label' | 'message', value: string) => {
    setFormData(prev => ({
      ...prev,
      action_buttons: prev.action_buttons.map((btn, i) => 
        i === index ? { ...btn, [field]: value } : btn
      )
    }));
    setPreviewKey(prev => prev + 1);
  }, []);

  const removeActionButton = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      action_buttons: prev.action_buttons.filter((_, i) => i !== index)
    }));
    setPreviewKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    loadAssistants();
  }, []);

  useEffect(() => {
    if (assistantId) {
      setSelectedAssistant(assistantId);
    }
  }, [assistantId]);

  useEffect(() => {
    if (customization) {
      const newFormData = {
        widget_name: customization.widget_name || 'Assistente Virtual',
        avatar_url: customization.avatar_url || '',
        button_icon_url: customization.button_icon_url || '',
        welcome_message: customization.welcome_message || 'Olá! Como posso ajudar você hoje?',
        primary_color: customization.primary_color || '#0066cc',
        secondary_color: customization.secondary_color || '#f8f9fa',
        text_color: customization.text_color || '#333333',
        button_position: (customization.button_position as 'left' | 'right') || 'right',
        is_active: customization.is_active !== false,
        // New template fields
        widget_template: customization.widget_template || 'classic' as WidgetTemplate,
        bubble_message: customization.bubble_message || 'Oi! Como posso te ajudar?',
        quick_questions: customization.quick_questions || [],
        action_buttons: customization.action_buttons || [],
        show_status_indicator: customization.show_status_indicator !== false,
        status_text: customization.status_text || 'Online agora'
      };
      
      console.log('🔄 Atualizando formData do banco de dados:', {
        assistantId: selectedAssistant,
        loaded: customization,
        newFormData
      });
      
      setFormData(newFormData);
      
      // Forçar re-render do preview quando mudar de assistente
      setPreviewKey(prev => prev + 1);
      
      console.log('✅ FormData sincronizado com sucesso');
    } else {
      console.log('⚠️ Nenhuma personalização encontrada, usando valores padrão');
      // Reset para valores padrão quando não há personalização
      setFormData({
        widget_name: 'Assistente Virtual',
        avatar_url: '',
        button_icon_url: '',
        welcome_message: 'Olá! Como posso ajudar você hoje?',
        primary_color: '#0066cc',
        secondary_color: '#f8f9fa',
        text_color: '#333333',
        button_position: 'right' as 'left' | 'right',
        is_active: true,
        // New template fields with defaults
        widget_template: 'classic' as WidgetTemplate,
        bubble_message: 'Oi! Como posso te ajudar?',
        quick_questions: [],
        action_buttons: [],
        show_status_indicator: true,
        status_text: 'Online agora'
      });
      setPreviewKey(prev => prev + 1);
    }
  }, [customization, selectedAssistant]);

  // Carregar customização quando assistente muda
  useEffect(() => {
    if (selectedAssistant) {
      console.log('🔄 Mudando para assistente:', selectedAssistant);
      console.log('🔄 FormData atual antes da mudança:', formData);
      
      // Limpar cache do assistente anterior
      clearCache();
      
      // Forçar re-render imediato do preview
      setPreviewKey(prev => prev + 1);
      
      // Carregar personalização do novo assistente
      loadCustomization();
    }
  }, [selectedAssistant, loadCustomization, clearCache]);

  const loadAssistants = async () => {
    try {
      const { data, error } = await supabase
        .from('assistants')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssistants(data || []);
    } catch (error) {
      console.error('Erro ao carregar assistentes:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedAssistant) {
      toast({
        title: 'Erro',
        description: 'Selecione um assistente primeiro',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('💾 Salvando personalização:', formData);
      
      const result = await saveCustomization(formData);
      
      if (result) {
        console.log('✅ Personalização salva com sucesso:', result);
        
        // Forçar reload dos dados para garantir sincronização
        await loadCustomization();
        
        toast({
          title: 'Sucesso!',
          description: 'Personalização salva e ativa no widget',
        });
      } else {
        throw new Error('Nenhum resultado retornado do salvamento');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar personalização:', error);
      toast({
        title: 'Erro',
        description: `Erro ao salvar personalização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive'
      });
    }
  };

  const generateEmbedCode = () => {
    if (!selectedAssistant) return '';
    
    const baseUrl = window.location.origin;
    return `<!-- Clonefy Chat Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/embed-widget-v2.js';
    script.dataset.assistantId = '${selectedAssistant}';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;
  };

  const copyEmbedCode = () => {
    const code = generateEmbedCode();
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copiado!',
      description: 'Código embed copiado para a área de transferência',
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <main className="flex-1 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-4 mb-6">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Chat Flutuante para Site
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Personalize o chat que aparecerá no seu site e gere o código para incorporar
              </p>
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Seletor de Assistente */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Selecionar Assistente
                </CardTitle>
                <CardDescription>
                  Escolha qual assistente você quer personalizar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um assistente" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

        {selectedAssistant && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configurações */}
            <div className="space-y-6">
              <Tabs defaultValue="template" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="template">
                    <Layout className="h-4 w-4 mr-2" />
                    Template
                  </TabsTrigger>
                  <TabsTrigger value="appearance">
                    <Palette className="h-4 w-4 mr-2" />
                    Aparência
                  </TabsTrigger>
                  <TabsTrigger value="behavior">
                    <Settings className="h-4 w-4 mr-2" />
                    Comportamento
                  </TabsTrigger>
                </TabsList>

                {/* Template Selection Tab */}
                <TabsContent value="template" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Escolha o Estilo do Widget</CardTitle>
                      <CardDescription>
                        Selecione como o chat aparecerá no site
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {TEMPLATE_OPTIONS.map((template) => (
                          <div
                            key={template.id}
                            onClick={() => updateFormData('widget_template', template.id)}
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                              formData.widget_template === template.id
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex flex-col items-center text-center gap-2">
                              <div className={`p-3 rounded-full ${
                                formData.widget_template === template.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {template.icon}
                              </div>
                              <h3 className="font-semibold">{template.name}</h3>
                              <p className="text-xs text-muted-foreground">{template.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Conditional fields based on template */}
                  {formData.widget_template === 'bubble' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Configurar Balão de Mensagem</CardTitle>
                        <CardDescription>
                          Configure a mensagem que aparece no balão acima do botão
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="bubble_message">Mensagem do Balão</Label>
                          <Input
                            id="bubble_message"
                            value={formData.bubble_message}
                            onChange={(e) => updateFormData('bubble_message', e.target.value)}
                            placeholder="Oi! Como posso te ajudar?"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {formData.widget_template === 'agent_card' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Configurar Card do Agente</CardTitle>
                        <CardDescription>
                          Configure as informações e botões de ação do card
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="show_status_indicator"
                            checked={formData.show_status_indicator}
                            onChange={(e) => updateFormData('show_status_indicator', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="show_status_indicator">Mostrar indicador de status</Label>
                        </div>

                        {formData.show_status_indicator && (
                          <div>
                            <Label htmlFor="status_text">Texto do Status</Label>
                            <Input
                              id="status_text"
                              value={formData.status_text}
                              onChange={(e) => updateFormData('status_text', e.target.value)}
                              placeholder="Online agora"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Botões de Ação</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addActionButton}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar Botão
                            </Button>
                          </div>
                          
                          {formData.action_buttons.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                              Nenhum botão de ação configurado. Clique em "Adicionar Botão" para criar.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {formData.action_buttons.map((btn, index) => (
                                <div key={index} className="flex gap-2 items-start p-3 bg-muted/50 rounded-lg">
                                  <div className="flex-1 space-y-2">
                                    <Input
                                      value={btn.label}
                                      onChange={(e) => updateActionButton(index, 'label', e.target.value)}
                                      placeholder="Texto do botão (ex: Agendar Demo)"
                                    />
                                    <Input
                                      value={btn.message}
                                      onChange={(e) => updateActionButton(index, 'message', e.target.value)}
                                      placeholder="Mensagem enviada ao clicar (ex: Quero agendar uma demonstração)"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeActionButton(index)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {formData.widget_template === 'quick_questions' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Configurar Perguntas Rápidas</CardTitle>
                        <CardDescription>
                          Configure as perguntas que aparecem em balões clicáveis
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Perguntas</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addQuickQuestion}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar Pergunta
                            </Button>
                          </div>
                          
                          {formData.quick_questions.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                              Nenhuma pergunta configurada. Clique em "Adicionar Pergunta" para criar.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {formData.quick_questions.map((question, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                  <Input
                                    value={question}
                                    onChange={(e) => updateQuickQuestion(index, e.target.value)}
                                    placeholder={`Pergunta ${index + 1} (ex: O que é o Clonefy?)`}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeQuickQuestion(index)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="appearance" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações Básicas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="widget_name">Nome do Assistente</Label>
                        <Input
                          id="widget_name"
                          value={formData.widget_name}
                          onChange={(e) => updateFormData('widget_name', e.target.value)}
                          placeholder="Nome que aparece no chat"
                        />
                      </div>

                      <div>
                        <Label htmlFor="welcome_message">Mensagem de Boas-vindas</Label>
                        <Textarea
                          id="welcome_message"
                          value={formData.welcome_message}
                          onChange={(e) => updateFormData('welcome_message', e.target.value)}
                          placeholder="Primeira mensagem que o usuário vê"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Imagens</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ImageUpload
                        label="Avatar do Assistente"
                        value={formData.avatar_url}
                        onChange={(url) => updateFormData('avatar_url', url)}
                        bucket="assistant-media"
                      />

                      <ImageUpload
                        label="Ícone do Botão Flutuante"
                        value={formData.button_icon_url}
                        onChange={(url) => updateFormData('button_icon_url', url)}
                        bucket="assistant-media"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Cores</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ColorPicker
                        label="Cor Principal"
                        value={formData.primary_color}
                        onChange={(color) => updateFormData('primary_color', color)}
                      />

                      <ColorPicker
                        label="Cor Secundária (Fundo)"
                        value={formData.secondary_color}
                        onChange={(color) => updateFormData('secondary_color', color)}
                      />

                      <ColorPicker
                        label="Cor do Texto"
                        value={formData.text_color}
                        onChange={(color) => updateFormData('text_color', color)}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="behavior" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Posicionamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Posição do Botão</Label>
                        <Select 
                          value={formData.button_position} 
                          onValueChange={(value: 'left' | 'right') => updateFormData('button_position', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="right">Direita</SelectItem>
                            <SelectItem value="left">Esquerda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={(e) => updateFormData('is_active', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="is_active">Chat Ativo</Label>
                        {formData.is_active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inativo
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Código para Incorporar</CardTitle>
                      <CardDescription>
                        Cole este código no seu site para exibir o widget
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <pre className="text-sm overflow-x-auto">
                          <code>{generateEmbedCode()}</code>
                        </pre>
                      </div>
                      <Button onClick={copyEmbedCode} className="mt-2" variant="outline">
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Código
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    'Salvar Personalização'
                  )}
                </Button>
                <Button variant="outline" onClick={() => window.open(`/embed-chat?assistant=${selectedAssistant}`, '_blank')}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Testar Chat
                </Button>
                <Button variant="outline" onClick={() => window.open(`/widget-analytics?assistant=${selectedAssistant}`, '_blank')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Preview do Chat
                  </CardTitle>
                  <CardDescription>
                    Veja como o chat aparecerá no seu site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-visible min-h-[600px]">
                    <div key={previewKey}>
                      <OptimizedWidgetPreview 
                        customization={formData}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  </div>
</SidebarProvider>
  );
};

export default WidgetCustomization;
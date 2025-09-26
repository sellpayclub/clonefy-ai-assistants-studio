import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Palette, Settings, BarChart3, Copy, Eye, ArrowLeft, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import OptimizedWidgetPreview from '@/components/widget/OptimizedWidgetPreview';
import ColorPicker from '@/components/widget/ColorPicker';
import ImageUpload from '@/components/widget/ImageUpload';
import { useOptimizedWidgetCustomization } from '@/hooks/useOptimizedWidgetCustomization';
import { useRealtimePreview } from '@/hooks/useRealtimePreview';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

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
    loadCustomization
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
    is_active: true
  });

  // Hook para preview em tempo real otimizado
  const { previewData, updatePreviewData, resetPreviewData } = useRealtimePreview(formData);

  // Update formData e preview simultaneamente
  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    updatePreviewData(field as any, value);
  }, [updatePreviewData]);

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
        is_active: customization.is_active !== false
      };
      
      console.log('🔄 Updating form data from DB:', {
        loaded: customization,
        newFormData
      });
      
      setFormData(newFormData);
      resetPreviewData(newFormData); // Sincronizar preview
      
      console.log('✅ Form and preview data synchronized');
    }
  }, [customization, resetPreviewData]);

  // Carregar customização quando assistente muda
  useEffect(() => {
    if (selectedAssistant) {
      loadCustomization();
    }
  }, [selectedAssistant, loadCustomization]);

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
      const result = await saveCustomization(formData);
      
      // Recarregar dados após salvar para garantir sincronização
      if (result) {
        await loadCustomization();
      }
      
      toast({
        title: 'Sucesso!',
        description: 'Personalização salva com sucesso',
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar personalização',
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
                Personalizar Widget de Chat
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Customize a aparência do seu widget de chat flutuante
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
              <Tabs defaultValue="appearance" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="appearance">
                    <Palette className="h-4 w-4 mr-2" />
                    Aparência
                  </TabsTrigger>
                  <TabsTrigger value="behavior">
                    <Settings className="h-4 w-4 mr-2" />
                    Comportamento
                  </TabsTrigger>
                </TabsList>

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
                        <Label htmlFor="is_active">Widget Ativo</Label>
                        {formData.is_active ? (
                          <Badge variant="default">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
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
                  {loading ? 'Salvando...' : 'Salvar Personalização'}
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
                    Preview do Widget
                  </CardTitle>
                  <CardDescription>
                    Veja como seu widget aparecerá no site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-visible min-h-[600px]">
                    <OptimizedWidgetPreview 
                      customization={previewData}
                    />
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
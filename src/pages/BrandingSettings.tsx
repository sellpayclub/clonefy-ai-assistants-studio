import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/contexts/BrandingContext";
import ColorPicker from "@/components/widget/ColorPicker";
import ImageUpload from "@/components/widget/ImageUpload";
import { ArrowLeft, Save, RotateCcw, Upload, Palette, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const BrandingSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { 
    logoLightUrl, 
    logoDarkUrl, 
    logoIconUrl, 
    primaryColor, 
    accentColor, 
    companyName,
    isActive,
    updateBranding, 
    resetBranding,
    isLoading: brandingLoading 
  } = useBranding();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    logoLightUrl: '',
    logoDarkUrl: '',
    logoIconUrl: '',
    primaryColor: '#22c55e',
    accentColor: '#16a34a',
    companyName: '',
    isActive: false,
  });

  // Check auth and initialize form
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  // Update form when branding loads
  useEffect(() => {
    if (!brandingLoading) {
      setFormData({
        logoLightUrl: logoLightUrl !== '/lovable-uploads/fbe6c7af-7d70-474d-af99-5f513f7a14dc.png' ? logoLightUrl : '',
        logoDarkUrl: logoDarkUrl !== '/lovable-uploads/8f2944d9-660f-4eb7-bae6-e226176b6a6d.png' ? logoDarkUrl : '',
        logoIconUrl: logoIconUrl !== '/lovable-uploads/59070bb1-9779-4bbb-a3d5-a65bacf38b70.png' ? logoIconUrl : '',
        primaryColor: primaryColor || '#22c55e',
        accentColor: accentColor || '#16a34a',
        companyName: companyName !== 'CLONEFY' ? companyName : '',
        isActive: isActive,
      });
    }
  }, [brandingLoading, logoLightUrl, logoDarkUrl, logoIconUrl, primaryColor, accentColor, companyName, isActive]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBranding({
        logo_light_url: formData.logoLightUrl || null,
        logo_dark_url: formData.logoDarkUrl || null,
        logo_icon_url: formData.logoIconUrl || null,
        primary_color: formData.primaryColor,
        accent_color: formData.accentColor,
        company_name: formData.companyName || null,
        is_active: formData.isActive,
      });
      
      toast({
        title: "Configurações salvas!",
        description: "Sua marca personalizada foi aplicada com sucesso.",
      });
    } catch (error) {
      console.error('Error saving branding:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetBranding();
      setFormData({
        logoLightUrl: '',
        logoDarkUrl: '',
        logoIconUrl: '',
        primaryColor: '#22c55e',
        accentColor: '#16a34a',
        companyName: '',
        isActive: false,
      });
      toast({
        title: "Configurações restauradas",
        description: "O branding padrão foi restaurado.",
      });
    } catch (error) {
      toast({
        title: "Erro ao restaurar",
        description: "Não foi possível restaurar as configurações.",
        variant: "destructive",
      });
    }
  };

  if (loading || brandingLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Personalização da Marca
              </h1>
              <p className="text-muted-foreground mt-1">
                Configure logo e cores do seu sistema whitelabel
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrão
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Enable/Disable Toggle */}
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Ativar Marca Personalizada</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando ativado, suas configurações personalizadas serão aplicadas em todo o sistema
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Logos da Marca
                </CardTitle>
                <CardDescription>
                  Faça upload dos logos para modo claro, escuro e ícone
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    <Building2 className="h-4 w-4 inline mr-2" />
                    Nome da Empresa
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Nome da sua empresa"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                </div>

                {/* Logo Light */}
                <div className="space-y-2">
                  <Label>Logo (Modo Claro)</Label>
                  <ImageUpload
                    value={formData.logoLightUrl}
                    onChange={(url) => setFormData(prev => ({ ...prev, logoLightUrl: url }))}
                    label="Arraste ou clique para upload"
                    bucket="avatars"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recomendado: PNG transparente, 200x50px
                  </p>
                </div>

                {/* Logo Dark */}
                <div className="space-y-2">
                  <Label>Logo (Modo Escuro)</Label>
                  <ImageUpload
                    value={formData.logoDarkUrl}
                    onChange={(url) => setFormData(prev => ({ ...prev, logoDarkUrl: url }))}
                    label="Arraste ou clique para upload"
                    bucket="avatars"
                  />
                  <p className="text-xs text-muted-foreground">
                    Versão clara do logo para fundos escuros
                  </p>
                </div>

                {/* Logo Icon */}
                <div className="space-y-2">
                  <Label>Ícone (Sidebar Colapsada)</Label>
                  <ImageUpload
                    value={formData.logoIconUrl}
                    onChange={(url) => setFormData(prev => ({ ...prev, logoIconUrl: url }))}
                    label="Arraste ou clique para upload"
                    bucket="avatars"
                  />
                  <p className="text-xs text-muted-foreground">
                    Versão quadrada do logo, 64x64px
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Color Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Cores do Sistema
                </CardTitle>
                <CardDescription>
                  Personalize as cores principais do dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ColorPicker
                  label="Cor Primária"
                  value={formData.primaryColor}
                  onChange={(color) => setFormData(prev => ({ ...prev, primaryColor: color }))}
                />
                
                <ColorPicker
                  label="Cor de Acento"
                  value={formData.accentColor}
                  onChange={(color) => setFormData(prev => ({ ...prev, accentColor: color }))}
                />

                {/* Preview */}
                <div className="space-y-3 pt-4 border-t">
                  <Label>Preview das Cores</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="h-20 rounded-lg flex items-center justify-center text-white font-medium shadow-md"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      Cor Primária
                    </div>
                    <div
                      className="h-20 rounded-lg flex items-center justify-center text-white font-medium shadow-md"
                      style={{ backgroundColor: formData.accentColor }}
                    >
                      Cor de Acento
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      className="flex-1"
                      style={{ 
                        backgroundColor: formData.primaryColor,
                        color: 'white'
                      }}
                    >
                      Botão Exemplo
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      style={{ 
                        borderColor: formData.primaryColor,
                        color: formData.primaryColor
                      }}
                    >
                      Botão Outline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logo Preview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Preview dos Logos</CardTitle>
                <CardDescription>
                  Visualize como seus logos aparecerão no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Light Mode Preview */}
                  <div className="space-y-3">
                    <Label>Modo Claro</Label>
                    <div className="bg-white border rounded-lg p-6 flex items-center justify-center min-h-[100px]">
                      {formData.logoLightUrl ? (
                        <img 
                          src={formData.logoLightUrl} 
                          alt="Logo Light"
                          className="max-h-16 w-auto"
                        />
                      ) : (
                        <img 
                          src="/lovable-uploads/fbe6c7af-7d70-474d-af99-5f513f7a14dc.png" 
                          alt="Default Logo"
                          className="max-h-16 w-auto opacity-50"
                        />
                      )}
                    </div>
                  </div>

                  {/* Dark Mode Preview */}
                  <div className="space-y-3">
                    <Label>Modo Escuro</Label>
                    <div className="bg-muted-foreground/90 border rounded-lg p-6 flex items-center justify-center min-h-[100px]">
                      {formData.logoDarkUrl ? (
                        <img 
                          src={formData.logoDarkUrl} 
                          alt="Logo Dark"
                          className="max-h-16 w-auto"
                        />
                      ) : (
                        <img 
                          src="/lovable-uploads/8f2944d9-660f-4eb7-bae6-e226176b6a6d.png" 
                          alt="Default Logo Dark"
                          className="max-h-16 w-auto opacity-50"
                        />
                      )}
                    </div>
                  </div>

                  {/* Icon Preview */}
                  <div className="space-y-3">
                    <Label>Ícone (Sidebar)</Label>
                    <div className="bg-muted border rounded-lg p-6 flex items-center justify-center min-h-[100px]">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: formData.primaryColor }}
                      >
                        {formData.logoIconUrl ? (
                          <img 
                            src={formData.logoIconUrl} 
                            alt="Logo Icon"
                            className="w-8 h-8"
                          />
                        ) : (
                          <img 
                            src="/lovable-uploads/59070bb1-9779-4bbb-a3d5-a65bacf38b70.png" 
                            alt="Default Icon"
                            className="w-8 h-8 opacity-70"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BrandingSettings;

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Megaphone,
    Building2,
    Upload,
    Settings,
    Smartphone,
    CheckCircle2,
    ArrowLeft,
    ArrowRight,
    Plus,
    Trash2,
    Clock,
    Calendar,
    Shield
} from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import SupportChatWidget from "@/components/SupportChatWidget";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CampaignData {
    name: string;
    description: string;
    // Step 1: Negócio
    business_name: string;
    business_description: string;
    value_proposition: string;
    tone_of_voice: 'friendly' | 'professional' | 'casual';
    common_objections: { objection: string; response: string }[];
    important_links: { label: string; url: string }[];
    // Step 2: Leads (handled separately)
    // Step 3: Configuração
    max_followups: number;
    min_interval_minutes: number;
    max_daily_messages: number;
    start_hour: number;
    end_hour: number;
    working_days: number[];
    // Step 4: WhatsApp
    whatsapp_instance: string;
}

const STEPS = [
    { id: 1, title: 'Sobre seu Negócio', icon: Building2, description: 'Informações para a IA' },
    { id: 2, title: 'Importar Leads', icon: Upload, description: 'Adicione seus contatos' },
    { id: 3, title: 'Configurar Campanha', icon: Settings, description: 'Horários e limites' },
    { id: 4, title: 'Conectar WhatsApp', icon: Smartphone, description: 'Vincule seu número' },
    { id: 5, title: 'Revisar e Ativar', icon: CheckCircle2, description: 'Confirme e inicie' },
];

const FollowupCampaignWizard = () => {
    const [user, setUser] = useState<User | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [campaignData, setCampaignData] = useState<CampaignData>({
        name: '',
        description: '',
        business_name: '',
        business_description: '',
        value_proposition: '',
        tone_of_voice: 'friendly',
        common_objections: [{ objection: '', response: '' }],
        important_links: [{ label: '', url: '' }],
        max_followups: 3,
        min_interval_minutes: 30,
        max_daily_messages: 50,
        start_hour: 9,
        end_hour: 18,
        working_days: [1, 2, 3, 4, 5],
        whatsapp_instance: '',
    });
    const { t } = useLanguage();
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        };
        getSession();
    }, []);

    const updateCampaignData = (field: keyof CampaignData, value: any) => {
        setCampaignData(prev => ({ ...prev, [field]: value }));
    };

    const addObjection = () => {
        setCampaignData(prev => ({
            ...prev,
            common_objections: [...prev.common_objections, { objection: '', response: '' }]
        }));
    };

    const removeObjection = (index: number) => {
        setCampaignData(prev => ({
            ...prev,
            common_objections: prev.common_objections.filter((_, i) => i !== index)
        }));
    };

    const updateObjection = (index: number, field: 'objection' | 'response', value: string) => {
        setCampaignData(prev => ({
            ...prev,
            common_objections: prev.common_objections.map((obj, i) =>
                i === index ? { ...obj, [field]: value } : obj
            )
        }));
    };

    const addLink = () => {
        setCampaignData(prev => ({
            ...prev,
            important_links: [...prev.important_links, { label: '', url: '' }]
        }));
    };

    const removeLink = (index: number) => {
        setCampaignData(prev => ({
            ...prev,
            important_links: prev.important_links.filter((_, i) => i !== index)
        }));
    };

    const updateLink = (index: number, field: 'label' | 'url', value: string) => {
        setCampaignData(prev => ({
            ...prev,
            important_links: prev.important_links.map((link, i) =>
                i === index ? { ...link, [field]: value } : link
            )
        }));
    };

    const toggleWorkingDay = (day: number) => {
        setCampaignData(prev => ({
            ...prev,
            working_days: prev.working_days.includes(day)
                ? prev.working_days.filter(d => d !== day)
                : [...prev.working_days, day].sort()
        }));
    };

    const handleNext = () => {
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSaveCampaign = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Criar campanha no banco
            const { data, error } = await (supabase as any)
                .from('followup_campaigns')
                .insert({
                    user_id: user.id,
                    name: campaignData.name || 'Nova Campanha',
                    description: campaignData.description,
                    business_name: campaignData.business_name,
                    business_description: campaignData.business_description,
                    value_proposition: campaignData.value_proposition,
                    tone_of_voice: campaignData.tone_of_voice,
                    common_objections: campaignData.common_objections.filter(o => o.objection),
                    important_links: campaignData.important_links.filter(l => l.url),
                    max_followups: campaignData.max_followups,
                    min_interval_minutes: campaignData.min_interval_minutes,
                    max_daily_messages: campaignData.max_daily_messages,
                    start_hour: campaignData.start_hour,
                    end_hour: campaignData.end_hour,
                    working_days: campaignData.working_days,
                    whatsapp_instance: campaignData.whatsapp_instance,
                    status: 'draft',
                })
                .select()
                .single();

            if (error) throw error;

            toast({
                title: "Campanha criada!",
                description: "Sua campanha foi salva como rascunho.",
            });

            navigate(`/followup/campaigns/${data.id}`);
        } catch (error: any) {
            console.error('Erro ao criar campanha:', error);
            toast({
                title: "Erro ao criar campanha",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nome da Campanha</Label>
                                <Input
                                    placeholder="Ex: Recuperação de Leads Janeiro"
                                    value={campaignData.name}
                                    onChange={(e) => updateCampaignData('name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nome do Negócio</Label>
                                <Input
                                    placeholder="Ex: Minha Loja Virtual"
                                    value={campaignData.business_name}
                                    onChange={(e) => updateCampaignData('business_name', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>O que você vende? (Descrição do negócio)</Label>
                            <Textarea
                                placeholder="Descreva seu produto ou serviço em detalhes. Quanto mais informações, melhor a IA vai performar."
                                value={campaignData.business_description}
                                onChange={(e) => updateCampaignData('business_description', e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Qual o principal benefício? (Proposta de Valor)</Label>
                            <Textarea
                                placeholder="Ex: Ajudamos empresas a economizar 50% do tempo com automação de atendimento."
                                value={campaignData.value_proposition}
                                onChange={(e) => updateCampaignData('value_proposition', e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tom de Voz</Label>
                            <div className="flex gap-3">
                                {['friendly', 'professional', 'casual'].map((tone) => (
                                    <Button
                                        key={tone}
                                        variant={campaignData.tone_of_voice === tone ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => updateCampaignData('tone_of_voice', tone)}
                                    >
                                        {tone === 'friendly' ? '😊 Amigável' : tone === 'professional' ? '👔 Profissional' : '😎 Casual'}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Objeções Comuns e Respostas</Label>
                                <Button variant="ghost" size="sm" onClick={addObjection}>
                                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                                </Button>
                            </div>
                            {campaignData.common_objections.map((obj, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg">
                                    <Input
                                        placeholder="Objeção (ex: Está muito caro)"
                                        value={obj.objection}
                                        onChange={(e) => updateObjection(index, 'objection', e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Resposta da IA"
                                            value={obj.response}
                                            onChange={(e) => updateObjection(index, 'response', e.target.value)}
                                        />
                                        {campaignData.common_objections.length > 1 && (
                                            <Button variant="ghost" size="icon" onClick={() => removeObjection(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Links Importantes</Label>
                                <Button variant="ghost" size="sm" onClick={addLink}>
                                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                                </Button>
                            </div>
                            {campaignData.important_links.map((link, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <Input
                                        placeholder="Rótulo (ex: Site, Checkout)"
                                        value={link.label}
                                        onChange={(e) => updateLink(index, 'label', e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="https://..."
                                            value={link.url}
                                            onChange={(e) => updateLink(index, 'url', e.target.value)}
                                        />
                                        {campaignData.important_links.length > 1 && (
                                            <Button variant="ghost" size="icon" onClick={() => removeLink(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Arraste um arquivo CSV ou clique para selecionar</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Formato: Nome, WhatsApp, Email (opcional)
                            </p>
                            <Button variant="outline">
                                <Upload className="h-4 w-4 mr-2" />
                                Selecionar Arquivo
                            </Button>
                        </div>

                        <div className="text-center text-muted-foreground">ou</div>

                        <div className="space-y-4">
                            <Label>Adicionar manualmente</Label>
                            <Textarea
                                placeholder="Cole aqui a lista de contatos (um por linha):
João Silva, 5511999999999
Maria Santos, 5511888888888, maria@email.com"
                                rows={6}
                            />
                            <p className="text-xs text-muted-foreground">
                                Formato: Nome, WhatsApp, Email (opcional) - separados por vírgula
                            </p>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Megaphone className="h-4 w-4" />
                                    Máximo de Follow-ups
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={campaignData.max_followups}
                                    onChange={(e) => updateCampaignData('max_followups', parseInt(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">Quantas mensagens enviar por lead</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Intervalo Mínimo (min)
                                </Label>
                                <Input
                                    type="number"
                                    min={5}
                                    max={1440}
                                    value={campaignData.min_interval_minutes}
                                    onChange={(e) => updateCampaignData('min_interval_minutes', parseInt(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">Entre mensagens para o mesmo lead</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Limite Diário
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={campaignData.max_daily_messages}
                                    onChange={(e) => updateCampaignData('max_daily_messages', parseInt(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">Máximo de mensagens por dia</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Horário de Funcionamento
                            </Label>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Das</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={23}
                                        className="w-20"
                                        value={campaignData.start_hour}
                                        onChange={(e) => updateCampaignData('start_hour', parseInt(e.target.value))}
                                    />
                                    <span className="text-sm">h</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">às</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={23}
                                        className="w-20"
                                        value={campaignData.end_hour}
                                        onChange={(e) => updateCampaignData('end_hour', parseInt(e.target.value))}
                                    />
                                    <span className="text-sm">h</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Dias de Funcionamento</Label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { day: 0, label: 'Dom' },
                                    { day: 1, label: 'Seg' },
                                    { day: 2, label: 'Ter' },
                                    { day: 3, label: 'Qua' },
                                    { day: 4, label: 'Qui' },
                                    { day: 5, label: 'Sex' },
                                    { day: 6, label: 'Sáb' },
                                ].map(({ day, label }) => (
                                    <Button
                                        key={day}
                                        variant={campaignData.working_days.includes(day) ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => toggleWorkingDay(day)}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                <Smartphone className="h-8 w-8 text-green-500" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Conectar WhatsApp</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Selecione uma instância existente ou crie uma nova
                            </p>

                            <div className="max-w-sm mx-auto space-y-4">
                                <Input
                                    placeholder="Nome da instância WhatsApp"
                                    value={campaignData.whatsapp_instance}
                                    onChange={(e) => updateCampaignData('whatsapp_instance', e.target.value)}
                                />
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => navigate('/whatsapp')}
                                >
                                    <Smartphone className="h-4 w-4 mr-2" />
                                    Gerenciar Conexões WhatsApp
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
                            <p className="font-medium text-yellow-600 mb-1">⚠️ Importante</p>
                            <p className="text-muted-foreground">
                                A conexão WhatsApp precisa estar ativa para os disparos funcionarem.
                                Você pode pular esta etapa e configurar depois.
                            </p>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Revisar Campanha</h3>
                            <p className="text-sm text-muted-foreground">
                                Confira as informações antes de salvar
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-muted/30">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        Negócio
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-1">
                                    <p><strong>Nome:</strong> {campaignData.business_name || 'Não definido'}</p>
                                    <p><strong>Tom:</strong> {campaignData.tone_of_voice}</p>
                                    <p><strong>Objeções:</strong> {campaignData.common_objections.filter(o => o.objection).length} configuradas</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/30">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        Configurações
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-1">
                                    <p><strong>Follow-ups:</strong> {campaignData.max_followups}x</p>
                                    <p><strong>Limite diário:</strong> {campaignData.max_daily_messages} msgs</p>
                                    <p><strong>Horário:</strong> {campaignData.start_hour}h - {campaignData.end_hour}h</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg text-sm">
                            <p className="font-medium text-primary mb-1">💡 Próximos passos</p>
                            <p className="text-muted-foreground">
                                Após salvar, você poderá importar leads, configurar a sequência de mensagens e ativar a campanha.
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (!user) return null;

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <AppSidebar />

                <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <SidebarTrigger />
                        <Button variant="ghost" size="icon" onClick={() => navigate('/followup')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">Nova Campanha de Follow-up</h1>
                            <p className="text-muted-foreground text-sm">
                                Configure sua campanha em poucos passos
                            </p>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between max-w-3xl mx-auto">
                            {STEPS.map((step, index) => (
                                <div key={step.id} className="flex items-center">
                                    <div className="flex flex-col items-center">
                                        <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                      ${currentStep === step.id
                                                ? 'bg-primary border-primary text-primary-foreground'
                                                : currentStep > step.id
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'bg-muted border-border text-muted-foreground'
                                            }
                    `}>
                                            {currentStep > step.id ? (
                                                <CheckCircle2 className="h-5 w-5" />
                                            ) : (
                                                <step.icon className="h-5 w-5" />
                                            )}
                                        </div>
                                        <span className={`text-xs mt-2 hidden md:block ${currentStep === step.id ? 'text-primary font-medium' : 'text-muted-foreground'
                                            }`}>
                                            {step.title}
                                        </span>
                                    </div>
                                    {index < STEPS.length - 1 && (
                                        <div className={`w-12 md:w-24 h-0.5 mx-2 ${currentStep > step.id ? 'bg-green-500' : 'bg-border'
                                            }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step Content */}
                    <Card className="max-w-3xl mx-auto">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {(() => {
                                    const StepIcon = STEPS[currentStep - 1].icon;
                                    return <StepIcon className="h-5 w-5 text-primary" />;
                                })()}
                                {STEPS[currentStep - 1].title}
                            </CardTitle>
                            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderStep()}
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <div className="max-w-3xl mx-auto mt-6 flex justify-between">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={currentStep === 1}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Button>

                        {currentStep < 5 ? (
                            <Button onClick={handleNext}>
                                Próximo
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSaveCampaign}
                                disabled={loading}
                                className="bg-gradient-to-r from-green-500 to-green-600"
                            >
                                {loading ? 'Salvando...' : 'Salvar Campanha'}
                                <CheckCircle2 className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </main>

                <SupportChatWidget />
            </div>
        </SidebarProvider>
    );
};

export default FollowupCampaignWizard;

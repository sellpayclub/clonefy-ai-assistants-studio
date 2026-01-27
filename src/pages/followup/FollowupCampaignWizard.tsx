import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
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
    Shield,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CampaignData {
    name: string;
    description: string;
    business_name: string;
    business_description: string;
    value_proposition: string;
    tone_of_voice: 'friendly' | 'professional' | 'casual';
    common_objections: { objection: string; response: string }[];
    important_links: { label: string; url: string }[];
    max_followups: number;
    min_interval_minutes: number;
    max_daily_messages: number;
    start_hour: number;
    end_hour: number;
    working_days: number[];
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
    const [whatsappInstances, setWhatsappInstances] = useState<{ instance_name: string; status: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importedLeads, setImportedLeads] = useState<{ name: string; whatsapp: string; email?: string }[]>([]);
    const [manualLeadsText, setManualLeadsText] = useState('');

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchWhatsappInstances(session.user.id);
            }
        };
        getSession();
    }, []);

    const fetchWhatsappInstances = async (userId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from('n8n_fluxogpt')
                .select('instance_name, status')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWhatsappInstances(data || []);
        } catch (error) {
            console.error('Erro ao buscar instâncias:', error);
        }
    };

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

        if (!campaignData.whatsapp_instance) {
            toast({
                title: "Nome da conexão obrigatório",
                description: "Digite um nome para a conexão WhatsApp",
                variant: "destructive",
            });
            setCurrentStep(4);
            return;
        }

        setLoading(true);
        try {
            let whatsappInstanceKey = `followup-${campaignData.whatsapp_instance}-${user.id.substring(0, 8)}`;

            try {
                toast({
                    title: "Configurando campanha...",
                    description: "Aguarde enquanto salvamos os dados",
                });

                const { data: evolutionData, error: evolutionError } = await supabase.functions.invoke('whatsapp-evolution', {
                    body: {
                        action: 'create',
                        instanceName: whatsappInstanceKey,
                        userEmail: user.email
                    }
                });

                if (!evolutionError && evolutionData?.instance) {
                    whatsappInstanceKey = evolutionData.instance.instanceName || whatsappInstanceKey;
                }
            } catch (evolutionError) {
                console.log('Evolution API não disponível, continuando com salvamento local:', evolutionError);
            }

            const { data: campaign, error: campaignError } = await (supabase as any)
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
                    whatsapp_instance: whatsappInstanceKey,
                    whatsapp_status: 'disconnected',
                    status: 'draft',
                })
                .select()
                .single();

            if (campaignError) throw campaignError;

            toast({
                title: "Criando IA especializada...",
                description: "Gerando assistente com os dados do seu negócio",
            });

            try {
                const assistantResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://ekfkrwueqwpqakpsrsjt.supabase.co'}/functions/v1/openai-assistants`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                    },
                    body: JSON.stringify({
                        action: 'create',
                        name: `Follow-up - ${campaignData.business_name || 'Campanha'}`,
                        instructions: `Você é um especialista em follow-up de vendas para ${campaignData.business_name || 'uma empresa'}.

SOBRE O NEGÓCIO:
${campaignData.business_description || 'Empresa de vendas'}

PROPOSTA DE VALOR:
${campaignData.value_proposition || 'Oferecemos as melhores soluções'}

OBJEÇÕES COMUNS E RESPOSTAS:
${campaignData.common_objections.filter(o => o.objection).map(o => `- Objeção: ${o.objection}\n  Resposta: ${o.response}`).join('\n') || 'Usar argumentos de valor'}

TOM DE VOZ: ${campaignData.tone_of_voice === 'friendly' ? 'Amigável e empático' : campaignData.tone_of_voice === 'professional' ? 'Profissional e formal' : 'Casual e descontraído'}

SUA MISSÃO:
- Gerar mensagens de follow-up naturais e persuasivas
- Ser ${campaignData.tone_of_voice} em todas as interações
- Máximo de 3 linhas por mensagem
- Não ser insistente, despertar curiosidade`,
                        model: 'gpt-4o-mini'
                    })
                });

                if (assistantResponse.ok) {
                    const assistantData = await assistantResponse.json();
                    await (supabase as any)
                        .from('followup_campaigns')
                        .update({ openai_assistant_id: assistantData.id })
                        .eq('id', campaign.id);
                }
            } catch (aiError) {
                console.error('Erro ao criar assistente:', aiError);
            }

            toast({
                title: "Campanha criada!",
                description: "Sua campanha foi salva. Conecte o WhatsApp para ativar.",
            });

            navigate(`/followup/campaigns/${campaign.id}`);
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
                                placeholder="Descreva seu produto ou serviço em detalhes."
                                value={campaignData.business_description}
                                onChange={(e) => updateCampaignData('business_description', e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Qual o principal benefício? (Proposta de Valor)</Label>
                            <Textarea
                                placeholder="Ex: Ajudamos empresas a economizar 50% do tempo com automação."
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
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Importar Leads Depois</CardTitle>
                                <CardDescription>
                                    Você poderá importar leads após criar a campanha na tela de detalhes.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Pule esta etapa por agora e configure o restante da campanha.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Máx. Follow-ups
                                </Label>
                                <Input
                                    type="number"
                                    value={campaignData.max_followups}
                                    onChange={(e) => updateCampaignData('max_followups', parseInt(e.target.value))}
                                    min={1}
                                    max={10}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Intervalo (min)
                                </Label>
                                <Input
                                    type="number"
                                    value={campaignData.min_interval_minutes}
                                    onChange={(e) => updateCampaignData('min_interval_minutes', parseInt(e.target.value))}
                                    min={5}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    Mensagens/Dia
                                </Label>
                                <Input
                                    type="number"
                                    value={campaignData.max_daily_messages}
                                    onChange={(e) => updateCampaignData('max_daily_messages', parseInt(e.target.value))}
                                    min={1}
                                    max={500}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Início do Horário</Label>
                                <Select
                                    value={campaignData.start_hour.toString()}
                                    onValueChange={(v) => updateCampaignData('start_hour', parseInt(v))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <SelectItem key={i} value={i.toString()}>{`${i}:00`}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Fim do Horário</Label>
                                <Select
                                    value={campaignData.end_hour.toString()}
                                    onValueChange={(v) => updateCampaignData('end_hour', parseInt(v))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <SelectItem key={i} value={i.toString()}>{`${i}:00`}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Dias de Trabalho
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                                    <Button
                                        key={index}
                                        variant={campaignData.working_days.includes(index) ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => toggleWorkingDay(index)}
                                    >
                                        {day}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Smartphone className="h-5 w-5 text-green-500" />
                                    Criar Conexão WhatsApp
                                </CardTitle>
                                <CardDescription>
                                    Digite um nome para identificar esta conexão.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nome da Conexão</Label>
                                    <Input
                                        placeholder="Ex: vendas, suporte, marketing"
                                        value={campaignData.whatsapp_instance}
                                        onChange={(e) => updateCampaignData('whatsapp_instance', e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Você conectará seu WhatsApp depois de criar a campanha.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Resumo da Campanha</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Nome</p>
                                        <p className="font-medium">{campaignData.name || 'Nova Campanha'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Negócio</p>
                                        <p className="font-medium">{campaignData.business_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Tom de Voz</p>
                                        <p className="font-medium">{campaignData.tone_of_voice}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">WhatsApp</p>
                                        <p className="font-medium">{campaignData.whatsapp_instance || 'Não configurado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Horário</p>
                                        <p className="font-medium">{campaignData.start_hour}:00 - {campaignData.end_hour}:00</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Máx. Follow-ups</p>
                                        <p className="font-medium">{campaignData.max_followups}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    if (!user) return null;

    return (
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <div className="border-b p-4">
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <Button variant="ghost" size="icon" onClick={() => navigate('/followup')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">Nova Campanha</h1>
                        <p className="text-muted-foreground text-sm">
                            Configure sua campanha de follow-up
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6">
                {/* Steps Navigation */}
                <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
                    {STEPS.map((step, index) => {
                        const StepIcon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <div key={step.id} className="flex items-center">
                                <div
                                    className={`flex flex-col items-center cursor-pointer ${isActive ? 'opacity-100' : 'opacity-50'}`}
                                    onClick={() => setCurrentStep(step.id)}
                                >
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isActive ? 'bg-primary text-primary-foreground' : isCompleted ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                                    </div>
                                    <span className="text-xs mt-1 hidden md:block">{step.title}</span>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                        <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderStep()}
                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex justify-between max-w-3xl mx-auto mt-6">
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
                        <Button onClick={handleSaveCampaign} disabled={loading}>
                            {loading ? 'Criando...' : 'Criar Campanha'}
                            <CheckCircle2 className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </main>
    );
};

export default FollowupCampaignWizard;
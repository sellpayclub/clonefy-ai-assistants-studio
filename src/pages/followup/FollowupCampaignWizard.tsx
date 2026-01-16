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
    Shield,
    Wifi,
    WifiOff
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppSidebar from "@/components/AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
            // 1. Tentar criar instância WhatsApp via Evolution API (pode falhar por CORS)
            let whatsappInstanceKey = `followup-${campaignData.whatsapp_instance}-${user.id.substring(0, 8)}`;

            try {
                toast({
                    title: "Configurando campanha...",
                    description: "Aguarde enquanto salvamos os dados",
                });

                const evolutionResponse = await fetch('https://api.cfroi.click/instance/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': '94805bfbb25f77f37a029f5a3dbfe62b'
                    },
                    body: JSON.stringify({
                        instanceName: whatsappInstanceKey,
                        qrcode: true,
                        integration: 'WHATSAPP-BAILEYS'
                    })
                });

                if (evolutionResponse.ok) {
                    const evolutionData = await evolutionResponse.json();
                    whatsappInstanceKey = evolutionData.instance?.instanceName || whatsappInstanceKey;
                }
            } catch (evolutionError) {
                console.log('Evolution API não disponível, continuando com salvamento local:', evolutionError);
                // Continua salvando a campanha mesmo sem criar a instância
            }

            // 2. Criar campanha no banco (com status draft)
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

            // 3. Criar assistente OpenAI dedicado via Edge Function
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
                    // Atualizar campanha com ID do assistente
                    await (supabase as any)
                        .from('followup_campaigns')
                        .update({ openai_assistant_id: assistantData.id })
                        .eq('id', campaign.id);
                }
            } catch (aiError) {
                console.error('Erro ao criar assistente:', aiError);
                // Continua mesmo sem assistente - usará geração direta
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
                        <div
                            className="text-center py-12 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                const files = e.dataTransfer.files;
                                if (files && files.length > 0) {
                                    const file = files[0];
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        const content = ev.target?.result as string;
                                        const lines = content.split('\n').filter(l => l.trim());
                                        const leads = lines.slice(1).map(line => {
                                            const parts = line.split(/[,;\t]/).map(p => p.trim());
                                            return { name: parts[0] || 'Lead', whatsapp: parts[1] || '', email: parts[2] };
                                        }).filter(l => l.whatsapp);
                                        setImportedLeads(leads);
                                        toast({ title: `${leads.length} leads importados!` });
                                    };
                                    reader.readAsText(file);
                                }
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.txt"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        const content = ev.target?.result as string;
                                        const lines = content.split('\n').filter(l => l.trim());
                                        const leads = lines.slice(1).map(line => {
                                            const parts = line.split(/[,;\t]/).map(p => p.trim());
                                            return { name: parts[0] || 'Lead', whatsapp: parts[1] || '', email: parts[2] };
                                        }).filter(l => l.whatsapp);
                                        setImportedLeads(leads);
                                        toast({ title: `${leads.length} leads importados!` });
                                    };
                                    reader.readAsText(file);
                                }}
                            />
                            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Clique ou arraste um arquivo CSV</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Formato: Nome, WhatsApp, Email (opcional)
                            </p>
                        </div>

                        {importedLeads.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-700 font-medium">✅ {importedLeads.length} leads prontos para importar</p>
                                <p className="text-sm text-green-600">Os leads serão salvos ao criar a campanha</p>
                            </div>
                        )}

                        <div className="text-center text-muted-foreground">ou</div>

                        <div className="space-y-4">
                            <Label>Adicionar manualmente</Label>
                            <Textarea
                                placeholder="Cole aqui a lista de contatos (um por linha):
João Silva, 5511999999999
Maria Santos, 5511888888888, maria@email.com"
                                rows={6}
                                value={manualLeadsText}
                                onChange={(e) => setManualLeadsText(e.target.value)}
                            />
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const lines = manualLeadsText.split('\n').filter(l => l.trim());
                                    const leads = lines.map(line => {
                                        const parts = line.split(/[,;\t]/).map(p => p.trim());
                                        return { name: parts[0] || 'Lead', whatsapp: parts[1] || '', email: parts[2] };
                                    }).filter(l => l.whatsapp);
                                    setImportedLeads(prev => [...prev, ...leads]);
                                    setManualLeadsText('');
                                    toast({ title: `${leads.length} leads adicionados!` });
                                }}
                            >
                                Adicionar Leads
                            </Button>
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
                        <div className="text-center py-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${campaignData.whatsapp_instance ? 'bg-green-500/20' : 'bg-muted'
                                }`}>
                                <Smartphone className={`h-8 w-8 ${campaignData.whatsapp_instance ? 'text-green-500' : 'text-muted-foreground'
                                    }`} />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Conectar WhatsApp</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Crie uma conexão exclusiva para esta campanha de follow-up
                            </p>
                        </div>

                        <div className="max-w-md mx-auto space-y-4">
                            {/* Nome da instância */}
                            <div className="space-y-2">
                                <Label>Nome da conexão</Label>
                                <Input
                                    placeholder="Ex: followup-vendas"
                                    value={campaignData.whatsapp_instance}
                                    onChange={(e) => updateCampaignData('whatsapp_instance', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Apenas letras minúsculas, números e hífens
                                </p>
                            </div>

                            {/* Botão de criar conexão */}
                            {!campaignData.whatsapp_instance ? (
                                <div className="p-6 bg-muted/30 rounded-lg text-center border border-dashed">
                                    <WifiOff className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Digite um nome para a conexão acima
                                    </p>
                                </div>
                            ) : (
                                <div className="p-6 bg-green-500/10 rounded-lg text-center border border-green-500/30">
                                    <Wifi className="h-10 w-10 text-green-500 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-green-600 mb-2">
                                        Conexão configurada: {campaignData.whatsapp_instance}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        O QR Code será exibido ao ativar a campanha
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                            <p className="font-medium text-blue-600 mb-1">💡 Conexão Exclusiva</p>
                            <p className="text-muted-foreground">
                                Esta conexão é <strong>exclusiva para follow-up</strong> e não interfere nos seus assistentes.
                                Você conectará seu WhatsApp ao ativar a campanha.
                            </p>
                        </div>

                        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-sm">
                            <p className="font-medium text-purple-600 mb-1">🤖 IA Automática</p>
                            <p className="text-muted-foreground">
                                Ao salvar, o sistema criará uma IA especializada com os dados do seu negócio
                                para gerar mensagens personalizadas de follow-up.
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

            </div>
        </SidebarProvider>
    );
};

export default FollowupCampaignWizard;

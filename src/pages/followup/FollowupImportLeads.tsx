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
    Upload,
    FileSpreadsheet,
    Users,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Download,
    X
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppSidebar from "@/components/AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ParsedLead {
    name: string;
    whatsapp_number: string;
    email: string;
    isValid: boolean;
    error?: string;
}

interface Campaign {
    id: string;
    name: string;
}

const FollowupImportLeads = () => {
    const [user, setUser] = useState<User | null>(null);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<string>('');
    const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
    const [manualText, setManualText] = useState('');
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useLanguage();
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchCampaigns(session.user.id);
            }
        };
        getSession();
    }, []);

    const fetchCampaigns = async (userId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from('followup_campaigns')
                .select('id, name')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCampaigns(data || []);
        } catch (error: any) {
            console.error('Erro ao buscar campanhas:', error);
        }
    };

    // Validar número WhatsApp (formato brasileiro)
    const validateWhatsAppNumber = (number: string): { isValid: boolean; formatted: string; error?: string } => {
        // Remover tudo que não é número
        const cleaned = number.replace(/\D/g, '');

        // Verificar se começa com + e adicionar 55 se não tiver código do país
        let formatted = cleaned;

        // Se não tem código do país, adicionar 55 (Brasil)
        if (cleaned.length === 10 || cleaned.length === 11) {
            formatted = '55' + cleaned;
        }

        // Verificar tamanho válido (13 dígitos para Brasil: 55 + DDD + número)
        if (formatted.length < 12 || formatted.length > 13) {
            return { isValid: false, formatted, error: 'Número inválido - verifique DDD e número' };
        }

        return { isValid: true, formatted };
    };

    // Parse CSV content
    const parseCSV = (content: string): ParsedLead[] => {
        const lines = content.split('\n').filter(line => line.trim());
        const leads: ParsedLead[] = [];

        // Detectar se tem header
        const firstLine = lines[0].toLowerCase();
        const hasHeader = firstLine.includes('nome') || firstLine.includes('name') ||
            firstLine.includes('whatsapp') || firstLine.includes('telefone');

        const startIndex = hasHeader ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Tentar diferentes separadores
            let parts: string[] = [];
            if (line.includes(';')) {
                parts = line.split(';').map(p => p.trim());
            } else if (line.includes(',')) {
                parts = line.split(',').map(p => p.trim());
            } else if (line.includes('\t')) {
                parts = line.split('\t').map(p => p.trim());
            } else {
                parts = [line]; // Uma única coluna
            }

            // Extrair dados
            const name = parts[0] || '';
            const rawNumber = parts[1] || parts[0] || '';
            const email = parts[2] || '';

            // Validar número
            const validation = validateWhatsAppNumber(rawNumber);

            leads.push({
                name: name || 'Lead',
                whatsapp_number: validation.formatted,
                email,
                isValid: validation.isValid,
                error: validation.error
            });
        }

        return leads;
    };

    // Parse texto manual
    const parseManualText = (text: string): ParsedLead[] => {
        return parseCSV(text);
    };

    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const leads = parseCSV(content);
            setParsedLeads(leads);

            const validCount = leads.filter(l => l.isValid).length;
            toast({
                title: `${leads.length} leads encontrados`,
                description: `${validCount} válidos, ${leads.length - validCount} com problemas`,
            });
        };
        reader.readAsText(file);
    };

    // Parse manual input
    const handleParseManual = () => {
        if (!manualText.trim()) {
            toast({
                title: "Texto vazio",
                description: "Cole a lista de contatos para processar",
                variant: "destructive",
            });
            return;
        }

        const leads = parseManualText(manualText);
        setParsedLeads(leads);

        const validCount = leads.filter(l => l.isValid).length;
        toast({
            title: `${leads.length} leads processados`,
            description: `${validCount} válidos, ${leads.length - validCount} com problemas`,
        });
    };

    // Remove lead from list
    const removeLead = (index: number) => {
        setParsedLeads(prev => prev.filter((_, i) => i !== index));
    };

    // Import leads to database
    const handleImportLeads = async () => {
        if (!user || !selectedCampaign) {
            toast({
                title: "Selecione uma campanha",
                description: "Escolha a campanha para importar os leads",
                variant: "destructive",
            });
            return;
        }

        const validLeads = parsedLeads.filter(l => l.isValid);
        if (validLeads.length === 0) {
            toast({
                title: "Nenhum lead válido",
                description: "Verifique os números e tente novamente",
                variant: "destructive",
            });
            return;
        }

        setImporting(true);
        try {
            // Preparar dados para inserção
            const leadsToInsert = validLeads.map(lead => ({
                user_id: user.id,
                campaign_id: selectedCampaign,
                name: lead.name,
                whatsapp_number: lead.whatsapp_number,
                email: lead.email || null,
                status: 'new',
                source: 'csv',
            }));

            // Inserir leads (upsert para evitar duplicatas)
            const { data, error } = await (supabase as any)
                .from('followup_leads')
                .upsert(leadsToInsert, {
                    onConflict: 'campaign_id,whatsapp_number',
                    ignoreDuplicates: true
                })
                .select();

            if (error) throw error;

            // Atualizar contador na campanha
            await (supabase as any)
                .from('followup_campaigns')
                .update({
                    total_leads: (supabase as any).sql`total_leads + ${validLeads.length}`
                })
                .eq('id', selectedCampaign);

            toast({
                title: "Leads importados!",
                description: `${validLeads.length} leads adicionados à campanha`,
            });

            // Limpar estado
            setParsedLeads([]);
            setManualText('');

            // Redirecionar para a campanha
            navigate(`/followup/campaigns/${selectedCampaign}`);

        } catch (error: any) {
            console.error('Erro ao importar leads:', error);
            toast({
                title: "Erro ao importar",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setImporting(false);
        }
    };

    // Download template CSV
    const downloadTemplate = () => {
        const template = `Nome,WhatsApp,Email
João Silva,5511999999999,joao@email.com
Maria Santos,5511888888888,maria@email.com
Pedro Costa,5521777777777,`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_leads.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!user) return null;

    const validLeadsCount = parsedLeads.filter(l => l.isValid).length;
    const invalidLeadsCount = parsedLeads.filter(l => !l.isValid).length;

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
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Upload className="h-5 w-5 text-primary" />
                                Importar Leads
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Adicione contatos via CSV ou manualmente
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column: Import Options */}
                        <div className="space-y-6">
                            {/* Campaign Selection */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Selecionar Campanha</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Escolha uma campanha" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {campaigns.map((campaign) => (
                                                <SelectItem key={campaign.id} value={campaign.id}>
                                                    {campaign.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {campaigns.length === 0 && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Nenhuma campanha encontrada. <a href="/followup/campaigns/new" className="text-primary underline">Crie uma campanha</a> primeiro.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Upload CSV */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4" />
                                        Upload de Arquivo
                                    </CardTitle>
                                    <CardDescription>Formatos: CSV, TXT</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                                        }}
                                        onDragLeave={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                            const files = e.dataTransfer.files;
                                            if (files && files.length > 0) {
                                                const file = files[0];
                                                if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => {
                                                        const content = ev.target?.result as string;
                                                        const leads = parseCSV(content);
                                                        setParsedLeads(leads);
                                                        const validCount = leads.filter(l => l.isValid).length;
                                                        toast({
                                                            title: `${leads.length} leads encontrados`,
                                                            description: `${validCount} válidos, ${leads.length - validCount} com problemas`,
                                                        });
                                                    };
                                                    reader.readAsText(file);
                                                } else {
                                                    toast({
                                                        title: "Formato inválido",
                                                        description: "Use arquivos .csv ou .txt",
                                                        variant: "destructive",
                                                    });
                                                }
                                            }
                                        }}
                                    >
                                        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-sm font-medium mb-1">Clique aqui ou arraste um arquivo</p>
                                        <p className="text-xs text-muted-foreground mb-3">Aceita arquivos .csv e .txt</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".csv,.txt"
                                            style={{ display: 'none' }}
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                    <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={downloadTemplate}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Baixar Template CSV
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Manual Input */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Entrada Manual
                                    </CardTitle>
                                    <CardDescription>Cole a lista de contatos</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder={`Cole sua lista aqui (um por linha):
João Silva, 5511999999999, joao@email.com
Maria Santos, 5511888888888
Pedro Costa, 5521777777777`}
                                        value={manualText}
                                        onChange={(e) => setManualText(e.target.value)}
                                        rows={6}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Formato: Nome, WhatsApp, Email (opcional) - separados por vírgula
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-3 w-full"
                                        onClick={handleParseManual}
                                        disabled={!manualText.trim()}
                                    >
                                        Processar Lista
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Preview */}
                        <Card>
                            <CardHeader className="pb-3 border-b">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">
                                        Preview ({parsedLeads.length} leads)
                                    </CardTitle>
                                    {parsedLeads.length > 0 && (
                                        <div className="flex gap-2">
                                            <Badge variant="default" className="bg-green-500">
                                                {validLeadsCount} válidos
                                            </Badge>
                                            {invalidLeadsCount > 0 && (
                                                <Badge variant="destructive">
                                                    {invalidLeadsCount} inválidos
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {parsedLeads.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">Nenhum lead processado ainda</p>
                                        <p className="text-xs mt-1">Faça upload de um arquivo ou cole a lista</p>
                                    </div>
                                ) : (
                                    <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
                                        {parsedLeads.map((lead, index) => (
                                            <div
                                                key={index}
                                                className={`p-3 flex items-center gap-3 ${lead.isValid ? 'bg-background' : 'bg-destructive/5'
                                                    }`}
                                            >
                                                <div className="flex-shrink-0">
                                                    {lead.isValid ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <AlertCircle className="h-5 w-5 text-destructive" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{lead.name}</p>
                                                    <p className="text-xs text-muted-foreground">{lead.whatsapp_number}</p>
                                                    {lead.email && (
                                                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                                                    )}
                                                    {lead.error && (
                                                        <p className="text-xs text-destructive">{lead.error}</p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => removeLead(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>

                            {parsedLeads.length > 0 && (
                                <div className="p-4 border-t bg-muted/30">
                                    <Button
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600"
                                        onClick={handleImportLeads}
                                        disabled={importing || validLeadsCount === 0 || !selectedCampaign}
                                    >
                                        {importing ? (
                                            <>Importando...</>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Importar {validLeadsCount} Leads
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>
                </main>

            </div>
        </SidebarProvider>
    );
};

export default FollowupImportLeads;

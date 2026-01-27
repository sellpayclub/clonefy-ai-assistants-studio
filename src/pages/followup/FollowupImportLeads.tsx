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
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Download,
    X
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
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

    const validateWhatsAppNumber = (number: string): { isValid: boolean; formatted: string; error?: string } => {
        const cleaned = number.replace(/\D/g, '');
        let formatted = cleaned;

        if (cleaned.length === 10 || cleaned.length === 11) {
            formatted = '55' + cleaned;
        }

        if (formatted.length < 12 || formatted.length > 13) {
            return { isValid: false, formatted, error: 'Número inválido - verifique DDD e número' };
        }

        return { isValid: true, formatted };
    };

    const parseCSV = (content: string): ParsedLead[] => {
        const lines = content.split('\n').filter(line => line.trim());
        const leads: ParsedLead[] = [];

        const firstLine = lines[0].toLowerCase();
        const hasHeader = firstLine.includes('nome') || firstLine.includes('name') ||
            firstLine.includes('whatsapp') || firstLine.includes('telefone');

        const startIndex = hasHeader ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            let parts: string[] = [];
            if (line.includes(';')) {
                parts = line.split(';').map(p => p.trim());
            } else if (line.includes(',')) {
                parts = line.split(',').map(p => p.trim());
            } else if (line.includes('\t')) {
                parts = line.split('\t').map(p => p.trim());
            } else {
                parts = [line];
            }

            const name = parts[0] || '';
            const rawNumber = parts[1] || parts[0] || '';
            const email = parts[2] || '';

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

    const parseManualText = (text: string): ParsedLead[] => {
        return parseCSV(text);
    };

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

    const removeLead = (index: number) => {
        setParsedLeads(prev => prev.filter((_, i) => i !== index));
    };

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
            const leadsToInsert = validLeads.map(lead => ({
                user_id: user.id,
                campaign_id: selectedCampaign,
                name: lead.name,
                whatsapp_number: lead.whatsapp_number,
                email: lead.email || null,
                status: 'new',
                source: 'csv',
            }));

            const { error } = await (supabase as any)
                .from('followup_leads')
                .upsert(leadsToInsert, {
                    onConflict: 'campaign_id,whatsapp_number',
                    ignoreDuplicates: true
                })
                .select();

            if (error) throw error;

            const { data: currentCampaign } = await (supabase as any)
                .from('followup_campaigns')
                .select('total_leads')
                .eq('id', selectedCampaign)
                .single();

            await (supabase as any)
                .from('followup_campaigns')
                .update({
                    total_leads: (currentCampaign?.total_leads || 0) + validLeads.length
                })
                .eq('id', selectedCampaign);

            toast({
                title: "Leads importados!",
                description: `${validLeads.length} leads adicionados à campanha`,
            });

            setParsedLeads([]);
            setManualText('');

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
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <div className="border-b p-4">
                <div className="flex items-center gap-3">
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
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6">
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
                                <Button variant="outline" size="sm" className="w-full mt-3" onClick={downloadTemplate}>
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
                                <CardDescription>Cole contatos separados por linha</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    placeholder={`Nome, WhatsApp, Email\nJoão Silva, 11999999999, joao@email.com\nMaria, 11888888888`}
                                    rows={6}
                                    value={manualText}
                                    onChange={(e) => setManualText(e.target.value)}
                                />
                                <Button className="w-full mt-3" onClick={handleParseManual}>
                                    Processar Contatos
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Preview and Import */}
                    <div className="space-y-6">
                        {/* Preview Stats */}
                        {parsedLeads.length > 0 && (
                            <div className="grid grid-cols-3 gap-3">
                                <Card className="bg-muted/30">
                                    <CardContent className="p-3 text-center">
                                        <p className="text-2xl font-bold">{parsedLeads.length}</p>
                                        <p className="text-xs text-muted-foreground">Total</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-green-500/10 border-green-500/20">
                                    <CardContent className="p-3 text-center">
                                        <p className="text-2xl font-bold text-green-600">{validLeadsCount}</p>
                                        <p className="text-xs text-muted-foreground">Válidos</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-red-500/10 border-red-500/20">
                                    <CardContent className="p-3 text-center">
                                        <p className="text-2xl font-bold text-red-600">{invalidLeadsCount}</p>
                                        <p className="text-xs text-muted-foreground">Inválidos</p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Leads Preview */}
                        <Card>
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-base">Preview dos Leads</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                                {parsedLeads.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">Nenhum lead processado ainda</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {parsedLeads.map((lead, index) => (
                                            <div key={index} className={`p-3 flex items-center gap-3 ${!lead.isValid ? 'bg-red-500/5' : ''}`}>
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${lead.isValid ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                                    {lead.isValid ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{lead.name}</p>
                                                    <p className="text-xs text-muted-foreground">{lead.whatsapp_number}</p>
                                                    {lead.error && (
                                                        <p className="text-xs text-red-500">{lead.error}</p>
                                                    )}
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLead(index)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Import Button */}
                        {parsedLeads.length > 0 && (
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleImportLeads}
                                disabled={importing || validLeadsCount === 0 || !selectedCampaign}
                            >
                                {importing ? (
                                    <>Importando...</>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Importar {validLeadsCount} Leads
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default FollowupImportLeads;
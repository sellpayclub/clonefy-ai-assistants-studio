import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Trash2, CheckCircle2, Copy, AlertCircle, Instagram } from "lucide-react";

const WEBHOOK_URL = "https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/meta-webhook";
const VERIFY_TOKEN = "clonefy_meta_verify_2024";

const InstagramIcon = ({ className }: { className?: string }) => (
  <Instagram className={className} />
);

const MessengerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.26 5.886-3.26-6.558 6.763z" />
  </svg>
);

interface MetaConnection {
  id: string;
  platform: string;
  page_id: string;
  page_access_token: string;
  instagram_account_id: string | null;
  assistant_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface Assistant {
  id: string;
  name: string;
}

const steps = [
  {
    number: 1,
    title: "Crie um App no Meta for Developers",
    description: "Acesse developers.facebook.com, clique em 'Criar App' e selecione os use cases 'Messenger' e/ou 'Instagram'.",
  },
  {
    number: 2,
    title: "Configure as permissões",
    description: "Ative instagram_business_basic, instagram_business_manage_messages (Instagram) ou pages_messaging (Messenger).",
  },
  {
    number: 3,
    title: "Configure o Webhook",
    description: "Na aba Webhooks do app, cole a URL de callback e o token de verificação abaixo. Inscreva-se em 'messages'.",
  },
  {
    number: 4,
    title: "Gere o Page Access Token",
    description: "Em Messenger > Configuração da API, selecione sua Página e gere o token. Cole abaixo junto com o Page ID.",
  },
];

export default function MetaChannels() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [platform, setPlatform] = useState<string>("instagram");
  const [pageId, setPageId] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["meta_connections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_connections")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MetaConnection[];
    },
    enabled: !!user,
  });

  const { data: assistants = [] } = useQuery({
    queryKey: ["assistants_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assistants")
        .select("id, name")
        .eq("user_id", user!.id)
        .eq("is_active", true);
      if (error) throw error;
      return data as Assistant[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("meta_connections")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meta_connections"] });
      toast({ title: "Conexão removida com sucesso" });
    },
    onError: () => toast({ title: "Erro ao remover conexão", variant: "destructive" }),
  });

  const handleSave = async () => {
    if (!pageId.trim() || !pageAccessToken.trim()) {
      toast({ title: "Preencha Page ID e Page Access Token", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("meta_connections").upsert({
        user_id: user!.id,
        platform,
        page_id: pageId.trim(),
        page_access_token: pageAccessToken.trim(),
        assistant_id: assistantId || null,
        is_active: true,
      }, { onConflict: "user_id,platform,page_id" });

      if (error) throw error;

      toast({ title: `✅ Conexão ${platform === 'instagram' ? 'Instagram' : 'Messenger'} salva!` });
      setPageId("");
      setPageAccessToken("");
      setAssistantId("");
      qc.invalidateQueries({ queryKey: ["meta_connections"] });
    } catch (err: unknown) {
      toast({
        title: "Erro ao salvar",
        description: err instanceof Error ? err.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <InstagramIcon className="w-7 h-7 text-pink-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meta Channels</h1>
          <p className="text-muted-foreground text-sm">
            Conecte Instagram Direct e Facebook Messenger ao assistente de IA
          </p>
        </div>
      </div>

      {/* Tutorial */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Como conectar</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <Card key={step.number} className="border border-border/60 bg-card/50">
              <CardContent className="pt-5 pb-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {step.number}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground leading-snug">{step.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Webhook info */}
      <Card className="border border-border/60 bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Dados do Webhook</CardTitle>
          <CardDescription className="text-xs">
            Cole esses valores no Meta for Developers ao configurar o webhook.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">URL de Callback</Label>
            <div className="flex gap-2">
              <Input value={WEBHOOK_URL} readOnly className="font-mono text-xs" />
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(WEBHOOK_URL, "URL")}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Verificar Token</Label>
            <div className="flex gap-2">
              <Input value={VERIFY_TOKEN} readOnly className="font-mono text-xs" />
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(VERIFY_TOKEN, "Token")}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connect form */}
      <Card className="border border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Conectar canal</CardTitle>
          <CardDescription className="text-xs">
            Selecione a plataforma, cole o Page ID e o Page Access Token gerado no Meta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Plataforma</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">
                  <span className="flex items-center gap-2">📸 Instagram Direct</span>
                </SelectItem>
                <SelectItem value="messenger">
                  <span className="flex items-center gap-2">💬 Facebook Messenger</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Page ID</Label>
            <Input
              placeholder="Exemplo: 123456789012345"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Page Access Token</Label>
            <Input
              placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxx..."
              value={pageAccessToken}
              onChange={(e) => setPageAccessToken(e.target.value)}
              className="font-mono text-sm"
              type="password"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Assistente de IA</Label>
            <Select value={assistantId} onValueChange={setAssistantId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um assistente" />
              </SelectTrigger>
              <SelectContent>
                {assistants.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assistants.length === 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Crie um assistente primeiro em "Agentes IA"
              </p>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || !pageId.trim() || !pageAccessToken.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Salvar Conexão
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active connections */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">
          Conexões ativas{" "}
          {connections.length > 0 && (
            <Badge variant="secondary" className="ml-1">{connections.length}</Badge>
          )}
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : connections.length === 0 ? (
          <Card className="border border-dashed border-border/60 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <InstagramIcon className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma conexão ativa</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Siga os passos acima para conectar seu primeiro canal
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <Card key={conn.id} className="border border-border/60">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                        {conn.platform === 'instagram' ? (
                          <InstagramIcon className="w-5 h-5 text-pink-500" />
                        ) : (
                          <MessengerIcon className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {conn.platform === 'instagram' ? 'Instagram' : 'Messenger'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          Page ID: {conn.page_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={conn.is_active ? "default" : "secondary"} className="text-xs">
                        {conn.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(conn.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

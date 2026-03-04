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
import { Bot, Trash2, CheckCircle2, ExternalLink, Copy, AlertCircle } from "lucide-react";

// Telegram blue icon as SVG
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
  </svg>
);

interface TelegramConnection {
  id: string;
  bot_token: string;
  bot_name: string | null;
  bot_username: string | null;
  assistant_id: string | null;
  is_active: boolean;
  created_at: string;
  assistants?: { name: string } | null;
}

interface Assistant {
  id: string;
  name: string;
}

const steps = [
  {
    number: 1,
    title: "Abra o Telegram e procure @BotFather",
    description: "No Telegram, pesquise por @BotFather (verificado com ✓) e inicie uma conversa.",
    command: "/start",
  },
  {
    number: 2,
    title: "Crie um novo bot",
    description: "Envie o comando /newbot, escolha um nome para o bot e depois um username (deve terminar em 'bot').",
    command: "/newbot",
  },
  {
    number: 3,
    title: "Copie o token e conecte",
    description: "O BotFather vai enviar um token como '1234567890:AAF...'. Cole abaixo, selecione um assistente e clique em Conectar.",
    command: null,
  },
];

export default function Telegram() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [botToken, setBotToken] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["telegram_connections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("telegram_connections")
        .select("*, assistants(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TelegramConnection[];
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
        .from("telegram_connections")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["telegram_connections"] });
      toast({ title: "Bot desconectado com sucesso" });
    },
    onError: () => toast({ title: "Erro ao desconectar bot", variant: "destructive" }),
  });

  const handleConnect = async () => {
    if (!botToken.trim()) {
      toast({ title: "Cole o token do BotFather", variant: "destructive" });
      return;
    }

    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-setup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            bot_token: botToken.trim(),
            assistant_id: assistantId || null,
          }),
        }
      );
      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Falha ao conectar");
      }

      toast({
        title: `✅ Bot @${result.bot_username} conectado!`,
        description: "Webhook registrado automaticamente.",
      });
      setBotToken("");
      setAssistantId("");
      qc.invalidateQueries({ queryKey: ["telegram_connections"] });
    } catch (err: unknown) {
      toast({
        title: "Erro ao conectar",
        description: err instanceof Error ? err.message : "Verifique o token",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    toast({ title: `"${cmd}" copiado!` });
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
          <TelegramIcon className="w-7 h-7 text-[#0088cc]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Telegram</h1>
          <p className="text-muted-foreground text-sm">
            Conecte seus bots do Telegram ao assistente de IA
          </p>
        </div>
      </div>

      {/* Step-by-step guide */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Como conectar</h2>
        <div className="grid gap-4 md:grid-cols-3">
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
                {step.command && (
                  <button
                    onClick={() => copyCommand(step.command!)}
                    className="flex items-center gap-1.5 text-xs font-mono bg-muted/60 hover:bg-muted text-foreground px-2.5 py-1.5 rounded-md transition-colors"
                  >
                    <code>{step.command}</code>
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <a
          href="https://t.me/BotFather"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#0088cc] hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Abrir @BotFather no Telegram
        </a>
      </div>

      {/* Connect form */}
      <Card className="border border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Conectar novo bot</CardTitle>
          <CardDescription className="text-xs">
            Cole o token recebido do @BotFather e selecione qual assistente responderá as mensagens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bot-token" className="text-sm">Token do Bot</Label>
            <Input
              id="bot-token"
              placeholder="1234567890:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="font-mono text-sm"
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
            onClick={handleConnect}
            disabled={isConnecting || !botToken.trim()}
            className="w-full bg-[#0088cc] hover:bg-[#0077b5] text-white"
          >
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Conectando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <TelegramIcon className="w-4 h-4" />
                Conectar Bot
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active connections */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">
          Bots conectados{" "}
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
              <TelegramIcon className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum bot conectado ainda</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Siga os passos acima para conectar seu primeiro bot
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <Card key={conn.id} className="border border-border/60">
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0088cc]/10 flex items-center justify-center flex-shrink-0">
                      <TelegramIcon className="w-5 h-5 text-[#0088cc]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">
                          {conn.bot_name ?? "Bot Telegram"}
                        </span>
                        {conn.bot_username && (
                          <span className="text-xs text-muted-foreground">@{conn.bot_username}</span>
                        )}
                        {conn.is_active ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5 py-0">
                            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Assistente: {conn.assistants?.name ?? (
                          <span className="text-amber-500">Nenhum configurado</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                    onClick={() => deleteMutation.mutate(conn.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <Card className="border border-border/40 bg-muted/30">
        <CardContent className="py-4 px-5">
          <div className="flex gap-3">
            <Bot className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Como funciona</p>
              <p className="text-xs text-muted-foreground">
                Quando alguém envia uma mensagem ao seu bot no Telegram, o assistente de IA responde automaticamente.
                A conversa aparece no <strong>Chat ao Vivo</strong> com badge "Telegram" — você pode assumir o controle a qualquer momento.
                Todos os contatos são salvos no <strong>CRM</strong> com fonte "telegram".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

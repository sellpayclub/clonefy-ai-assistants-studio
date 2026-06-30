import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Wallet, Copy, CheckCircle2, Loader2, Info, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApiWallet, LOW_BALANCE_THRESHOLD } from "@/hooks/useApiWallet";
import { toast } from "sonner";

// Mantém em sincronia com COST_PER_MESSAGE_BRL na edge function whatsapp-webhook
const COST_PER_MESSAGE_BRL = 0.1;
const MESSAGES_PER_CONVERSATION = 10;

const RECHARGE_OPTIONS = [55, 110, 220, 440, 880];

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface ChargeData {
  correlationID: string;
  brCode: string;
  qrCodeImage: string;
  amount: number;
}

const ApiBalance = () => {
  const { balance, isLow, isEmpty, loading, refetch } = useApiWallet();
  const [creating, setCreating] = useState<number | null>(null);
  const [charge, setCharge] = useState<ChargeData | null>(null);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const handleRecharge = async (amount: number) => {
    setCreating(amount);
    setPaid(false);
    try {
      const { data, error } = await supabase.functions.invoke("openpix-charge", {
        body: { action: "create", amount_brl: amount },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setCharge(data as ChargeData);
      startPolling((data as ChargeData).correlationID);
    } catch (e) {
      toast.error("Não foi possível gerar o PIX. Tente novamente.");
      console.error(e);
    } finally {
      setCreating(null);
    }
  };

  const startPolling = (correlationID: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.functions.invoke("openpix-charge", {
        body: { action: "check", correlationID },
      });
      if (data?.status === "paid") {
        stopPolling();
        setPaid(true);
        await refetch();
        toast.success("Pagamento confirmado! Saldo recarregado. 🎉");
      }
    }, 4000);
  };

  const handleCopy = async () => {
    if (!charge?.brCode) return;
    await navigator.clipboard.writeText(charge.brCode);
    setCopied(true);
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const closeDialog = () => {
    stopPolling();
    setCharge(null);
    setPaid(false);
  };

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6">
      <div className="flex items-center gap-3 sm:gap-4 mb-6">
        <SidebarTrigger />
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" /> Saldo de API
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
            Este é o saldo que mantém sua IA respondendo no WhatsApp.
          </p>
        </div>
      </div>

      {/* Card de saldo */}
      <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardDescription>Saldo atual</CardDescription>
          <CardTitle className="text-3xl sm:text-4xl font-bold">
            {loading ? "..." : formatBRL(balance)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && isEmpty && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive p-3 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Seu saldo acabou. Recarregue para continuar usando a IA sem
                interrupções. (O saldo é informativo e acumula a cada recarga.)
              </span>
            </div>
          )}
          {!loading && !isEmpty && isLow && (
            <div className="flex items-start gap-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Seu saldo está acabando. Considere recarregar em breve.</span>
            </div>
          )}
          {!loading && !isLow && (
            <p className="text-sm text-muted-foreground">
              Tudo certo! Seu saldo cobre aproximadamente{" "}
              <strong>
                {Math.floor(balance / COST_PER_MESSAGE_BRL).toLocaleString("pt-BR")}
              </strong>{" "}
              respostas da IA.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Opções de recarga */}
      <h2 className="text-lg font-semibold mb-3">Recarregar saldo</h2>
      <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground mb-4">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>
          Valores aproximados (modelo gpt-4o-mini). O consumo real pode variar um
          pouco. Mínimo recomendado: {formatBRL(55)}/mês para manter a IA ativa.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {RECHARGE_OPTIONS.map((amount) => {
          const messages = Math.floor(amount / COST_PER_MESSAGE_BRL);
          const conversations = Math.floor(messages / MESSAGES_PER_CONVERSATION);
          return (
            <Card key={amount} className="hover:shadow-elegant transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">{formatBRL(amount)}</CardTitle>
                <CardDescription>
                  ≈ {messages.toLocaleString("pt-BR")} respostas da IA
                  <br />
                  <span className="text-xs">
                    (~{conversations.toLocaleString("pt-BR")} conversas)
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => handleRecharge(amount)}
                  disabled={creating !== null}
                >
                  {creating === amount ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Recarregar via PIX"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog do PIX */}
      <Dialog open={!!charge} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {paid ? "Pagamento confirmado!" : `Pague ${charge ? formatBRL(charge.amount) : ""} via PIX`}
            </DialogTitle>
            <DialogDescription>
              {paid
                ? "Seu saldo já foi recarregado."
                : "Escaneie o QR Code ou copie a chave PIX abaixo."}
            </DialogDescription>
          </DialogHeader>

          {paid ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <Button className="w-full" onClick={closeDialog}>
                Fechar
              </Button>
            </div>
          ) : (
            charge && (
              <div className="flex flex-col items-center gap-4">
                {charge.qrCodeImage && (
                  <img
                    src={charge.qrCodeImage}
                    alt="QR Code PIX"
                    className="w-48 h-48 rounded-lg border bg-white p-2"
                  />
                )}
                <Button variant="outline" className="w-full" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" /> Copiar chave PIX (copia e cola)
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aguardando pagamento...
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default ApiBalance;

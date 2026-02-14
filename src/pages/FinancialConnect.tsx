import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ArrowLeft, QrCode, Smartphone, CheckCircle, RefreshCw, Loader2, Wallet } from "lucide-react";
import { useFinancialAccount, useUpdateFinancialAccount } from "@/hooks/useFinancialData";

export default function FinancialConnect() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: account, isLoading: loadingAccount } = useFinancialAccount();
  const updateAccount = useUpdateFinancialAccount();

  const [connecting, setConnecting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (account?.whatsapp_connected) setConnected(true);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [account]);

  const createInstance = async () => {
    if (!account) return;
    try {
      setConnecting(true);
      const supabaseUrl = "https://ekfkrwueqwpqakpsrsjt.supabase.co";
      const instanceName = `financial_${account.user_id.substring(0, 8)}`;

      const { data, error } = await supabase.functions.invoke("whatsapp-evolution", {
        body: {
          action: "createInstance",
          instanceName,
          webhookUrl: `${supabaseUrl}/functions/v1/financial-webhook`,
        },
      });

      if (error) throw error;
      if (!data?.instanceId) throw new Error("Falha ao criar instância");

      await updateAccount.mutateAsync({
        id: account.id,
        whatsapp_instance_name: instanceName,
      });

      await getQRCode(instanceName);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const getQRCode = useCallback(async (instName?: string) => {
    const name = instName || account?.whatsapp_instance_name;
    if (!name) return;

    try {
      setConnecting(true);
      const { data, error } = await supabase.functions.invoke("whatsapp-evolution", {
        body: { action: "getQRCode", instanceId: name },
      });

      if (error) throw error;
      if (data?.qrcode) {
        setQrCode(data.qrcode);
        startPolling(name);
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  }, [account]);

  const startPolling = (instName: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke("whatsapp-evolution", {
          body: { action: "getStatus", instanceId: instName },
        });
        if (data?.connected) {
          setConnected(true);
          setQrCode(null);
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;

          // Update account
          if (account) {
            await updateAccount.mutateAsync({
              id: account.id,
              whatsapp_connected: true,
              whatsapp_instance_name: instName,
            });
          }

          toast({ title: "Conectado!", description: "WhatsApp conectado ao Agente Financeiro." });
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);

    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 120000);
  };

  if (loadingAccount) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!account) {
    navigate("/financeiro");
    return null;
  }

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border p-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Button variant="ghost" onClick={() => navigate("/financeiro")} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Button>
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Conectar WhatsApp</h1>
            <p className="text-muted-foreground">Conecte seu agente financeiro ao WhatsApp</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-xl mx-auto">
          {connected ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">WhatsApp Conectado!</h2>
                <p className="text-muted-foreground mb-6">
                  Seu agente financeiro está pronto. Envie mensagens como "Gastei 50 no mercado" para começar!
                </p>
                <Button onClick={() => navigate("/financeiro")} className="bg-primary hover:bg-primary/90">
                  Ir para o Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : qrCode ? (
            <Card className="bg-card border-border">
              <CardHeader className="text-center">
                <CardTitle className="text-foreground">Escaneie o QR Code</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Abra o WhatsApp → Dispositivos Conectados → Escaneie o código
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl mb-6">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
                <Button onClick={() => getQRCode()} variant="outline" className="border-border text-foreground">
                  <RefreshCw className="w-4 h-4 mr-2" />Atualizar QR Code
                </Button>
                <p className="text-xs text-muted-foreground mt-4">O QR Code expira em 60 segundos</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-10 h-10 text-muted-foreground" />
                </div>
                <CardTitle className="text-foreground">Conectar WhatsApp</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Conecte seu WhatsApp ao agente financeiro para controlar finanças por mensagem
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-4 mb-6">
                  {[
                    'Clique em "Gerar QR Code"',
                    "Abra o WhatsApp no seu celular",
                    "Vá em Configurações → Dispositivos Conectados",
                    "Escaneie o QR Code",
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-left p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                        {i + 1}
                      </div>
                      <p className="text-foreground">{step}</p>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={account.whatsapp_instance_name ? () => getQRCode() : createInstance}
                  disabled={connecting}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {connecting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
                  ) : (
                    <><QrCode className="w-4 h-4 mr-2" />Gerar QR Code</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Plus, QrCode, Trash2, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface WhatsAppConnection {
  id: string;
  instance_name: string;
  instance_id: string;
  status: string;
  phone_number?: string;
  qr_code?: string;
  connected_at?: string;
  created_at: string;
}

const WhatsApp = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<WhatsAppConnection | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();

  // Form states
  const [instanceName, setInstanceName] = useState("");

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          window.location.href = '/auth';
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        window.location.href = '/auth';
        return;
      }
      
      loadConnections();
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadConnections = async () => {
    if (!session) return;

    try {
      const response = await supabase.functions.invoke('evolution-api', {
        body: { action: 'get_instances' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      setConnections(response.data.connections || []);
    } catch (error: any) {
      console.error('Error loading connections:', error);
      toast({
        title: "Erro ao carregar conexões",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    setFormLoading(true);

    try {
      const response = await supabase.functions.invoke('evolution-api', {
        body: { action: 'create_instance', instanceName },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Instância criada!",
        description: "Sua instância WhatsApp foi criada com sucesso.",
      });

      setIsCreateOpen(false);
      setInstanceName("");
      loadConnections();
    } catch (error: any) {
      console.error('Error creating instance:', error);
      toast({
        title: "Erro ao criar instância",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleGenerateQR = async (connection: WhatsAppConnection) => {
    if (!session) return;

    try {
      const response = await supabase.functions.invoke('evolution-api', {
        body: { action: 'generate_qr', instanceId: connection.instance_id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      setSelectedConnection({ ...connection, qr_code: response.data.base64 || response.data.qrcode });
      setQrDialogOpen(true);
      
      // Reload connections to get updated QR
      setTimeout(() => {
        loadConnections();
      }, 1000);
    } catch (error: any) {
      console.error('Error generating QR:', error);
      toast({
        title: "Erro ao gerar QR Code",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteInstance = async (connection: WhatsAppConnection) => {
    if (!session) return;
    
    if (!confirm(`Tem certeza que deseja excluir a instância "${connection.instance_name}"?`)) {
      return;
    }

    try {
      const response = await supabase.functions.invoke('evolution-api', {
        body: { action: 'delete_instance', instanceId: connection.instance_id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Instância excluída!",
        description: "A instância foi removida com sucesso.",
      });

      loadConnections();
    } catch (error: any) {
      console.error('Error deleting instance:', error);
      toast({
        title: "Erro ao excluir instância",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Conectado</Badge>;
      case 'connecting':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Conectando</Badge>;
      case 'created':
        return <Badge variant="outline"><QrCode className="h-3 w-3 mr-1" />Aguardando QR</Badge>;
      default:
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Desconectado</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Smartphone className="h-8 w-8 text-primary" />
                  WhatsApp
                </h1>
                <p className="text-muted-foreground">
                  Gerencie suas conexões WhatsApp via QR Code
                </p>
              </div>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conexão
            </Button>
          </div>

          {/* Connections Grid */}
          {connections.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma conexão criada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira conexão WhatsApp para começar a usar os assistentes
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Conexão
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map((connection) => (
                <Card key={connection.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <Smartphone className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{connection.instance_name}</CardTitle>
                          {connection.phone_number && (
                            <p className="text-sm text-muted-foreground">{connection.phone_number}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => loadConnections()}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteInstance(connection)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(connection.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {connection.status !== 'open' && (
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleGenerateQR(connection)}
                        >
                          <QrCode className="h-3 w-3 mr-1" />
                          Gerar QR Code
                        </Button>
                      )}
                      {connection.connected_at && (
                        <p className="text-xs text-muted-foreground">
                          Conectado em: {new Date(connection.connected_at).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create Instance Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
                <DialogDescription>
                  Crie uma nova instância para conectar um WhatsApp
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateInstance} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instanceName">Nome da Conexão</Label>
                  <Input
                    id="instanceName"
                    placeholder="Ex: Vendas, Suporte, Principal"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Escolha um nome descritivo para identificar esta conexão
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? "Criando..." : "Criar Conexão"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* QR Code Dialog */}
          <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Conectar WhatsApp</DialogTitle>
                <DialogDescription>
                  Escaneie o QR Code com seu WhatsApp
                </DialogDescription>
              </DialogHeader>
              
              {selectedConnection?.qr_code && (
                <div className="flex flex-col items-center space-y-4">
                  <img 
                    src={`data:image/png;base64,${selectedConnection.qr_code}`}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64 border rounded-lg"
                  />
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium">Como conectar:</p>
                    <ol className="text-xs text-muted-foreground space-y-1 text-left">
                      <li>1. Abra o WhatsApp no seu celular</li>
                      <li>2. Toque em Menu ⋮ &gt; Dispositivos conectados</li>
                      <li>3. Toque em "Conectar um dispositivo"</li>
                      <li>4. Escaneie este QR Code</li>
                    </ol>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => selectedConnection && handleGenerateQR(selectedConnection)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Gerar Novo QR
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default WhatsApp;
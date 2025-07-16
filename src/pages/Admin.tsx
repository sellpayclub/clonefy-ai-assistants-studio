import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Search, Save, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface UserQuota {
  user_id: string;
  email: string;
  max_assistants: number;
  max_whatsapp_connections: number;
  current_assistants: number;
  current_whatsapp_connections: number;
  plan_type: string;
  created_at: string;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserQuota[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editLimits, setEditLimits] = useState<{assistants: number, connections: number}>({assistants: 0, connections: 0});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Admin credentials
  const ADMIN_PASSWORD = "Danncarlos@123";

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({
        title: "Acesso liberado",
        description: "Bem-vindo ao painel admin!",
      });
    } else {
      toast({
        title: "Senha incorreta",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/auth');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro na inicialização:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]);

  const loadUsers = async () => {
    try {
      // Get all user quotas
      const { data: quotaData, error: quotaError } = await (supabase as any)
        .from('user_quotas')
        .select('*')
        .order('created_at', { ascending: false });

      if (quotaError) {
        throw quotaError;
      }

      console.log('Quotas encontradas:', quotaData?.length || 0);

      if (!quotaData || quotaData.length === 0) {
        console.log('Nenhuma quota encontrada');
        setUsers([]);
        return;
      }

      // Get additional user data for each quota
      const usersWithData = await Promise.all(
        quotaData.map(async (quota) => {
          try {
            // Try to get user email from auth metadata (won't work in client, but we'll try)
            // For now, we'll show a shortened user ID
            const userDisplayId = quota.user_id.substring(0, 8) + '...';
            
            // Get current usage
            const [assistantsResult, connectionsResult] = await Promise.all([
              supabase
                .from('assistants')
                .select('id')
                .eq('user_id', quota.user_id),
              supabase
                .from('whatsapp_connections')
                .select('id')
                .eq('user_id', quota.user_id)
            ]);

            const currentAssistants = assistantsResult.data?.length || 0;
            const currentConnections = connectionsResult.data?.length || 0;

            console.log(`User ${userDisplayId}: ${currentAssistants}/${quota.max_assistants} agentes, ${currentConnections}/${quota.max_whatsapp_connections} conexões`);

            return {
              ...quota,
              email: userDisplayId,
              current_assistants: currentAssistants,
              current_whatsapp_connections: currentConnections,
            };
          } catch (error) {
            console.error('Erro ao buscar dados do usuário:', quota.user_id, error);
            return {
              ...quota,
              email: quota.user_id.substring(0, 8) + '...',
              current_assistants: 0,
              current_whatsapp_connections: 0,
            };
          }
        })
      );

      console.log('Usuários processados:', usersWithData.length);
      setUsers(usersWithData);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateUserLimits = async (userId: string, assistants: number, connections: number) => {
    try {
      const { error } = await (supabase as any)
        .from('user_quotas')
        .update({
          max_assistants: assistants,
          max_whatsapp_connections: connections,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: "Limites atualizados!",
        description: "Os novos limites foram salvos com sucesso.",
      });

      setEditingUserId(null);
      await loadUsers();
    } catch (error: any) {
      console.error('Error updating limits:', error);
      toast({
        title: "Erro ao atualizar limites",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEditing = (user: UserQuota) => {
    setEditingUserId(user.user_id);
    setEditLimits({
      assistants: user.max_assistants,
      connections: user.max_whatsapp_connections,
    });
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Settings className="h-6 w-6" />
              Acesso Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Senha de Acesso</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha admin"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Acessar Painel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Settings className="h-6 md:h-8 w-6 md:w-8 text-primary" />
                  Painel Admin
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Gerencie limites de usuários do sistema
                </p>
              </div>
            </div>
            <Button onClick={loadUsers} variant="outline" className="self-start md:self-auto">
              Recarregar
            </Button>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Buscar por email ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* Users Table - Desktop / Cards - Mobile */}
          <Card>
            <CardHeader>
              <CardTitle>Usuários e Limites ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <div className="min-w-[700px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Usuário</TableHead>
                        <TableHead className="min-w-[80px]">Plano</TableHead>
                        <TableHead className="min-w-[120px]">Agentes</TableHead>
                        <TableHead className="min-w-[140px]">Conexões WhatsApp</TableHead>
                        <TableHead className="min-w-[120px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.email}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {user.user_id.substring(0, 8)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.plan_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {editingUserId === user.user_id ? (
                              <Input
                                type="number"
                                min="0"
                                value={editLimits.assistants}
                                onChange={(e) => setEditLimits(prev => ({
                                  ...prev,
                                  assistants: parseInt(e.target.value) || 0
                                }))}
                                className="w-20"
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={user.current_assistants >= user.max_assistants ? "text-red-600 font-medium" : ""}>
                                  {user.current_assistants}/{user.max_assistants}
                                </span>
                                {user.current_assistants >= user.max_assistants && (
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingUserId === user.user_id ? (
                              <Input
                                type="number"
                                min="0"
                                value={editLimits.connections}
                                onChange={(e) => setEditLimits(prev => ({
                                  ...prev,
                                  connections: parseInt(e.target.value) || 0
                                }))}
                                className="w-20"
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={user.current_whatsapp_connections >= user.max_whatsapp_connections ? "text-red-600 font-medium" : ""}>
                                  {user.current_whatsapp_connections}/{user.max_whatsapp_connections}
                                </span>
                                {user.current_whatsapp_connections >= user.max_whatsapp_connections && (
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingUserId === user.user_id ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => updateUserLimits(user.user_id, editLimits.assistants, editLimits.connections)}
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  Salvar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingUserId(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditing(user)}
                              >
                                <Settings className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden space-y-4">
                {filteredUsers.map((user) => (
                  <Card key={user.user_id} className="border border-border/40">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* User Info */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-sm">{user.email}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {user.user_id.substring(0, 8)}...
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">{user.plan_type}</Badge>
                        </div>
                        
                        {/* Limits */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-xs text-muted-foreground">Agentes</Label>
                            {editingUserId === user.user_id ? (
                              <Input
                                type="number"
                                min="0"
                                value={editLimits.assistants}
                                onChange={(e) => setEditLimits(prev => ({
                                  ...prev,
                                  assistants: parseInt(e.target.value) || 0
                                }))}
                                className="h-8 text-sm"
                              />
                            ) : (
                              <div className="flex items-center gap-1 mt-1">
                                <span className={user.current_assistants >= user.max_assistants ? "text-red-600 font-medium" : ""}>
                                  {user.current_assistants}/{user.max_assistants}
                                </span>
                                {user.current_assistants >= user.max_assistants && (
                                  <AlertCircle className="h-3 w-3 text-red-600" />
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Conexões</Label>
                            {editingUserId === user.user_id ? (
                              <Input
                                type="number"
                                min="0"
                                value={editLimits.connections}
                                onChange={(e) => setEditLimits(prev => ({
                                  ...prev,
                                  connections: parseInt(e.target.value) || 0
                                }))}
                                className="h-8 text-sm"
                              />
                            ) : (
                              <div className="flex items-center gap-1 mt-1">
                                <span className={user.current_whatsapp_connections >= user.max_whatsapp_connections ? "text-red-600 font-medium" : ""}>
                                  {user.current_whatsapp_connections}/{user.max_whatsapp_connections}
                                </span>
                                {user.current_whatsapp_connections >= user.max_whatsapp_connections && (
                                  <AlertCircle className="h-3 w-3 text-red-600" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="pt-2 border-t border-border/40">
                          {editingUserId === user.user_id ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateUserLimits(user.user_id, editLimits.assistants, editLimits.connections)}
                                className="flex-1"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingUserId(null)}
                                className="flex-1"
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(user)}
                              className="w-full"
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Editar Limites
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
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
      // Get all user quotas with email from auth.users
      const { data, error } = await (supabase as any)
        .from('user_quotas')
        .select(`
          user_id,
          max_assistants,
          max_whatsapp_connections,
          plan_type,
          created_at
        `);

      if (error) {
        throw error;
      }

      // Get additional user data
      const usersWithData = await Promise.all(
        (data || []).map(async (quota) => {
          // Get user email from profiles or auth metadata
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', quota.user_id)
            .single();

          // Get current usage
          const { data: assistants } = await supabase
            .from('assistants')
            .select('id')
            .eq('user_id', quota.user_id);

          const { data: connections } = await supabase
            .from('whatsapp_connections')
            .select('id')
            .eq('user_id', quota.user_id);

          // For demo purposes, we'll show user_id as email (you might want to get actual email)
          return {
            ...quota,
            email: quota.user_id.substring(0, 8) + '...', // Simplified for demo
            current_assistants: assistants?.length || 0,
            current_whatsapp_connections: connections?.length || 0,
          };
        })
      );

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
        
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Settings className="h-8 w-8 text-primary" />
                  Painel Admin
                </h1>
                <p className="text-muted-foreground">
                  Gerencie limites de usuários do sistema
                </p>
              </div>
            </div>
            <Button onClick={loadUsers} variant="outline">
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

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Usuários e Limites ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Agentes</TableHead>
                    <TableHead>Conexões WhatsApp</TableHead>
                    <TableHead>Ações</TableHead>
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
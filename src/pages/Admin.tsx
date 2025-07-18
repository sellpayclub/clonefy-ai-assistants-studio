import { useState, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Search, Save, AlertCircle, Mail, Plus, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";

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

interface AuthorizedEmail {
  id: string;
  email: string;
  added_by: string | null;
  added_at: string;
  notes: string | null;
}

interface GlobalStats {
  total_assistants: number;
  total_connections: number;
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
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Estados para emails autorizados
  const [authorizedEmails, setAuthorizedEmails] = useState<AuthorizedEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newEmailNotes, setNewEmailNotes] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Estados para estatísticas globais
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ total_assistants: 0, total_connections: 0 });

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
      loadAuthorizedEmails();
    }
  }, [isAuthenticated]);

  // Carregar stats após usuários serem carregados
  useEffect(() => {
    if (users.length > 0) {
      loadGlobalStats();
    }
  }, [users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Usar a nova função que retorna emails
      const { data: usersData, error } = await supabase
        .rpc('get_user_usage_stats');

      if (error) {
        throw error;
      }

      // Mapear dados para o formato esperado
      const formattedUsers = (usersData || []).map((user: any) => ({
        user_id: user.user_id,
        email: user.user_email || 'Email não encontrado',
        max_assistants: user.max_assistants,
        max_whatsapp_connections: user.max_whatsapp_connections,
        current_assistants: user.current_assistants,
        current_whatsapp_connections: user.current_whatsapp_connections,
        plan_type: user.plan_type,
        created_at: user.created_at,
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAuthorizedEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('authorized_emails')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) throw error;

      setAuthorizedEmails(data || []);
    } catch (error: any) {
      console.error('Error loading authorized emails:', error);
      toast({
        title: "Erro ao carregar emails",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addAuthorizedEmail = async () => {
    if (!newEmail.trim()) return;

    setEmailLoading(true);
    try {
      const { error } = await supabase
        .from('authorized_emails')
        .insert({
          email: newEmail.toLowerCase().trim(),
          notes: newEmailNotes.trim() || null,
          added_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Email adicionado!",
        description: `${newEmail} foi autorizado a criar conta.`,
      });

      setNewEmail("");
      setNewEmailNotes("");
      await loadAuthorizedEmails();
    } catch (error: any) {
      console.error('Error adding email:', error);
      toast({
        title: "Erro ao adicionar email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const loadGlobalStats = async () => {
    try {
      // Calcular totais somando dados de todos os usuários
      const totalAssistants = users.reduce((sum, user) => sum + user.current_assistants, 0);
      const totalConnections = users.reduce((sum, user) => sum + user.current_whatsapp_connections, 0);

      setGlobalStats({
        total_assistants: totalAssistants,
        total_connections: totalConnections
      });
    } catch (error: any) {
      console.error('Error loading global stats:', error);
      toast({
        title: "Erro ao carregar estatísticas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeAuthorizedEmail = async (emailId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('authorized_emails')
        .delete()
        .eq('id', emailId);

      if (error) throw error;

      toast({
        title: "Email removido!",
        description: `${email} não pode mais criar conta.`,
      });

      await loadAuthorizedEmails();
    } catch (error: any) {
      console.error('Error removing email:', error);
      toast({
        title: "Erro ao remover email",
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
          <p>{t('common.loading')}</p>
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
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Estatísticas Globais */}
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{globalStats.total_assistants}</div>
                    <div className="text-sm text-muted-foreground">{t('admin.totalAgents')}</div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{globalStats.total_connections}</div>
                    <div className="text-sm text-muted-foreground">Conexões Ativas</div>
                  </div>
                </Card>
              </div>
              
              <Button onClick={() => { loadUsers(); loadGlobalStats(); }} variant="outline" className="self-start md:self-auto">
                Recarregar
              </Button>
            </div>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuários ({filteredUsers.length})
              </TabsTrigger>
              <TabsTrigger value="emails" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Emails Autorizados ({authorizedEmails.length})
              </TabsTrigger>
            </TabsList>

            {/* Aba de Usuários */}
            <TabsContent value="users" className="space-y-6">
              {/* Search */}
              <Card>
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
                        <TableHead className="min-w-[120px]">{t('admin.agents')}</TableHead>
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
                                {t('admin.edit')}
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
                            <Label className="text-xs text-muted-foreground">{t('admin.agents')}</Label>
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
                              {t('admin.editLimits')}
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
          </TabsContent>

          {/* Aba de Emails Autorizados */}
          <TabsContent value="emails" className="space-y-6">
            {/* Adicionar novo email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Adicionar Email Autorizado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="newEmail">Email</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      placeholder="cliente@empresa.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newEmailNotes">Notas (opcional)</Label>
                    <Input
                      id="newEmailNotes"
                      placeholder="Ex: João da Silva"
                      value={newEmailNotes}
                      onChange={(e) => setNewEmailNotes(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={addAuthorizedEmail}
                  disabled={!newEmail.trim() || emailLoading}
                  className="w-full md:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {emailLoading ? "Adicionando..." : "Adicionar Email"}
                </Button>
              </CardContent>
            </Card>

            {/* Lista de emails autorizados */}
            <Card>
              <CardHeader>
                <CardTitle>Emails Autorizados ({authorizedEmails.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {authorizedEmails.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum email autorizado ainda</p>
                    <p className="text-sm">Adicione emails para permitir cadastros</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {authorizedEmails.map((emailData) => (
                      <div 
                        key={emailData.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{emailData.email}</div>
                          {emailData.notes && (
                            <div className="text-sm text-muted-foreground">{emailData.notes}</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Adicionado em {new Date(emailData.added_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeAuthorizedEmail(emailData.id, emailData.email)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default memo(Admin);
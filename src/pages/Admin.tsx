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
import { Settings, Search, Save, AlertCircle, Mail, Plus, Trash2, Users, BarChart3, MessageSquare, Bot, Plug, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminData } from "@/hooks/useAdminData";

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

  const [authorizedEmails, setAuthorizedEmails] = useState<AuthorizedEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newEmailNotes, setNewEmailNotes] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Admin global data
  const adminData = useAdminData();
  const [leadFilterUser, setLeadFilterUser] = useState<string>("");
  const [sessionFilterUser, setSessionFilterUser] = useState<string>("");

  const ADMIN_PASSWORD = "Danncarlos@123";

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({ title: "Acesso liberado", description: "Bem-vindo ao painel admin!" });
    } else {
      toast({ title: "Senha incorreta", description: "Tente novamente.", variant: "destructive" });
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) { navigate('/auth'); return; }
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
      adminData.loadAll();
    }
  }, [isAuthenticated]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data: usersData, error } = await supabase.rpc('get_user_usage_stats');
      if (error) throw error;
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
      toast({ title: "Erro ao carregar usuários", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadAuthorizedEmails = async () => {
    try {
      const { data, error } = await supabase.from('authorized_emails').select('*').order('added_at', { ascending: false });
      if (error) throw error;
      setAuthorizedEmails(data || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar emails", description: error.message, variant: "destructive" });
    }
  };

  const addAuthorizedEmail = async () => {
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    try {
      const { error } = await supabase.from('authorized_emails').insert({
        email: newEmail.toLowerCase().trim(),
        notes: newEmailNotes.trim() || null,
        added_by: user?.id
      });
      if (error) throw error;
      toast({ title: "Email adicionado!", description: `${newEmail} foi autorizado a criar conta.` });
      setNewEmail("");
      setNewEmailNotes("");
      await loadAuthorizedEmails();
    } catch (error: any) {
      toast({ title: "Erro ao adicionar email", description: error.message, variant: "destructive" });
    } finally {
      setEmailLoading(false);
    }
  };

  const removeAuthorizedEmail = async (emailId: string, email: string) => {
    try {
      const { error } = await supabase.from('authorized_emails').delete().eq('id', emailId);
      if (error) throw error;
      toast({ title: "Email removido!", description: `${email} não pode mais criar conta.` });
      await loadAuthorizedEmails();
    } catch (error: any) {
      toast({ title: "Erro ao remover email", description: error.message, variant: "destructive" });
    }
  };

  const updateUserLimits = async (userId: string, assistants: number, connections: number) => {
    try {
      const { error } = await (supabase as any).from('user_quotas').update({
        max_assistants: assistants,
        max_whatsapp_connections: connections,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);
      if (error) throw error;
      toast({ title: "Limites atualizados!", description: "Os novos limites foram salvos com sucesso." });
      setEditingUserId(null);
      await loadUsers();
    } catch (error: any) {
      toast({ title: "Erro ao atualizar limites", description: error.message, variant: "destructive" });
    }
  };

  const startEditing = (user: UserQuota) => {
    setEditingUserId(user.user_id);
    setEditLimits({ assistants: user.max_assistants, connections: user.max_whatsapp_connections });
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Unique user emails from leads for filter dropdown
  const uniqueLeadUsers = Array.from(new Set(adminData.leads.map(l => l.user_email))).filter(Boolean);
  const uniqueSessionUsers = Array.from(new Set(adminData.sessions.map(s => s.user_email))).filter(Boolean);
  const filteredSessions = sessionFilterUser
    ? adminData.sessions.filter(s => s.user_id === sessionFilterUser)
    : adminData.sessions;

  if (loading && !isAuthenticated) {
    return (
      <main className="flex-1 p-4 md:p-6">
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
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
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Settings className="h-6 md:h-8 w-6 md:w-8 text-primary" />
                Painel Admin
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Controle global da plataforma
              </p>
            </div>
          </div>
          <Button onClick={() => { loadUsers(); adminData.loadAll(); }} variant="outline">
            Recarregar
          </Button>
        </div>

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="global" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Painel Global</span>
              <span className="sm:hidden">Global</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários ({filteredUsers.length})</span>
              <span className="sm:hidden">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Emails ({authorizedEmails.length})</span>
              <span className="sm:hidden">Emails</span>
            </TabsTrigger>
          </TabsList>

          {/* ===== PAINEL GLOBAL ===== */}
          <TabsContent value="global" className="space-y-6">
            {adminData.error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">Erro ao carregar dados globais: {adminData.error}</span>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <UserCheck className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-3xl font-bold">{adminData.stats?.total_users ?? '—'}</div>
                  <div className="text-sm text-muted-foreground">Usuários</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-3xl font-bold">{adminData.stats?.total_leads ?? '—'}</div>
                  <div className="text-sm text-muted-foreground">Leads CRM</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-3xl font-bold">{adminData.stats?.active_sessions ?? '—'}</div>
                  <div className="text-sm text-muted-foreground">Sessões Ativas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Plug className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <div className="text-3xl font-bold">{adminData.stats?.total_connections ?? '—'}</div>
                  <div className="text-sm text-muted-foreground">Conexões</div>
                </CardContent>
              </Card>
              <Card className="col-span-2 md:col-span-1">
                <CardContent className="p-4 text-center">
                  <Bot className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <div className="text-3xl font-bold">{adminData.stats?.total_assistants ?? '—'}</div>
                  <div className="text-sm text-muted-foreground">Assistentes</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Leads */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Leads Recentes (Todos os Usuários)
                  </CardTitle>
                  <select
                    className="bg-background border border-border rounded-md px-3 py-1.5 text-sm"
                    value={leadFilterUser}
                    onChange={(e) => {
                      setLeadFilterUser(e.target.value);
                      adminData.loadLeads(e.target.value || undefined);
                    }}
                  >
                    <option value="">Todos os usuários</option>
                    {uniqueLeadUsers.map(email => (
                      <option key={email} value={adminData.leads.find(l => l.user_email === email)?.user_id || ''}>
                        {email}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {adminData.loading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : adminData.leads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Nenhum lead encontrado</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dono</TableHead>
                          <TableHead>Lead</TableHead>
                          <TableHead>WhatsApp</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Fonte</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Última Interação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adminData.leads.slice(0, 50).map((lead) => (
                          <TableRow key={lead.id}>
                            <TableCell>
                              <div className="text-xs text-muted-foreground max-w-[150px] truncate">{lead.user_email}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{lead.name || '—'}</div>
                              {lead.company && <div className="text-xs text-muted-foreground">{lead.company}</div>}
                            </TableCell>
                            <TableCell className="text-sm">{lead.whatsapp_number}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{lead.status || 'new'}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{lead.source || '—'}</TableCell>
                            <TableCell>
                              {lead.lead_score != null ? (
                                <Badge variant={lead.lead_score >= 70 ? "default" : "secondary"} className="text-xs">
                                  {lead.lead_score}
                                </Badge>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {lead.last_interaction ? new Date(lead.last_interaction).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {adminData.leads.length > 50 && (
                      <div className="text-center text-sm text-muted-foreground mt-2">
                        Mostrando 50 de {adminData.leads.length} leads
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Sessões de Chat ao Vivo
                  </CardTitle>
                  <select
                    className="bg-background border border-border rounded-md px-3 py-1.5 text-sm"
                    value={sessionFilterUser}
                    onChange={(e) => setSessionFilterUser(e.target.value)}
                  >
                    <option value="">Todos os usuários</option>
                    {uniqueSessionUsers.map(email => (
                      <option key={email} value={adminData.sessions.find(s => s.user_email === email)?.user_id || ''}>
                        {email}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Nenhuma sessão encontrada</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dono</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Instância</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Última Msg</TableHead>
                          <TableHead>Não Lidas</TableHead>
                          <TableHead>Criado em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSessions.slice(0, 50).map((sess) => (
                          <TableRow key={sess.id}>
                            <TableCell>
                              <div className="text-xs text-muted-foreground max-w-[150px] truncate">{sess.user_email}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{sess.contact_name || sess.contact_number}</div>
                              <div className="text-xs text-muted-foreground">{sess.contact_number}</div>
                            </TableCell>
                            <TableCell className="text-sm">{sess.instance_name}</TableCell>
                            <TableCell>
                              <Badge variant={sess.status === 'human_takeover' ? 'default' : 'secondary'} className="text-xs">
                                {sess.status === 'human_takeover' ? 'Humano' : sess.status === 'ai_active' ? 'IA' : sess.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate">
                              {sess.last_message_preview || '—'}
                            </TableCell>
                            <TableCell>
                              {sess.unread_count > 0 ? (
                                <Badge className="text-xs">{sess.unread_count}</Badge>
                              ) : '0'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {sess.created_at ? new Date(sess.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {filteredSessions.length > 50 && (
                      <div className="text-center text-sm text-muted-foreground mt-2">
                        Mostrando 50 de {filteredSessions.length} sessões
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== USUÁRIOS ===== */}
          <TabsContent value="users" className="space-y-6">
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

            <Card>
              <CardHeader>
                <CardTitle>Usuários e Limites ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
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
                                <div className="text-sm text-muted-foreground">ID: {user.user_id.substring(0, 8)}...</div>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="secondary">{user.plan_type}</Badge></TableCell>
                            <TableCell>
                              {editingUserId === user.user_id ? (
                                <Input type="number" min="0" value={editLimits.assistants}
                                  onChange={(e) => setEditLimits(prev => ({ ...prev, assistants: parseInt(e.target.value) || 0 }))}
                                  className="w-20" />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className={user.current_assistants >= user.max_assistants ? "text-red-600 font-medium" : ""}>
                                    {user.current_assistants}/{user.max_assistants}
                                  </span>
                                  {user.current_assistants >= user.max_assistants && <AlertCircle className="h-4 w-4 text-red-600" />}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingUserId === user.user_id ? (
                                <Input type="number" min="0" value={editLimits.connections}
                                  onChange={(e) => setEditLimits(prev => ({ ...prev, connections: parseInt(e.target.value) || 0 }))}
                                  className="w-20" />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className={user.current_whatsapp_connections >= user.max_whatsapp_connections ? "text-red-600 font-medium" : ""}>
                                    {user.current_whatsapp_connections}/{user.max_whatsapp_connections}
                                  </span>
                                  {user.current_whatsapp_connections >= user.max_whatsapp_connections && <AlertCircle className="h-4 w-4 text-red-600" />}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingUserId === user.user_id ? (
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => updateUserLimits(user.user_id, editLimits.assistants, editLimits.connections)}>
                                    <Save className="h-3 w-3 mr-1" /> Salvar
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingUserId(null)}>Cancelar</Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => startEditing(user)}>
                                  <Settings className="h-3 w-3 mr-1" /> {t('admin.edit')}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden space-y-4">
                  {filteredUsers.map((user) => (
                    <Card key={user.user_id} className="border border-border/40">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-sm">{user.email}</div>
                            <div className="text-xs text-muted-foreground">ID: {user.user_id.substring(0, 8)}...</div>
                          </div>
                          <Badge variant="secondary" className="text-xs">{user.plan_type}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-xs text-muted-foreground">{t('admin.agents')}</Label>
                            <div className="flex items-center gap-1 mt-1">
                              <span className={user.current_assistants >= user.max_assistants ? "text-red-600 font-medium" : ""}>
                                {user.current_assistants}/{user.max_assistants}
                              </span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Conexões</Label>
                            <div className="flex items-center gap-1 mt-1">
                              <span className={user.current_whatsapp_connections >= user.max_whatsapp_connections ? "text-red-600 font-medium" : ""}>
                                {user.current_whatsapp_connections}/{user.max_whatsapp_connections}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-border/40">
                          <Button size="sm" variant="outline" onClick={() => startEditing(user)} className="w-full">
                            <Settings className="h-3 w-3 mr-1" /> {t('admin.editLimits')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== EMAILS ===== */}
          <TabsContent value="emails" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" /> Adicionar Email Autorizado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="newEmail">Email</Label>
                    <Input id="newEmail" type="email" placeholder="cliente@empresa.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="newEmailNotes">Notas (opcional)</Label>
                    <Input id="newEmailNotes" placeholder="Ex: João da Silva" value={newEmailNotes} onChange={(e) => setNewEmailNotes(e.target.value)} />
                  </div>
                </div>
                <Button onClick={addAuthorizedEmail} disabled={!newEmail.trim() || emailLoading} className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" /> {emailLoading ? "Adicionando..." : "Adicionar Email"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emails Autorizados ({authorizedEmails.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {authorizedEmails.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum email autorizado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {authorizedEmails.map((emailData) => (
                      <div key={emailData.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{emailData.email}</div>
                          {emailData.notes && <div className="text-sm text-muted-foreground">{emailData.notes}</div>}
                          <div className="text-xs text-muted-foreground">
                            Adicionado em {new Date(emailData.added_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => removeAuthorizedEmail(emailData.id, emailData.email)} className="text-red-600 hover:text-red-700">
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
      </div>
    </main>
  );
};

export default memo(Admin);

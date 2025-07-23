import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle, XCircle, Edit3, Plus, Settings, Link } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useCalendar, type Appointment } from "@/hooks/useCalendar";
import { useAssistants } from "@/hooks/useAssistants";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

const CalendarPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showGoogleIntegrationDialog, setShowGoogleIntegrationDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointmentType, setAppointmentType] = useState<'client' | 'block'>('client');
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  
  // Form states
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [description, setDescription] = useState("");
  const [blockReason, setBlockReason] = useState("");
  
  // Settings states
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("18:00");
  const [workingDays, setWorkingDays] = useState([1, 2, 3, 4, 5]); // Monday to Friday
  const [slotDuration, setSlotDuration] = useState(30);
  const [bufferTime, setBufferTime] = useState(0);
  const [timezone, setTimezone] = useState("America/Sao_Paulo");

  const { 
    loading: calendarLoading,
    createAppointment,
    listAppointments,
    cancelAppointment,
    rescheduleAppointment,
    updateAppointment,
    updateCalendarSettings,
    getCalendarSettings,
  } = useCalendar();

  const { assistants, loading: assistantsLoading } = useAssistants(session);

  // Check authentication and set session
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      } else {
        setSession(session);
      }
    };
    checkAuth();
  }, [navigate]);

  // Load appointments when date or assistant changes
  useEffect(() => {
    if (selectedAssistant) {
      loadAppointments();
    }
  }, [selectedDate, selectedAssistant]);

  // Load calendar settings when assistant changes
  useEffect(() => {
    if (selectedAssistant) {
      loadCalendarSettings();
      checkGoogleCalendarConnection();
    }
  }, [selectedAssistant]);

  const loadAppointments = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const appointmentsList = await listAppointments({
      assistant_id: selectedAssistant,
      date: dateStr
    });
    setAppointments(appointmentsList);
  };

  const loadCalendarSettings = async () => {
    const settings = await getCalendarSettings(selectedAssistant);
    if (settings) {
      setWorkingHoursStart(settings.working_hours_start);
      setWorkingHoursEnd(settings.working_hours_end);
      setWorkingDays(settings.working_days);
      setSlotDuration(settings.slot_duration);
      setBufferTime(settings.buffer_time);
      setTimezone(settings.timezone);
    }
  };

  const checkGoogleCalendarConnection = async () => {
    if (!session || !selectedAssistant) return;
    
    try {
      const { data } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('assistant_id', selectedAssistant)
        .eq('provider', 'google')
        .eq('is_active', true)
        .single();
      
      setGoogleCalendarConnected(!!data);
    } catch (error) {
      setGoogleCalendarConnected(false);
    }
  };

  const handleGoogleCalendarConnect = async () => {
    if (!selectedAssistant) return;

    try {
      const response = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'get_auth_url',
          assistant_id: selectedAssistant
        }
      });

      if (response.error) {
        toast({
          title: "Erro",
          description: response.error.message || "Erro ao conectar Google Calendar",
          variant: "destructive",
        });
        return;
      }

      // Redirect to Google OAuth
      window.open(response.data.auth_url, '_blank');
      
      toast({
        title: "Google Calendar",
        description: "Complete a autorização na nova janela para conectar sua conta",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao conectar Google Calendar",
        variant: "destructive",
      });
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedAssistant || !appointmentTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o horário",
        variant: "destructive",
      });
      return;
    }

    // Validate fields based on appointment type
    if (appointmentType === 'client' && (!clientName || !clientPhone)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e telefone do cliente",
        variant: "destructive",
      });
      return;
    }

    if (appointmentType === 'block' && !blockReason) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe o motivo do bloqueio",
        variant: "destructive",
      });
      return;
    }

    try {
      await createAppointment({
        assistant_id: selectedAssistant,
        client_name: appointmentType === 'client' ? clientName : `BLOQUEADO - ${blockReason}`,
        client_phone: appointmentType === 'client' ? clientPhone : 'SISTEMA',
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: appointmentTime,
        duration,
        description: appointmentType === 'client' ? description : `Horário bloqueado: ${blockReason}`
      });

      setShowCreateDialog(false);
      resetForm();
      loadAppointments();
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleUpdateAppointment = async (appointmentId: string, status: string) => {
    try {
      await updateAppointment(appointmentId, { status });
      loadAppointments();
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) {
      return;
    }

    try {
      await cancelAppointment(appointmentId);
      loadAppointments();
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedAssistant) {
      toast({
        title: "Selecione um agente",
        description: "Selecione um agente para configurar o calendário",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateCalendarSettings({
        assistant_id: selectedAssistant,
        working_hours_start: workingHoursStart,
        working_hours_end: workingHoursEnd,
        working_days: workingDays,
        slot_duration: slotDuration,
        buffer_time: bufferTime,
        timezone
      });

      setShowSettingsDialog(false);
    } catch (error) {
      // Error already handled by hook
    }
  };

  const resetForm = () => {
    setClientName("");
    setClientPhone("");
    setAppointmentTime("");
    setDuration(30);
    setDescription("");
    setBlockReason("");
    setAppointmentType('client');
    setEditingAppointment(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { label: "Agendado", variant: "default" as const },
      completed: { label: "Concluído", variant: "secondary" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
      rescheduled: { label: "Reagendado", variant: "outline" as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.scheduled;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const weekDays = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Segunda" },
    { value: 2, label: "Terça" },
    { value: 3, label: "Quarta" },
    { value: 4, label: "Quinta" },
    { value: 5, label: "Sexta" },
    { value: 6, label: "Sábado" }
  ];

  if (assistantsLoading) {
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
                  <CalendarIcon className="h-8 w-8 text-primary" />
                  Calendário
                </h1>
                <p className="text-muted-foreground">
                  Gerencie agendamentos dos seus agentes
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={showGoogleIntegrationDialog} onOpenChange={setShowGoogleIntegrationDialog}>
                <DialogTrigger asChild>
                  <Button variant={googleCalendarConnected ? "default" : "outline"} disabled={!selectedAssistant}>
                    <Link className="h-4 w-4 mr-2" />
                    {googleCalendarConnected ? 'Google ✓' : 'Google'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Integração Google Calendar</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!googleCalendarConnected ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Conecte sua conta Google para sincronizar automaticamente seus agendamentos com o Google Calendar.
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-950/10 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Benefícios:</h4>
                          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• Agendamentos aparecem no seu Google Calendar</li>
                            <li>• Lembretes automáticos no seu celular</li>
                            <li>• Sincronização em tempo real</li>
                            <li>• Backup seguro na nuvem</li>
                          </ul>
                        </div>
                        <Button onClick={handleGoogleCalendarConnect} className="w-full">
                          Conectar Google Calendar
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span>Google Calendar conectado com sucesso!</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Seus agendamentos estão sendo sincronizados automaticamente.
                        </p>
                        <Button variant="destructive" className="w-full">
                          Desconectar
                        </Button>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" disabled={!selectedAssistant}>
                <Link className="h-4 w-4 mr-2" />
                Apple
              </Button>

              <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!selectedAssistant}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Configurações do Calendário</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Início do expediente</Label>
                        <Input
                          type="time"
                          value={workingHoursStart}
                          onChange={(e) => setWorkingHoursStart(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Fim do expediente</Label>
                        <Input
                          type="time"
                          value={workingHoursEnd}
                          onChange={(e) => setWorkingHoursEnd(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Dias de trabalho</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {weekDays.map((day) => (
                          <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${day.value}`}
                              checked={workingDays.includes(day.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setWorkingDays([...workingDays, day.value]);
                                } else {
                                  setWorkingDays(workingDays.filter(d => d !== day.value));
                                }
                              }}
                            />
                            <Label htmlFor={`day-${day.value}`} className="text-sm">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Duração do slot (min)</Label>
                        <Input
                          type="number"
                          value={slotDuration}
                          onChange={(e) => setSlotDuration(Number(e.target.value))}
                          min="15"
                          max="120"
                          step="15"
                        />
                      </div>
                      <div>
                        <Label>Tempo de buffer (min)</Label>
                        <Input
                          type="number"
                          value={bufferTime}
                          onChange={(e) => setBufferTime(Number(e.target.value))}
                          min="0"
                          max="60"
                          step="5"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={handleSaveSettings} className="w-full">
                      Salvar Configurações
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button disabled={!selectedAssistant}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Agendamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Gerenciar Horários</DialogTitle>
                  </DialogHeader>
                  
                  <Tabs value={appointmentType} onValueChange={(value) => setAppointmentType(value as 'client' | 'block')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="client">Cliente</TabsTrigger>
                      <TabsTrigger value="block">Bloquear</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="client" className="space-y-4 mt-4">
                      <div>
                        <Label>Nome do cliente</Label>
                        <Input
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <Label>Telefone</Label>
                        <Input
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Horário</Label>
                          <Input
                            type="time"
                            value={appointmentTime}
                            onChange={(e) => setAppointmentTime(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Duração (min)</Label>
                          <Input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            min="15"
                            max="240"
                            step="15"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Descrição (opcional)</Label>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Detalhes do agendamento"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="block" className="space-y-4 mt-4">
                      <div>
                        <Label>Motivo do bloqueio</Label>
                        <Select value={blockReason} onValueChange={setBlockReason}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o motivo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Almoço">Horário de Almoço</SelectItem>
                            <SelectItem value="Reunião">Reunião</SelectItem>
                            <SelectItem value="Compromisso Pessoal">Compromisso Pessoal</SelectItem>
                            <SelectItem value="Indisponível">Indisponível</SelectItem>
                            <SelectItem value="Feriado">Feriado</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Horário</Label>
                          <Input
                            type="time"
                            value={appointmentTime}
                            onChange={(e) => setAppointmentTime(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Duração (min)</Label>
                          <Input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            min="15"
                            max="240"
                            step="15"
                          />
                        </div>
                      </div>
                      {blockReason === 'Outro' && (
                        <div>
                          <Label>Descrição personalizada</Label>
                          <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o motivo do bloqueio"
                          />
                        </div>
                      )}
                    </TabsContent>
                    
                    <Button onClick={handleCreateAppointment} className="w-full mt-4">
                      {appointmentType === 'client' ? 'Criar Agendamento' : 'Bloquear Horário'}
                    </Button>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Assistant Selector */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Selecionar Agente</CardTitle>
              <CardDescription>
                Escolha o agente para visualizar e gerenciar agendamentos
                {assistants.length > 0 && ` (${assistants.length} agentes encontrados)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um agente" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {assistants.length === 0 ? (
                    <SelectItem value="no-assistants" disabled>
                      Nenhum agente encontrado
                    </SelectItem>
                  ) : (
                    assistants.map((assistant) => {
                      console.log('Assistant disponível:', assistant.name, 'ID:', assistant.id, 'Tools:', (assistant as any).tools);
                      const tools = (assistant as any).tools;
                      const hasCalendarTools = tools && Array.isArray(tools) && tools.length > 0;
                      return (
                        <SelectItem key={assistant.id} value={assistant.id}>
                          {assistant.name} {hasCalendarTools ? '📅' : '⚙️'}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedAssistant && (
            <div className="space-y-6">
              {/* Mobile: Stack vertically, Desktop: Side by side */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Calendar - Fixed width to prevent cutting */}
                <div className="lg:w-80 flex-shrink-0">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Calendário</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center p-4">
                      <div className="w-full max-w-[280px]">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          locale={ptBR}
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Appointments - Takes remaining space */}
                <div className="flex-1">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="text-lg">
                          Agendamentos - {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                        </CardTitle>
                        <div className="flex gap-2">
                          {googleCalendarConnected && (
                            <Badge variant="secondary" className="text-xs">
                              <Link className="h-3 w-3 mr-1" />
                              Sincronizado
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowCreateDialog(true)}
                            className="w-full sm:w-auto"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Bloquear Horário
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {calendarLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">Carregando agendamentos...</p>
                        </div>
                      ) : appointments.length === 0 ? (
                        <div className="text-center py-8">
                          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Nenhum agendamento para esta data</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {appointments.map((appointment) => {
                            const isBlocked = appointment.client_phone === 'SISTEMA' || appointment.client_name.startsWith('BLOQUEADO');
                            return (
                              <div
                                key={appointment.id}
                                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3 ${
                                  isBlocked ? 'bg-red-50 border-red-200 dark:bg-red-950/10 dark:border-red-900/30' : 'bg-background'
                                }`}
                              >
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {isBlocked ? (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <User className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className={`font-medium ${isBlocked ? 'text-red-700 dark:text-red-400' : ''}`}>
                                      {isBlocked ? appointment.client_name.replace('BLOQUEADO - ', '') : appointment.client_name}
                                    </span>
                                    {getStatusBadge(appointment.status)}
                                    {isBlocked && (
                                      <Badge variant="destructive" className="text-xs">
                                        Bloqueado
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {appointment.appointment_time} ({appointment.duration}min)
                                    </div>
                                    {!isBlocked && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {appointment.client_phone}
                                      </div>
                                    )}
                                  </div>
                                  {appointment.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {appointment.description}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  {appointment.status === 'scheduled' && !isBlocked && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateAppointment(appointment.id, 'completed')}
                                        className="h-8"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCancelAppointment(appointment.id)}
                                        className="h-8"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  {isBlocked && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCancelAppointment(appointment.id)}
                                      className="h-8 text-red-600 hover:text-red-700"
                                    >
                                      Remover
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CalendarPage;
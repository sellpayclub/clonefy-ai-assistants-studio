import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle, XCircle, Edit3, Plus } from "lucide-react";
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  // Form states
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [description, setDescription] = useState("");
  
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

  const { assistants, loading: assistantsLoading } = useAssistants(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
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

  const handleCreateAppointment = async () => {
    if (!selectedAssistant || !clientName || !clientPhone || !appointmentTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await createAppointment({
        assistant_id: selectedAssistant,
        client_name: clientName,
        client_phone: clientPhone,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: appointmentTime,
        duration,
        description
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
              <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!selectedAssistant}>
                    <Edit3 className="h-4 w-4 mr-2" />
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
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Agendamento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
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
                    <Button onClick={handleCreateAppointment} className="w-full">
                      Criar Agendamento
                    </Button>
                  </div>
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
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um agente" />
                </SelectTrigger>
                <SelectContent>
                  {assistants.map((assistant) => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      {assistant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedAssistant && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <Card>
                <CardHeader>
                  <CardTitle>Calendário</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              {/* Appointments List */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    Agendamentos - {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </CardTitle>
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
                    <div className="space-y-4">
                      {appointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{appointment.client_name}</span>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {appointment.appointment_time} ({appointment.duration}min)
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {appointment.client_phone}
                              </div>
                            </div>
                            {appointment.description && (
                              <p className="text-sm text-muted-foreground">
                                {appointment.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {appointment.status === 'scheduled' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateAppointment(appointment.id, 'completed')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelAppointment(appointment.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CalendarPage;
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  user_id: string;
  assistant_id: string;
  client_name: string;
  client_phone: string;
  appointment_date: string;
  appointment_time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  description?: string;
  created_at: string;
  updated_at: string;
}

interface CalendarSettings {
  id: string;
  user_id: string;
  assistant_id: string;
  working_hours_start: string;
  working_hours_end: string;
  working_days: number[];
  slot_duration: number;
  buffer_time: number;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export const useCalendar = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callFunction = useCallback(async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    const response = await supabase.functions.invoke('calendar-management', {
      body,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }, []);

  const checkAvailability = useCallback(async (assistantId: string, date: string, duration = 30) => {
    setLoading(true);
    try {
      const data = await callFunction({
        action: 'check_availability',
        assistant_id: assistantId,
        date,
        duration
      });
      return data.available_slots || [];
    } catch (error: any) {
      toast({
        title: "Erro ao verificar disponibilidade",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [callFunction, toast]);

  const createAppointment = useCallback(async (appointmentData: {
    assistant_id: string;
    client_name: string;
    client_phone: string;
    date: string;
    time: string;
    duration?: number;
    description?: string;
  }) => {
    setLoading(true);
    try {
      const data = await callFunction({
        action: 'create_appointment',
        ...appointmentData
      });
      
      toast({
        title: "Agendamento criado!",
        description: data.message,
      });
      
      return data.appointment;
    } catch (error: any) {
      toast({
        title: "Erro ao criar agendamento",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [callFunction, toast]);

  const listAppointments = useCallback(async (filters: {
    assistant_id?: string;
    date?: string;
    status?: string;
  } = {}) => {
    setLoading(true);
    try {
      const data = await callFunction({
        action: 'list_appointments',
        ...filters
      });
      return data.appointments || [];
    } catch (error: any) {
      toast({
        title: "Erro ao carregar agendamentos",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [callFunction, toast]);

  const cancelAppointment = useCallback(async (appointmentId: string) => {
    setLoading(true);
    try {
      const data = await callFunction({
        action: 'cancel_appointment',
        appointment_id: appointmentId
      });
      
      toast({
        title: "Agendamento cancelado!",
        description: data.message,
      });
      
      return data.appointment;
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar agendamento",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [callFunction, toast]);

  const rescheduleAppointment = useCallback(async (appointmentId: string, newDate: string, newTime: string, duration?: number) => {
    setLoading(true);
    try {
      const data = await callFunction({
        action: 'reschedule_appointment',
        appointment_id: appointmentId,
        new_date: newDate,
        new_time: newTime,
        duration
      });
      
      toast({
        title: "Agendamento reagendado!",
        description: data.message,
      });
      
      return data.appointment;
    } catch (error: any) {
      toast({
        title: "Erro ao reagendar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [callFunction, toast]);

  const updateAppointment = useCallback(async (appointmentId: string, updates: {
    status?: string;
    description?: string;
  }) => {
    setLoading(true);
    try {
      const data = await callFunction({
        action: 'update_appointment',
        appointment_id: appointmentId,
        ...updates
      });
      
      toast({
        title: "Agendamento atualizado!",
        description: data.message,
      });
      
      return data.appointment;
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar agendamento",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [callFunction, toast]);

  const updateCalendarSettings = useCallback(async (settings: {
    assistant_id: string;
    working_hours_start: string;
    working_hours_end: string;
    working_days: number[];
    slot_duration: number;
    buffer_time: number;
    timezone: string;
  }) => {
    setLoading(true);
    try {
      const data = await callFunction({
        action: 'update_calendar_settings',
        ...settings
      });
      
      toast({
        title: "Configurações salvas!",
        description: data.message,
      });
      
      return data.settings;
    } catch (error: any) {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [callFunction, toast]);

  const getCalendarSettings = useCallback(async (assistantId: string) => {
    setLoading(true);
    try {
      const data = await callFunction({
        action: 'get_calendar_settings',
        assistant_id: assistantId
      });
      return data.settings;
    } catch (error: any) {
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [callFunction, toast]);

  return {
    loading,
    checkAvailability,
    createAppointment,
    listAppointments,
    cancelAppointment,
    rescheduleAppointment,
    updateAppointment,
    updateCalendarSettings,
    getCalendarSettings,
  };
};

export type { Appointment, CalendarSettings };
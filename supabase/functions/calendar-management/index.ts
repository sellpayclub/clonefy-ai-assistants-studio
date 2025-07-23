import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    console.log(`Calendar Management API - Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'check_availability':
        return await checkAvailability(user.id, data);
      case 'create_appointment':
        return await createAppointment(user.id, data);
      case 'list_appointments':
        return await listAppointments(user.id, data);
      case 'cancel_appointment':
        return await cancelAppointment(user.id, data);
      case 'reschedule_appointment':
        return await rescheduleAppointment(user.id, data);
      case 'update_calendar_settings':
        return await updateCalendarSettings(user.id, data);
      case 'get_calendar_settings':
        return await getCalendarSettings(user.id, data);
      case 'update_appointment':
        return await updateAppointment(user.id, data);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in calendar-management function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkAvailability(userId: string, data: any) {
  const { assistant_id, date, duration = 30 } = data;
  
  // Get calendar settings
  const { data: settings } = await supabase
    .from('calendar_settings')
    .select('*')
    .eq('user_id', userId)
    .eq('assistant_id', assistant_id)
    .single();

  if (!settings) {
    throw new Error('Calendar not configured for this assistant');
  }

  // Get existing appointments for the date
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .eq('assistant_id', assistant_id)
    .eq('appointment_date', date)
    .eq('status', 'scheduled');

  // Generate available slots
  const slots = generateAvailableSlots(settings, appointments || [], date, duration);

  return new Response(JSON.stringify({ 
    available_slots: slots,
    date,
    duration 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function createAppointment(userId: string, data: any) {
  const { assistant_id, client_name, client_phone, date, time, duration = 30, description = '' } = data;
  
  // Validate required fields
  if (!assistant_id || !client_name || !client_phone || !date || !time) {
    throw new Error('Missing required fields: assistant_id, client_name, client_phone, date, time');
  }

  // Check if slot is still available
  const appointmentDateTime = new Date(`${date}T${time}`);
  const endDateTime = new Date(appointmentDateTime.getTime() + duration * 60000);

  const { data: conflictingAppointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .eq('assistant_id', assistant_id)
    .eq('appointment_date', date)
    .eq('status', 'scheduled')
    .gte('appointment_time', time)
    .lt('appointment_time', endDateTime.toTimeString().split(' ')[0]);

  if (conflictingAppointments && conflictingAppointments.length > 0) {
    throw new Error('Time slot is no longer available');
  }

  // Create appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      assistant_id,
      client_name,
      client_phone,
      appointment_date: date,
      appointment_time: time,
      duration,
      description,
      status: 'scheduled'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create appointment: ${error.message}`);
  }

  return new Response(JSON.stringify({ 
    success: true,
    appointment,
    message: `Agendamento criado com sucesso para ${client_name} em ${date} às ${time}` 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function listAppointments(userId: string, data: any) {
  const { assistant_id, date, status } = data;
  
  let query = supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId);

  if (assistant_id) {
    query = query.eq('assistant_id', assistant_id);
  }

  if (date) {
    query = query.eq('appointment_date', date);
  }

  if (status) {
    query = query.eq('status', status);
  } else {
    query = query.neq('status', 'cancelled');
  }

  query = query.order('appointment_date', { ascending: true })
               .order('appointment_time', { ascending: true });

  const { data: appointments, error } = await query;

  if (error) {
    throw new Error(`Failed to list appointments: ${error.message}`);
  }

  return new Response(JSON.stringify({ 
    appointments: appointments || [],
    count: appointments?.length || 0 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function cancelAppointment(userId: string, data: any) {
  const { appointment_id, client_phone, date } = data;
  
  let query = supabase
    .from('appointments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (appointment_id) {
    query = query.eq('id', appointment_id);
  } else if (client_phone && date) {
    query = query.eq('client_phone', client_phone).eq('appointment_date', date);
  } else {
    throw new Error('Either appointment_id or both client_phone and date are required');
  }

  const { data: appointment, error } = await query.select().single();

  if (error) {
    throw new Error(`Failed to cancel appointment: ${error.message}`);
  }

  return new Response(JSON.stringify({ 
    success: true,
    appointment,
    message: 'Agendamento cancelado com sucesso' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function rescheduleAppointment(userId: string, data: any) {
  const { appointment_id, new_date, new_time, duration } = data;
  
  if (!appointment_id || !new_date || !new_time) {
    throw new Error('appointment_id, new_date, and new_time are required');
  }

  // Check if new slot is available
  const { data: currentAppointment } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .eq('id', appointment_id)
    .single();

  if (!currentAppointment) {
    throw new Error('Appointment not found');
  }

  const newDuration = duration || currentAppointment.duration;
  const newEndTime = new Date(`${new_date}T${new_time}`);
  newEndTime.setMinutes(newEndTime.getMinutes() + newDuration);

  const { data: conflictingAppointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .eq('assistant_id', currentAppointment.assistant_id)
    .eq('appointment_date', new_date)
    .eq('status', 'scheduled')
    .neq('id', appointment_id)
    .gte('appointment_time', new_time)
    .lt('appointment_time', newEndTime.toTimeString().split(' ')[0]);

  if (conflictingAppointments && conflictingAppointments.length > 0) {
    throw new Error('New time slot is not available');
  }

  // Update appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .update({
      appointment_date: new_date,
      appointment_time: new_time,
      duration: newDuration,
      status: 'rescheduled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('id', appointment_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to reschedule appointment: ${error.message}`);
  }

  return new Response(JSON.stringify({ 
    success: true,
    appointment,
    message: `Agendamento reagendado para ${new_date} às ${new_time}` 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateCalendarSettings(userId: string, data: any) {
  const { 
    assistant_id, 
    working_hours_start, 
    working_hours_end, 
    working_days, 
    slot_duration, 
    buffer_time, 
    timezone 
  } = data;

  const { data: settings, error } = await supabase
    .from('calendar_settings')
    .upsert({
      user_id: userId,
      assistant_id,
      working_hours_start,
      working_hours_end,
      working_days,
      slot_duration,
      buffer_time,
      timezone,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'assistant_id'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update calendar settings: ${error.message}`);
  }

  return new Response(JSON.stringify({ 
    success: true,
    settings,
    message: 'Configurações do calendário atualizadas com sucesso' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getCalendarSettings(userId: string, data: any) {
  const { assistant_id } = data;
  
  const { data: settings, error } = await supabase
    .from('calendar_settings')
    .select('*')
    .eq('user_id', userId)
    .eq('assistant_id', assistant_id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get calendar settings: ${error.message}`);
  }

  return new Response(JSON.stringify({ 
    settings: settings || null 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateAppointment(userId: string, data: any) {
  const { appointment_id, status, description } = data;
  
  if (!appointment_id) {
    throw new Error('appointment_id is required');
  }

  const updateData: any = { updated_at: new Date().toISOString() };
  
  if (status) updateData.status = status;
  if (description !== undefined) updateData.description = description;

  const { data: appointment, error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('user_id', userId)
    .eq('id', appointment_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update appointment: ${error.message}`);
  }

  return new Response(JSON.stringify({ 
    success: true,
    appointment,
    message: 'Agendamento atualizado com sucesso' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateAvailableSlots(settings: any, appointments: any[], date: string, duration: number) {
  const slots = [];
  const startTime = settings.working_hours_start;
  const endTime = settings.working_hours_end;
  const slotDuration = settings.slot_duration || 30;
  const bufferTime = settings.buffer_time || 0;
  
  // Parse working hours
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentTime = new Date();
  currentTime.setHours(startHour, startMinute, 0, 0);
  
  const endDateTime = new Date();
  endDateTime.setHours(endHour, endMinute, 0, 0);
  
  while (currentTime < endDateTime) {
    const timeString = currentTime.toTimeString().split(' ')[0].substring(0, 5);
    
    // Check if this slot conflicts with existing appointments
    const hasConflict = appointments.some(apt => {
      const aptTime = new Date(`1970-01-01T${apt.appointment_time}`);
      const aptEndTime = new Date(aptTime.getTime() + apt.duration * 60000);
      const slotEndTime = new Date(currentTime.getTime() + duration * 60000);
      
      return (currentTime >= aptTime && currentTime < aptEndTime) ||
             (slotEndTime > aptTime && slotEndTime <= aptEndTime) ||
             (currentTime <= aptTime && slotEndTime >= aptEndTime);
    });
    
    if (!hasConflict) {
      slots.push(timeString);
    }
    
    // Move to next slot (including buffer time)
    currentTime.setMinutes(currentTime.getMinutes() + slotDuration + bufferTime);
  }
  
  return slots;
}
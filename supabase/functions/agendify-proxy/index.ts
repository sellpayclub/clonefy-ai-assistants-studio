import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseServiceKey } from '../_shared/openai-responses.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = getSupabaseServiceKey();

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Cache simples para serviços e profissionais
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

function getCached(key: string): any | null {
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache[key] = { data, timestamp: Date.now() };
}

interface AgendifyConfig {
  tenant_id: string;
  api_base_url: string;
}

async function callAgendifyAPI(
  config: AgendifyConfig,
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const url = `${config.api_base_url}/api/v1${endpoint}`;
  
  console.log(`📡 Agendify API: ${method} ${url}`);
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': config.tenant_id,
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Agendify API error: ${response.status} - ${errorText}`);
      throw new Error(`Agendify API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Agendify API success`);
    return data;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Agendify API timeout');
    }
    throw error;
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, assistant_id, ...params } = await req.json();

    console.log(`🔧 Agendify Proxy - Action: ${action}, Assistant: ${assistant_id}`);

    if (!assistant_id) {
      throw new Error('assistant_id is required');
    }

    // Buscar configuração do Agendify para este assistente
    const { data: config, error: configError } = await supabase
      .from('agendify_configs')
      .select('tenant_id, api_base_url')
      .eq('assistant_id', assistant_id)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      console.error('❌ Agendify config not found:', configError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Integração Agendify não configurada para este assistente' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: any;

    switch (action) {
      // ======== SERVIÇOS ========
      case 'list_services': {
        const cacheKey = `services_${config.tenant_id}`;
        let cached = getCached(cacheKey);
        
        if (!cached) {
          const response = await callAgendifyAPI(config, '/services');
          cached = response.data || [];
          setCache(cacheKey, cached);
        }
        
        result = {
          success: true,
          services: cached,
          message: `Encontrados ${cached.length} serviço(s) disponível(is).`
        };
        break;
      }

      // ======== PROFISSIONAIS ========
      case 'list_professionals': {
        const { serviceId } = params;
        const cacheKey = `professionals_${config.tenant_id}_${serviceId || 'all'}`;
        let cached = getCached(cacheKey);
        
        if (!cached) {
          const endpoint = serviceId ? `/professionals?serviceId=${serviceId}` : '/professionals';
          const response = await callAgendifyAPI(config, endpoint);
          cached = response.data || [];
          setCache(cacheKey, cached);
        }
        
        result = {
          success: true,
          professionals: cached,
          message: `Encontrados ${cached.length} profissional(is).`
        };
        break;
      }

      // ======== DISPONIBILIDADE ========
      case 'check_availability': {
        const { date, serviceId, professionalId } = params;
        
        if (!date || !serviceId) {
          throw new Error('date e serviceId são obrigatórios para verificar disponibilidade');
        }

        let endpoint = `/availability?date=${date}&serviceId=${serviceId}`;
        if (professionalId) {
          endpoint += `&professionalId=${professionalId}`;
        }

        const response = await callAgendifyAPI(config, endpoint);
        const slots = response.data || [];
        const availableSlots = slots.filter((s: any) => s.available);
        
        result = {
          success: true,
          slots: slots,
          availableSlots: availableSlots,
          message: availableSlots.length > 0 
            ? `Horários disponíveis para ${date}: ${availableSlots.map((s: any) => s.time).join(', ')}`
            : `Não há horários disponíveis para ${date}.`
        };
        break;
      }

      // ======== CRIAR AGENDAMENTO ========
      case 'create_appointment': {
        const { clientPhone, clientName, serviceId, professionalId, date, time, notes } = params;
        
        if (!clientPhone || !clientName || !serviceId || !professionalId || !date || !time) {
          throw new Error('Dados incompletos para criar agendamento. Necessário: clientPhone, clientName, serviceId, professionalId, date, time');
        }

        const response = await callAgendifyAPI(config, '/appointments', 'POST', {
          clientPhone,
          clientName,
          serviceId,
          professionalId,
          date,
          time,
          notes: notes || 'Agendado via assistente IA'
        });
        
        result = {
          success: true,
          appointment: response.data,
          message: `Agendamento criado com sucesso para ${clientName} no dia ${date} às ${time}.`
        };
        break;
      }

      // ======== CANCELAR AGENDAMENTO ========
      case 'cancel_appointment': {
        const { appointmentId, reason } = params;
        
        if (!appointmentId) {
          throw new Error('appointmentId é obrigatório para cancelar');
        }

        const response = await callAgendifyAPI(config, `/appointments/${appointmentId}/cancel`, 'POST', {
          reason: reason || 'Cancelado pelo cliente via assistente IA'
        });
        
        result = {
          success: true,
          message: 'Agendamento cancelado com sucesso.'
        };
        break;
      }

      // ======== LISTAR AGENDAMENTOS ========
      case 'list_appointments': {
        const { date, startDate, endDate, clientPhone } = params;
        
        let endpoint = '/appointments?';
        if (date) endpoint += `date=${date}&`;
        if (startDate) endpoint += `startDate=${startDate}&`;
        if (endDate) endpoint += `endDate=${endDate}&`;
        if (clientPhone) endpoint += `clientPhone=${clientPhone}&`;
        
        const response = await callAgendifyAPI(config, endpoint.slice(0, -1));
        const appointments = response.data || [];
        
        result = {
          success: true,
          appointments: appointments,
          message: `Encontrados ${appointments.length} agendamento(s).`
        };
        break;
      }

      // ======== BUSCAR CLIENTES ========
      case 'search_clients': {
        const { search } = params;
        
        const endpoint = search ? `/clients?search=${encodeURIComponent(search)}` : '/clients';
        const response = await callAgendifyAPI(config, endpoint);
        const clients = response.data || [];
        
        result = {
          success: true,
          clients: clients,
          message: `Encontrados ${clients.length} cliente(s).`
        };
        break;
      }

      // ======== DADOS FINANCEIROS ========
      case 'get_finance_stats': {
        const { month } = params;
        
        const endpoint = month ? `/finance?month=${month}` : '/finance';
        const response = await callAgendifyAPI(config, endpoint);
        
        result = {
          success: true,
          stats: response.data?.stats || {},
          message: 'Dados financeiros obtidos com sucesso.'
        };
        break;
      }

      // ======== TESTAR CONEXÃO ========
      case 'test_connection': {
        try {
          const response = await callAgendifyAPI(config, '/services');
          result = {
            success: true,
            message: 'Conexão com Agendify estabelecida com sucesso!',
            servicesCount: (response.data || []).length
          };
        } catch (error) {
          result = {
            success: false,
            message: `Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          };
        }
        break;
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Agendify Proxy error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: 'Ocorreu um erro ao processar a solicitação com o Agendify.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

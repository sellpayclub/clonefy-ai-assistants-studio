import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseServiceKey } from '../_shared/openai-responses.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase Client
const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    getSupabaseServiceKey()
);

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';

interface Schedule {
    id: string;
    lead_id: string;
    campaign_id: string;
    scheduled_at: string;
    step_number: number;
    message_template: string | null;
}

interface Lead {
    id: string;
    name: string;
    whatsapp_number: string;
    openai_thread_id: string | null;
    human_takeover_until: string | null;
    status: string;
}

interface Campaign {
    id: string;
    whatsapp_instance: string;
    openai_assistant_id: string | null;
    start_hour: number;
    end_hour: number;
    working_days: number[];
    max_daily_messages: number;
    status: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log('⏰ [Scheduler] Iniciando processamento de agendamentos...');

        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay();

        // Buscar agendamentos pendentes que estão no horário
        const { data: schedules, error: schedulesError } = await supabase
            .from('followup_schedules')
            .select(`
                id,
                lead_id,
                campaign_id,
                scheduled_at,
                step_number,
                message_template
            `)
            .eq('status', 'pending')
            .lte('scheduled_at', now.toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(20); // Processar em lotes

        if (schedulesError) {
            throw new Error(`Erro ao buscar agendamentos: ${schedulesError.message}`);
        }

        if (!schedules || schedules.length === 0) {
            console.log('📭 Nenhum agendamento pendente');
            return new Response(JSON.stringify({
                status: 'ok',
                message: 'Nenhum agendamento pendente',
                processed: 0
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`📋 ${schedules.length} agendamentos encontrados`);

        const results = {
            processed: 0,
            sent: 0,
            skipped: 0,
            failed: 0,
            details: [] as any[]
        };

        for (const schedule of schedules) {
            try {
                // Buscar dados do lead
                const { data: lead, error: leadError } = await supabase
                    .from('followup_leads')
                    .select('*')
                    .eq('id', schedule.lead_id)
                    .single();

                if (leadError || !lead) {
                    console.log(`⚠️ Lead não encontrado: ${schedule.lead_id}`);
                    await markScheduleAs(schedule.id, 'failed', 'Lead não encontrado');
                    results.failed++;
                    continue;
                }

                // Buscar dados da campanha
                const { data: campaign, error: campaignError } = await supabase
                    .from('followup_campaigns')
                    .select('*')
                    .eq('id', schedule.campaign_id)
                    .single();

                if (campaignError || !campaign) {
                    console.log(`⚠️ Campanha não encontrada: ${schedule.campaign_id}`);
                    await markScheduleAs(schedule.id, 'failed', 'Campanha não encontrada');
                    results.failed++;
                    continue;
                }

                // Verificar se campanha está ativa
                if (campaign.status !== 'active') {
                    console.log(`⏸️ Campanha não está ativa: ${campaign.id}`);
                    await markScheduleAs(schedule.id, 'cancelled', 'Campanha inativa');
                    results.skipped++;
                    continue;
                }

                // Verificar horário comercial
                if (currentHour < campaign.start_hour || currentHour >= campaign.end_hour) {
                    console.log(`🕐 Fora do horário comercial (${currentHour}h)`);
                    results.skipped++;
                    continue; // Não cancelar, apenas pular - será processado depois
                }

                // Verificar dia da semana
                if (!campaign.working_days?.includes(currentDay)) {
                    console.log(`📅 Dia não trabalha (${currentDay})`);
                    results.skipped++;
                    continue; // Não cancelar, apenas pular
                }

                // Verificar Human Takeover
                if (lead.human_takeover_until && new Date(lead.human_takeover_until) > now) {
                    console.log(`👤 Human Takeover ativo para lead: ${lead.id}`);
                    await markScheduleAs(schedule.id, 'cancelled', 'Human Takeover ativo');
                    results.skipped++;
                    continue;
                }

                // Verificar status do lead
                if (['converted', 'lost', 'paused'].includes(lead.status)) {
                    console.log(`⏸️ Lead com status ${lead.status}`);
                    await markScheduleAs(schedule.id, 'cancelled', `Lead ${lead.status}`);
                    results.skipped++;
                    continue;
                }

                // Verificar limite diário de mensagens
                const dailyCount = await getDailyMessageCount(campaign.id);
                if (dailyCount >= campaign.max_daily_messages) {
                    console.log(`🛑 Limite diário atingido (${dailyCount}/${campaign.max_daily_messages})`);
                    results.skipped++;
                    continue; // Não cancelar, tentar novamente amanhã
                }

                // Marcar como processando
                await markScheduleAs(schedule.id, 'processing');

                // Chamar dispatcher
                console.log(`📤 Disparando para lead ${lead.name} (${lead.whatsapp_number})`);

                const dispatchResult = await callDispatcher({
                    schedule_id: schedule.id,
                    lead_id: lead.id,
                    campaign_id: campaign.id,
                    lead_name: lead.name,
                    whatsapp_number: lead.whatsapp_number,
                    whatsapp_instance: campaign.whatsapp_instance,
                    assistant_id: campaign.openai_assistant_id,
                    thread_id: lead.openai_thread_id,
                    step_number: schedule.step_number,
                    message_template: schedule.message_template
                });

                if (dispatchResult.success) {
                    results.sent++;
                    results.details.push({
                        lead: lead.name,
                        status: 'sent',
                        step: schedule.step_number
                    });
                } else {
                    results.failed++;
                    results.details.push({
                        lead: lead.name,
                        status: 'failed',
                        error: dispatchResult.error
                    });
                }

                results.processed++;

            } catch (scheduleError: any) {
                console.error(`❌ Erro no agendamento ${schedule.id}:`, scheduleError);
                await markScheduleAs(schedule.id, 'failed', scheduleError.message);
                results.failed++;
            }
        }

        console.log(`✅ Processamento concluído: ${results.processed} processados, ${results.sent} enviados, ${results.skipped} pulados, ${results.failed} falhas`);

        return new Response(JSON.stringify({
            status: 'ok',
            ...results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('❌ [Scheduler] Erro:', error);
        return new Response(JSON.stringify({
            status: 'error',
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Marcar agendamento com status
async function markScheduleAs(id: string, status: string, errorMessage?: string) {
    await supabase
        .from('followup_schedules')
        .update({
            status,
            error_message: errorMessage,
            ...(status === 'sent' ? { sent_at: new Date().toISOString() } : {})
        })
        .eq('id', id);
}

// Contar mensagens enviadas hoje
async function getDailyMessageCount(campaignId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
        .from('followup_messages')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('direction', 'sent')
        .gte('sent_at', today.toISOString());

    return count || 0;
}

// Chamar função de disparo
async function callDispatcher(request: any): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/followup-dispatcher`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            const error = await response.text();
            return { success: false, error };
        }

        const result = await response.json();
        return { success: result.status === 'success', error: result.error };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseServiceKey } from '../_shared/openai-responses.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Evolution API Config - Usar mesma URL que outras funções
const EVOLUTION_API_URL = 'https://evolutionapi.clonefyia.com';
const EVOLUTION_API_KEY = '94805bfbb25f77f37a029f5a3dbfe62b';

// Supabase Client
const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    getSupabaseServiceKey()
);

interface DispatchRequest {
    schedule_id: string;
    lead_id: string;
    campaign_id: string;
    lead_name: string;
    whatsapp_number: string;
    whatsapp_instance: string;
    assistant_id: string;
    thread_id?: string;
    step_number: number;
    message_template?: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const request: DispatchRequest = await req.json();
        console.log('📤 [Dispatcher] Recebida solicitação:', request);

        // Validar dados
        if (!request.lead_id || !request.campaign_id || !request.whatsapp_number) {
            throw new Error('Dados incompletos para disparo');
        }

        // Buscar configurações da campanha
        const { data: campaign, error: campaignError } = await supabase
            .from('followup_campaigns')
            .select('*')
            .eq('id', request.campaign_id)
            .single();

        if (campaignError || !campaign) {
            throw new Error(`Campanha não encontrada: ${campaignError?.message}`);
        }

        // Verificar se campanha está ativa
        if (campaign.status !== 'active') {
            console.log('⏸️ Campanha não está ativa, ignorando disparo');
            await updateScheduleStatus(request.schedule_id, 'cancelled', 'Campanha não está ativa');
            return new Response(JSON.stringify({ status: 'cancelled', reason: 'campaign_not_active' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Buscar lead
        const { data: lead, error: leadError } = await supabase
            .from('followup_leads')
            .select('*')
            .eq('id', request.lead_id)
            .single();

        if (leadError || !lead) {
            throw new Error(`Lead não encontrado: ${leadError?.message}`);
        }

        // Verificar Human Takeover
        if (lead.human_takeover_until && new Date(lead.human_takeover_until) > new Date()) {
            console.log('👤 Human Takeover ativo, ignorando disparo');
            await updateScheduleStatus(request.schedule_id, 'cancelled', 'Human Takeover ativo');
            return new Response(JSON.stringify({ status: 'cancelled', reason: 'human_takeover' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Verificar status do lead
        if (['converted', 'lost', 'paused'].includes(lead.status)) {
            console.log(`⏸️ Lead com status ${lead.status}, ignorando disparo`);
            await updateScheduleStatus(request.schedule_id, 'cancelled', `Lead com status ${lead.status}`);
            return new Response(JSON.stringify({ status: 'cancelled', reason: 'lead_status' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Gerar mensagem com IA
        const message = await generateFollowUpMessage(
            campaign,
            lead,
            request.step_number,
            request.message_template
        );

        console.log('🤖 Mensagem gerada:', message);

        // Enviar via Evolution API
        const whatsappInstance = request.whatsapp_instance || campaign.whatsapp_instance;

        if (!whatsappInstance) {
            throw new Error('Instância WhatsApp não configurada');
        }

        const sendResult = await sendWhatsAppMessage(
            whatsappInstance,
            request.whatsapp_number,
            message
        );

        if (!sendResult.success) {
            throw new Error(`Erro ao enviar WhatsApp: ${sendResult.error}`);
        }

        console.log('✅ Mensagem enviada com sucesso!');

        // Atualizar schedule como enviado
        await updateScheduleStatus(request.schedule_id, 'sent');

        // Registrar mensagem no histórico
        await supabase.from('followup_messages').insert({
            lead_id: request.lead_id,
            campaign_id: request.campaign_id,
            direction: 'sent',
            content: message,
            step_number: request.step_number,
            status: 'sent',
            sent_at: new Date().toISOString()
        });

        // Atualizar lead
        await supabase
            .from('followup_leads')
            .update({
                status: lead.status === 'new' ? 'contacted' : lead.status,
                current_step: request.step_number,
                total_messages_sent: (lead.total_messages_sent || 0) + 1,
                last_message_at: new Date().toISOString()
            })
            .eq('id', request.lead_id);

        // Atualizar estatísticas da campanha
        await supabase
            .from('followup_campaigns')
            .update({
                total_messages_sent: (campaign.total_messages_sent || 0) + 1
            })
            .eq('id', request.campaign_id);

        // Agendar próximo follow-up se não for o último
        if (request.step_number < campaign.max_followups) {
            await scheduleNextFollowup(
                request.lead_id,
                request.campaign_id,
                request.step_number + 1,
                campaign
            );
        }

        return new Response(JSON.stringify({
            status: 'success',
            message_sent: message,
            step: request.step_number,
            lead_id: request.lead_id
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('❌ [Dispatcher] Erro:', error);

        return new Response(JSON.stringify({
            status: 'error',
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Gerar mensagem de follow-up com IA
async function generateFollowUpMessage(
    campaign: any,
    lead: any,
    stepNumber: number,
    template?: string
): Promise<string> {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
        // Fallback: usar template ou mensagem padrão
        if (template) {
            return template.replace('{nome}', lead.name).replace('{name}', lead.name);
        }
        return `Olá ${lead.name}! Tudo bem? Gostaria de saber se ainda tem interesse no nosso produto/serviço. 😊`;
    }

    // Buscar histórico de mensagens
    const { data: messages } = await supabase
        .from('followup_messages')
        .select('direction, content')
        .eq('lead_id', lead.id)
        .order('sent_at', { ascending: true })
        .limit(10);

    const historyText = messages?.map(m =>
        `${m.direction === 'sent' ? 'Você' : lead.name}: ${m.content}`
    ).join('\n') || 'Primeiro contato';

    // Preparar objeções
    const objectionsText = campaign.common_objections?.map((o: any) =>
        `- Objeção: ${o.objection} → Resposta: ${o.response}`
    ).join('\n') || '';

    const systemPrompt = `Você é um especialista em follow-up de vendas para ${campaign.business_name || 'uma empresa'}.

SOBRE O NEGÓCIO:
${campaign.business_description || 'Não especificado'}

PROPOSTA DE VALOR:
${campaign.value_proposition || 'Não especificado'}

OBJEÇÕES COMUNS E RESPOSTAS:
${objectionsText || 'Nenhuma configurada'}

SUA MISSÃO:
- Este é o follow-up #${stepNumber} para o lead ${lead.name}
- Ser ${campaign.tone_of_voice || 'amigável'} e natural
- Mensagem curta e direta (máximo 3 linhas)
- Despertar interesse sem ser insistente
- Se for o último follow-up (#${campaign.max_followups}), indicar que é a última tentativa de contato

HISTÓRICO:
${historyText}

IMPORTANTE:
- Responda APENAS com a mensagem a ser enviada
- Não use aspas ou formatação
- Use emojis moderadamente`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Gere a mensagem de follow-up #${stepNumber} para ${lead.name}` }
                ],
                max_tokens: 200,
                temperature: 0.7
            })
        });

        const data = await response.json();
        return data.choices?.[0]?.message?.content || `Olá ${lead.name}! Ainda tem interesse?`;
    } catch (error) {
        console.error('Erro ao gerar mensagem:', error);
        return template || `Olá ${lead.name}! Gostaria de saber se ainda tem interesse. 😊`;
    }
}

// Enviar mensagem via Evolution API
async function sendWhatsAppMessage(
    instanceName: string,
    number: string,
    message: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Formatar número (remover caracteres especiais)
        const formattedNumber = number.replace(/\D/g, '');

        const response = await fetch(
            `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY
                },
                body: JSON.stringify({
                    number: formattedNumber,
                    text: message
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            return { success: false, error };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Atualizar status do agendamento
async function updateScheduleStatus(
    scheduleId: string,
    status: string,
    errorMessage?: string
) {
    await supabase
        .from('followup_schedules')
        .update({
            status,
            sent_at: status === 'sent' ? new Date().toISOString() : null,
            error_message: errorMessage
        })
        .eq('id', scheduleId);
}

// Agendar próximo follow-up
async function scheduleNextFollowup(
    leadId: string,
    campaignId: string,
    nextStep: number,
    campaign: any
) {
    // Calcular próximo horário baseado nas configurações
    const now = new Date();
    let scheduledAt = new Date(now);

    // Adicionar intervalo mínimo em minutos
    scheduledAt.setMinutes(scheduledAt.getMinutes() + (campaign.min_interval_minutes || 30));

    // Ajustar para horário comercial se necessário
    const hour = scheduledAt.getHours();
    if (hour < campaign.start_hour) {
        scheduledAt.setHours(campaign.start_hour, 0, 0, 0);
    } else if (hour >= campaign.end_hour) {
        // Próximo dia útil
        scheduledAt.setDate(scheduledAt.getDate() + 1);
        scheduledAt.setHours(campaign.start_hour, 0, 0, 0);
    }

    // Verificar dia da semana
    while (!campaign.working_days?.includes(scheduledAt.getDay())) {
        scheduledAt.setDate(scheduledAt.getDate() + 1);
        scheduledAt.setHours(campaign.start_hour, 0, 0, 0);
    }

    // Adicionar um pouco de aleatoriedade
    const randomDelay = Math.floor(Math.random() * (campaign.random_delay_seconds || 60));
    scheduledAt.setSeconds(scheduledAt.getSeconds() + randomDelay);

    // Criar agendamento
    await supabase.from('followup_schedules').insert({
        lead_id: leadId,
        campaign_id: campaignId,
        scheduled_at: scheduledAt.toISOString(),
        step_number: nextStep,
        status: 'pending'
    });

    // Atualizar lead com próximo followup
    await supabase
        .from('followup_leads')
        .update({ next_followup_at: scheduledAt.toISOString() })
        .eq('id', leadId);

    console.log(`📅 Próximo follow-up agendado para ${scheduledAt.toISOString()}`);
}

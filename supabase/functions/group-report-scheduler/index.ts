// =====================================================
// GROUP REPORT SCHEDULER - Relatórios Diários de Grupos
// Função isolada - executada via cron job hourly
// Verifica quais grupos devem receber relatório nesta hora
// =====================================================

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseServiceKey } from '../_shared/openai-responses.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Evolution API Config
const EVOLUTION_API_URL = 'https://evolutionapi.clonefyia.com';
const EVOLUTION_API_KEY = '94805bfbb25f77f37a029f5a3dbfe62b';

// Supabase Client
const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    getSupabaseServiceKey()
);

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

/**
 * Busca o número de WhatsApp do dono
 */
async function getOwnerWhatsAppNumber(userId: string): Promise<string | null> {
    try {
        const { data } = await supabase
            .from('n8n_fluxogpt')
            .select('whatsappuser')
            .eq('userId', userId)
            .not('whatsappuser', 'is', null)
            .limit(1)
            .single();

        return data?.whatsappuser || null;
    } catch {
        return null;
    }
}

/**
 * Gera resumo do grupo usando GPT-4
 */
async function generateGroupSummary(
    groupName: string,
    messages: { sender_name: string; content: string; message_timestamp: string }[]
): Promise<{ summary: string; topics: string[]; activeParticipants: string[] }> {

    if (!openaiApiKey || messages.length === 0) {
        return { summary: 'Sem mensagens hoje.', topics: [], activeParticipants: [] };
    }

    // Formatar conversa para a IA
    const conversation = messages
        .map(m => `[${new Date(m.message_timestamp).toLocaleTimeString('pt-BR')}] ${m.sender_name}: ${m.content}`)
        .join('\n');

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `Você é um assistente que gera relatórios concisos de conversas de grupos do WhatsApp.
                        
Analise a conversa e retorne um JSON com:
- "summary": Um resumo em português de 2-4 parágrafos destacando o que foi discutido, decisões tomadas e pontos importantes
- "topics": Array com os tópicos principais discutidos (máximo 5)
- "active_participants": Array com os nomes dos participantes mais ativos

Seja objetivo e destaque o que é realmente relevante para quem está gerenciando o grupo.`
                    },
                    {
                        role: 'user',
                        content: `Grupo: ${groupName}\n\nConversa do dia:\n\n${conversation}`
                    }
                ],
                response_format: { type: 'json_object' },
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error('Falha na API OpenAI');
        }

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);

        return {
            summary: result.summary || 'Erro ao gerar resumo.',
            topics: result.topics || [],
            activeParticipants: result.active_participants || []
        };
    } catch (error) {
        console.error('❌ [GROUP-REPORT] Erro ao gerar resumo:', error);
        return {
            summary: `Grupo teve ${messages.length} mensagens hoje. Erro ao gerar resumo detalhado.`,
            topics: [],
            activeParticipants: []
        };
    }
}

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log('📊 [GROUP-REPORT] Scheduler iniciado');

        const now = new Date();
        const currentHour = now.getHours().toString().padStart(2, '0');
        const today = now.toISOString().split('T')[0];

        console.log(`⏰ [GROUP-REPORT] Hora atual: ${currentHour}:00, Data: ${today}`);

        // Buscar grupos que devem receber relatório nesta hora
        const { data: groupsDue, error: fetchError } = await supabase
            .from('whatsapp_groups')
            .select('*')
            .eq('is_active', true)
            .eq('report_enabled', true)
            .gte('report_time', `${currentHour}:00`)
            .lt('report_time', `${currentHour}:59`);

        if (fetchError) {
            throw new Error(`Erro ao buscar grupos: ${fetchError.message}`);
        }

        if (!groupsDue || groupsDue.length === 0) {
            console.log('⏭️ [GROUP-REPORT] Nenhum grupo agendado para esta hora');
            return new Response(JSON.stringify({
                status: 'no_groups_due',
                current_hour: currentHour
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`📋 [GROUP-REPORT] ${groupsDue.length} grupo(s) para processar`);

        const results = [];

        for (const group of groupsDue) {
            console.log(`📝 [GROUP-REPORT] Processando: ${group.group_name}`);

            // Verificar se relatório já foi gerado hoje
            const { data: existingReport } = await supabase
                .from('group_reports')
                .select('id')
                .eq('group_id', group.id)
                .eq('report_date', today)
                .single();

            if (existingReport) {
                console.log(`⏭️ [GROUP-REPORT] Relatório já gerado hoje para ${group.group_name}`);
                results.push({ group: group.group_name, status: 'already_generated' });
                continue;
            }

            // Buscar mensagens do dia
            const startOfDay = `${today}T00:00:00.000Z`;
            const endOfDay = `${today}T23:59:59.999Z`;

            const { data: todayMessages } = await supabase
                .from('group_messages')
                .select('sender_name, content, message_timestamp')
                .eq('group_id', group.id)
                .gte('message_timestamp', startOfDay)
                .lte('message_timestamp', endOfDay)
                .order('message_timestamp', { ascending: true });

            if (!todayMessages || todayMessages.length === 0) {
                console.log(`⏭️ [GROUP-REPORT] Sem mensagens hoje em ${group.group_name}`);
                results.push({ group: group.group_name, status: 'no_messages' });
                continue;
            }

            console.log(`📨 [GROUP-REPORT] ${todayMessages.length} mensagens para resumir`);

            // Gerar resumo com IA
            const { summary, topics, activeParticipants } = await generateGroupSummary(
                group.group_name,
                todayMessages
            );

            // Salvar relatório no banco
            const { error: reportError } = await supabase
                .from('group_reports')
                .insert({
                    group_id: group.id,
                    report_date: today,
                    content: summary,
                    topics: topics,
                    active_participants: activeParticipants,
                    message_count: todayMessages.length
                });

            if (reportError) {
                console.error(`❌ [GROUP-REPORT] Erro ao salvar relatório:`, reportError);
                results.push({ group: group.group_name, status: 'save_error' });
                continue;
            }

            // Enviar relatório via WhatsApp para o dono
            const ownerNumber = await getOwnerWhatsAppNumber(group.user_id);

            if (ownerNumber) {
                const reportMessage = `📊 *RELATÓRIO DIÁRIO*\n` +
                    `📍 Grupo: *${group.group_name}*\n` +
                    `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n` +
                    `💬 Mensagens: ${todayMessages.length}\n\n` +
                    `📋 *Resumo:*\n${summary}\n\n` +
                    (topics.length > 0 ? `🏷️ *Tópicos:* ${topics.join(', ')}\n\n` : '') +
                    (activeParticipants.length > 0 ? `👥 *Mais ativos:* ${activeParticipants.join(', ')}` : '');

                try {
                    await fetch(`${EVOLUTION_API_URL}/message/sendText/${group.instance_name}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': EVOLUTION_API_KEY
                        },
                        body: JSON.stringify({
                            number: ownerNumber,
                            text: reportMessage,
                            delay: 2
                        })
                    });

                    // Marcar como enviado
                    await supabase
                        .from('group_reports')
                        .update({ was_sent: true, sent_at: new Date().toISOString() })
                        .eq('group_id', group.id)
                        .eq('report_date', today);

                    console.log(`✅ [GROUP-REPORT] Relatório enviado para ${group.group_name}`);
                    results.push({ group: group.group_name, status: 'sent', messages: todayMessages.length });
                } catch (sendError) {
                    console.error(`❌ [GROUP-REPORT] Erro ao enviar:`, sendError);
                    results.push({ group: group.group_name, status: 'send_error' });
                }
            } else {
                console.log(`⚠️ [GROUP-REPORT] Número do dono não encontrado para ${group.group_name}`);
                results.push({ group: group.group_name, status: 'no_owner_number' });
            }

            // Atualizar último relatório
            await supabase
                .from('whatsapp_groups')
                .update({ last_report_at: new Date().toISOString() })
                .eq('id', group.id);
        }

        console.log('✅ [GROUP-REPORT] Scheduler concluído');

        return new Response(JSON.stringify({
            status: 'completed',
            processed: results.length,
            results
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ [GROUP-REPORT] Erro:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

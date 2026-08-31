// =====================================================
// GROUP MANAGER - API para gerenciamento de grupos
// Função isolada - lista grupos, sincroniza, pesquisa
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

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { action, ...params } = await req.json();
        console.log(`🔧 [GROUP-MANAGER] Action: ${action}`);

        // =====================================================
        // ACTION: list_available_groups
        // Lista grupos disponíveis na instância Evolution
        // =====================================================
        if (action === 'list_available_groups') {
            const { instance_name } = params;

            if (!instance_name) {
                return new Response(JSON.stringify({ error: 'instance_name required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Buscar grupos na Evolution API
            const response = await fetch(`${EVOLUTION_API_URL}/group/fetchAllGroups/${instance_name}`, {
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            if (!response.ok) {
                throw new Error('Falha ao buscar grupos da Evolution API');
            }

            const groups = await response.json();

            return new Response(JSON.stringify({ groups }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // =====================================================
        // ACTION: add_group
        // Adiciona um grupo para monitoramento
        // =====================================================
        if (action === 'add_group') {
            const { user_id, instance_name, group_jid, group_name, keywords, report_time } = params;

            if (!user_id || !instance_name || !group_jid || !group_name) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const { data, error } = await supabase
                .from('whatsapp_groups')
                .upsert({
                    user_id,
                    instance_name,
                    group_jid,
                    group_name,
                    keywords: keywords || [],
                    report_time: report_time || '18:00',
                    is_active: true,
                    report_enabled: true,
                    alerts_enabled: true
                }, { onConflict: 'user_id,group_jid' })
                .select()
                .single();

            if (error) {
                throw error;
            }

            return new Response(JSON.stringify({ success: true, group: data }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // =====================================================
        // ACTION: update_group
        // Atualiza configurações do grupo
        // =====================================================
        if (action === 'update_group') {
            const { group_id, ...updates } = params;

            if (!group_id) {
                return new Response(JSON.stringify({ error: 'group_id required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const { data, error } = await supabase
                .from('whatsapp_groups')
                .update(updates)
                .eq('id', group_id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return new Response(JSON.stringify({ success: true, group: data }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // =====================================================
        // ACTION: get_reports
        // Busca relatórios de um grupo
        // =====================================================
        if (action === 'get_reports') {
            const { group_id, limit = 10 } = params;

            if (!group_id) {
                return new Response(JSON.stringify({ error: 'group_id required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const { data, error } = await supabase
                .from('group_reports')
                .select('*')
                .eq('group_id', group_id)
                .order('report_date', { ascending: false })
                .limit(limit);

            if (error) {
                throw error;
            }

            return new Response(JSON.stringify({ reports: data }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // =====================================================
        // ACTION: search
        // Pesquisa inteligente nas mensagens e relatórios
        // =====================================================
        if (action === 'search') {
            const { user_id, query, group_id } = params;

            if (!user_id || !query) {
                return new Response(JSON.stringify({ error: 'user_id and query required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Buscar mensagens relevantes
            let messagesQuery = supabase
                .from('group_messages')
                .select(`
                    content,
                    sender_name,
                    message_timestamp,
                    whatsapp_groups!inner(group_name, user_id)
                `)
                .ilike('content', `%${query}%`)
                .order('message_timestamp', { ascending: false })
                .limit(20);

            if (group_id) {
                messagesQuery = messagesQuery.eq('group_id', group_id);
            }

            const { data: messages } = await messagesQuery;

            // Filtrar apenas grupos do usuário
            const userMessages = messages?.filter(
                (m: any) => m.whatsapp_groups?.user_id === user_id
            ) || [];

            // Buscar relatórios relevantes
            let reportsQuery = supabase
                .from('group_reports')
                .select(`
                    content,
                    topics,
                    report_date,
                    whatsapp_groups!inner(group_name, user_id)
                `)
                .or(`content.ilike.%${query}%,topics.cs.{${query}}`)
                .order('report_date', { ascending: false })
                .limit(10);

            if (group_id) {
                reportsQuery = reportsQuery.eq('group_id', group_id);
            }

            const { data: reports } = await reportsQuery;

            // Filtrar apenas relatórios do usuário
            const userReports = reports?.filter(
                (r: any) => r.whatsapp_groups?.user_id === user_id
            ) || [];

            // Se tiver OpenAI, gerar resposta inteligente
            let aiSummary = null;
            if (openaiApiKey && (userMessages.length > 0 || userReports.length > 0)) {
                try {
                    const context = [
                        ...userMessages.map((m: any) => `[Msg ${m.whatsapp_groups?.group_name}] ${m.sender_name}: ${m.content}`),
                        ...userReports.map((r: any) => `[Relatório ${r.whatsapp_groups?.group_name} ${r.report_date}] ${r.content}`)
                    ].join('\n\n');

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
                                    content: 'Você é um assistente que responde perguntas sobre conversas de grupos do WhatsApp. Responda de forma concisa e direta baseado no contexto fornecido.'
                                },
                                {
                                    role: 'user',
                                    content: `Contexto dos grupos:\n\n${context}\n\nPergunta: ${query}`
                                }
                            ],
                            max_tokens: 500
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        aiSummary = data.choices[0].message.content;
                    }
                } catch {
                    // Ignorar erro de IA
                }
            }

            return new Response(JSON.stringify({
                messages: userMessages,
                reports: userReports,
                ai_summary: aiSummary
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // =====================================================
        // ACTION: get_stats
        // Estatísticas de um grupo
        // =====================================================
        if (action === 'get_stats') {
            const { group_id } = params;

            if (!group_id) {
                return new Response(JSON.stringify({ error: 'group_id required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Buscar grupo
            const { data: group } = await supabase
                .from('whatsapp_groups')
                .select('*')
                .eq('id', group_id)
                .single();

            // Buscar participantes mais ativos
            const { data: topParticipants } = await supabase
                .from('group_participants')
                .select('participant_name, message_count')
                .eq('group_id', group_id)
                .order('message_count', { ascending: false })
                .limit(5);

            // Contar mensagens dos últimos 7 dias
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { count: weekMessages } = await supabase
                .from('group_messages')
                .select('*', { count: 'exact', head: true })
                .eq('group_id', group_id)
                .gte('message_timestamp', weekAgo);

            // Contar alertas
            const { count: alertCount } = await supabase
                .from('group_alerts')
                .select('*', { count: 'exact', head: true })
                .eq('group_id', group_id);

            return new Response(JSON.stringify({
                group,
                top_participants: topParticipants,
                messages_last_7_days: weekMessages,
                total_alerts: alertCount
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ [GROUP-MANAGER] Erro:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

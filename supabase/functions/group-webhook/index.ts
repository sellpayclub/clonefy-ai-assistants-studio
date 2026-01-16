// =====================================================
// GROUP WEBHOOK - SISTEMA ISOLADO DE GERENCIAMENTO DE GRUPOS
// Esta função é 100% separada do sistema principal de WhatsApp
// =====================================================

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface GroupWebhookPayload {
    event: string;
    instance: string;
    data: {
        key: {
            remoteJid: string;
            fromMe: boolean;
            id: string;
        };
        participant?: string;
        message?: {
            conversation?: string;
            extendedTextMessage?: { text: string };
            imageMessage?: { caption?: string };
            videoMessage?: { caption?: string };
            audioMessage?: { url: string };
            documentMessage?: { fileName: string };
        };
        messageTimestamp?: number;
        pushName?: string;
    };
}

/**
 * Busca o número de WhatsApp do dono para enviar alertas
 */
async function getOwnerWhatsAppNumber(userId: string): Promise<string | null> {
    try {
        // Buscar o número da primeira instância do usuário
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

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log('👥 [GROUP-WEBHOOK] Nova requisição recebida');

        const payload: GroupWebhookPayload = await req.json();

        // Apenas processar mensagens.upsert
        if (payload.event !== 'messages.upsert') {
            return new Response(JSON.stringify({ status: 'ignored', event: payload.event }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const remoteJid = payload.data.key.remoteJid;
        const instanceName = payload.instance;

        // APENAS mensagens de GRUPOS (@g.us)
        if (!remoteJid.endsWith('@g.us')) {
            return new Response(JSON.stringify({ status: 'ignored', reason: 'not_a_group' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Ignorar mensagens próprias
        if (payload.data.key.fromMe) {
            return new Response(JSON.stringify({ status: 'ignored', reason: 'own_message' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`👥 [GROUP-WEBHOOK] Mensagem de grupo: ${remoteJid}`);

        // Extrair conteúdo da mensagem
        let messageContent = '';
        let messageType = 'text';

        if (payload.data.message?.conversation) {
            messageContent = payload.data.message.conversation;
        } else if (payload.data.message?.extendedTextMessage?.text) {
            messageContent = payload.data.message.extendedTextMessage.text;
        } else if (payload.data.message?.imageMessage) {
            messageContent = `[IMAGEM] ${payload.data.message.imageMessage.caption || ''}`;
            messageType = 'image';
        } else if (payload.data.message?.videoMessage) {
            messageContent = `[VÍDEO] ${payload.data.message.videoMessage.caption || ''}`;
            messageType = 'video';
        } else if (payload.data.message?.audioMessage) {
            messageContent = '[ÁUDIO]';
            messageType = 'audio';
        } else if (payload.data.message?.documentMessage) {
            messageContent = `[DOCUMENTO] ${payload.data.message.documentMessage.fileName || ''}`;
            messageType = 'document';
        }

        if (!messageContent.trim()) {
            return new Response(JSON.stringify({ status: 'ignored', reason: 'no_content' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const senderJid = payload.data.participant || remoteJid;
        const senderName = payload.data.pushName || 'Desconhecido';
        const messageId = payload.data.key.id;
        const messageTimestamp = payload.data.messageTimestamp
            ? new Date(payload.data.messageTimestamp * 1000).toISOString()
            : new Date().toISOString();

        // Verificar se o grupo está sendo monitorado
        const { data: monitoredGroup } = await supabase
            .from('whatsapp_groups')
            .select('*')
            .eq('instance_name', instanceName)
            .eq('group_jid', remoteJid)
            .eq('is_active', true)
            .single();

        if (!monitoredGroup) {
            console.log(`⏭️ [GROUP-WEBHOOK] Grupo não monitorado: ${remoteJid}`);
            return new Response(JSON.stringify({
                status: 'ignored',
                reason: 'group_not_monitored',
                group_jid: remoteJid
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`📝 [GROUP-WEBHOOK] Processando mensagem do grupo: ${monitoredGroup.group_name}`);

        // 1. Armazenar mensagem
        const { error: insertError } = await supabase
            .from('group_messages')
            .upsert({
                group_id: monitoredGroup.id,
                message_id: messageId,
                sender_jid: senderJid,
                sender_name: senderName,
                content: messageContent,
                message_type: messageType,
                message_timestamp: messageTimestamp
            }, { onConflict: 'group_id,message_id' });

        if (insertError) {
            console.error('❌ [GROUP-WEBHOOK] Erro ao salvar mensagem:', insertError);
        }

        // 2. Atualizar estatísticas do grupo
        await supabase
            .from('whatsapp_groups')
            .update({
                total_messages: (monitoredGroup.total_messages || 0) + 1,
                last_message_at: messageTimestamp
            })
            .eq('id', monitoredGroup.id);

        // 3. Atualizar/criar participante
        const { data: existingParticipant } = await supabase
            .from('group_participants')
            .select('message_count')
            .eq('group_id', monitoredGroup.id)
            .eq('participant_jid', senderJid)
            .single();

        await supabase
            .from('group_participants')
            .upsert({
                group_id: monitoredGroup.id,
                participant_jid: senderJid,
                participant_name: senderName,
                message_count: (existingParticipant?.message_count || 0) + 1,
                last_message_at: messageTimestamp
            }, { onConflict: 'group_id,participant_jid' });

        // 4. ALERTAS: Verificar palavras-chave
        if (monitoredGroup.alerts_enabled && monitoredGroup.keywords?.length > 0) {
            const lowerContent = messageContent.toLowerCase();

            for (const keyword of monitoredGroup.keywords) {
                if (lowerContent.includes(keyword.toLowerCase())) {
                    console.log(`🚨 [GROUP-WEBHOOK] ALERTA! Palavra-chave: "${keyword}"`);

                    // Registrar alerta
                    await supabase
                        .from('group_alerts')
                        .insert({
                            group_id: monitoredGroup.id,
                            keyword: keyword,
                            message_content: messageContent,
                            sender_jid: senderJid,
                            sender_name: senderName
                        });

                    // Enviar alerta para o dono via WhatsApp
                    const ownerNumber = await getOwnerWhatsAppNumber(monitoredGroup.user_id);
                    if (ownerNumber) {
                        const alertMessage = `🚨 *ALERTA DE GRUPO*\n\n` +
                            `📍 Grupo: ${monitoredGroup.group_name}\n` +
                            `🔑 Palavra-chave: "${keyword}"\n` +
                            `👤 De: ${senderName}\n\n` +
                            `💬 Mensagem:\n"${messageContent}"`;

                        try {
                            await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'apikey': EVOLUTION_API_KEY
                                },
                                body: JSON.stringify({
                                    number: ownerNumber,
                                    text: alertMessage,
                                    delay: 1
                                })
                            });

                            // Marcar alerta como enviado
                            await supabase
                                .from('group_alerts')
                                .update({ was_sent: true, sent_at: new Date().toISOString() })
                                .eq('group_id', monitoredGroup.id)
                                .eq('keyword', keyword)
                                .is('sent_at', null);

                            console.log('✅ [GROUP-WEBHOOK] Alerta enviado!');
                        } catch (sendError) {
                            console.error('❌ [GROUP-WEBHOOK] Erro ao enviar alerta:', sendError);
                        }
                    }

                    break; // Um alerta por mensagem
                }
            }
        }

        return new Response(JSON.stringify({
            status: 'processed',
            group: monitoredGroup.group_name,
            sender: senderName,
            message_type: messageType
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ [GROUP-WEBHOOK] Erro:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

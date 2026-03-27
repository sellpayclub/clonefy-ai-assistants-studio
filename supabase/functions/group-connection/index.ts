// =====================================================
// GROUP CONNECTION - Configura webhook de grupos na instância WhatsApp existente
// =====================================================

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Evolution API Config
const EVOLUTION_API_URL = 'https://evolutionapi.clonefyia.com';
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || '94805bfbb25f77f37a029f5a3dbfe62b';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { action, user_id, instanceName, enabled } = body;
        console.log(`🔗 [GROUP-CONNECTION] Action: ${action}, User: ${user_id}, Instance: ${instanceName}, Enabled: ${enabled}`);

        if (!action) {
            return new Response(JSON.stringify({ error: 'action required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // =====================================================
        // ACTION: configure_webhook
        // Ativa ou desativa eventos de grupo no webhook da instância existente
        // =====================================================
        if (action === 'configure_webhook') {
            if (!instanceName) {
                return new Response(JSON.stringify({ error: 'instanceName required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const isEnabled = enabled === true;
            console.log(`🔗 [GROUP-CONNECTION] ${isEnabled ? 'Ativando' : 'Desativando'} grupos na instância: ${instanceName}`);

            // Buscar webhook atual da instância para preservar configurações existentes
            let currentWebhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-webhook`;

            try {
                const findResponse = await fetch(`${EVOLUTION_API_URL}/webhook/find/${instanceName}`, {
                    headers: { 'apikey': EVOLUTION_API_KEY }
                });
                if (findResponse.ok) {
                    const current = await findResponse.json();
                    if (current?.url) {
                        currentWebhookUrl = current.url;
                    }
                    console.log(`📋 [GROUP-CONNECTION] Webhook atual: ${currentWebhookUrl}`);
                }
            } catch (e) {
                console.log('⚠️ [GROUP-CONNECTION] Não foi possível buscar webhook atual, usando padrão');
            }

            // Eventos base (sempre ativos)
            const baseEvents = [
                'MESSAGES_UPSERT',
                'CONNECTION_UPDATE',
                'QRCODE_UPDATED',
            ];

            // Eventos de grupo (só quando habilitado)
            const groupEvents = [
                'MESSAGES_UPSERT',  // já inclui mensagens de grupo
                'GROUP_PARTICIPANTS_UPDATE',
                'GROUPS_UPSERT',
                'GROUPS_UPDATE',
            ];

            // Merge dos eventos
            const events = isEnabled 
                ? [...new Set([...baseEvents, ...groupEvents])]
                : baseEvents;

            // Configurar settings de grupo na Evolution API
            // Isso faz a instância aceitar ou ignorar mensagens de grupo
            try {
                const settingsResponse = await fetch(`${EVOLUTION_API_URL}/settings/set/${instanceName}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': EVOLUTION_API_KEY
                    },
                    body: JSON.stringify({
                        rejectCall: false,
                        groupsIgnore: !isEnabled,  // true = ignora grupos, false = aceita grupos
                        alwaysOnline: false,
                        readMessages: false,
                        readStatus: false,
                        syncFullHistory: false,
                    })
                });

                if (settingsResponse.ok) {
                    const settingsData = await settingsResponse.json();
                    console.log(`✅ [GROUP-CONNECTION] Settings atualizadas: groupsIgnore=${!isEnabled}`, settingsData);
                } else {
                    const err = await settingsResponse.text();
                    console.error(`⚠️ [GROUP-CONNECTION] Erro ao atualizar settings: ${err}`);
                }
            } catch (e) {
                console.error(`⚠️ [GROUP-CONNECTION] Erro ao configurar settings:`, e);
            }

            // Atualizar webhook com os eventos corretos
            const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY
                },
                body: JSON.stringify({
                    enabled: true,
                    url: currentWebhookUrl,
                    webhookByEvents: false,
                    webhookBase64: false,
                    events: events
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`❌ [GROUP-CONNECTION] Erro ao configurar webhook: ${error}`);
                throw new Error(`Failed to configure webhook: ${error}`);
            }

            const data = await response.json();
            console.log(`✅ [GROUP-CONNECTION] Webhook configurado. Grupos ${isEnabled ? 'ATIVADOS' : 'DESATIVADOS'} para ${instanceName}`);

            return new Response(JSON.stringify({
                success: true,
                enabled: isEnabled,
                groupsIgnore: !isEnabled,
                webhook_url: currentWebhookUrl,
                instance_name: instanceName,
                events: events,
                data
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
        console.error('❌ [GROUP-CONNECTION] Erro:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

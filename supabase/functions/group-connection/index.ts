// =====================================================
// GROUP CONNECTION - Gerencia conexão WhatsApp isolada para Grupos
// Instâncias separadas de IA e Follow-up
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

// Webhook URL para grupos
const GROUP_WEBHOOK_URL = Deno.env.get('SUPABASE_URL') + '/functions/v1/group-webhook';

// Supabase Client
const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { action, user_id } = await req.json();
        console.log(`🔗 [GROUP-CONNECTION] Action: ${action}, User: ${user_id}`);

        if (!user_id) {
            return new Response(JSON.stringify({ error: 'user_id required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Nome da instância para grupos (único por usuário)
        const instanceName = `group_${user_id.substring(0, 8)}`;

        // =====================================================
        // ACTION: create_instance
        // Cria uma nova instância na Evolution API para grupos
        // =====================================================
        if (action === 'create_instance') {
            console.log(`🆕 [GROUP-CONNECTION] Criando instância: ${instanceName}`);

            // Verificar se já existe
            try {
                const checkResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
                    headers: { 'apikey': EVOLUTION_API_KEY }
                });

                if (checkResponse.ok) {
                    const instances = await checkResponse.json();
                    const existing = instances.find((i: any) => i.name === instanceName || i.instance?.instanceName === instanceName);

                    if (existing) {
                        console.log(`✅ [GROUP-CONNECTION] Instância já existe: ${instanceName}`);
                        return new Response(JSON.stringify({
                            success: true,
                            instance_name: instanceName,
                            message: 'Instance already exists'
                        }), {
                            status: 200,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                        });
                    }
                }
            } catch (e) {
                console.log('⚠️ [GROUP-CONNECTION] Erro ao verificar instâncias existentes');
            }

            // Criar nova instância
            const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY
                },
                body: JSON.stringify({
                    instanceName: instanceName,
                    qrcode: true,
                    integration: 'WHATSAPP-BAILEYS',
                    webhookUrl: GROUP_WEBHOOK_URL,
                    webhookByEvents: true,
                    webhookEvents: [
                        'MESSAGES_UPSERT',
                        'GROUP_PARTICIPANTS_UPDATE',
                        'GROUPS_UPSERT',
                        'GROUPS_UPDATE'
                    ],
                    rejectCall: true
                })
            });

            if (!createResponse.ok) {
                const error = await createResponse.text();
                console.error(`❌ [GROUP-CONNECTION] Erro ao criar instância: ${error}`);
                throw new Error(`Failed to create instance: ${error}`);
            }

            const createData = await createResponse.json();
            console.log(`✅ [GROUP-CONNECTION] Instância criada: ${instanceName}`);

            return new Response(JSON.stringify({
                success: true,
                instance_name: instanceName,
                data: createData
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // =====================================================
        // ACTION: get_qr
        // Busca QR Code para conexão
        // =====================================================
        if (action === 'get_qr') {
            console.log(`📱 [GROUP-CONNECTION] Buscando QR Code: ${instanceName}`);

            const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            if (!response.ok) {
                // Tentar criar instância primeiro
                console.log('⚠️ [GROUP-CONNECTION] Instância não existe, criando...');

                await fetch(`${EVOLUTION_API_URL}/instance/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': EVOLUTION_API_KEY
                    },
                    body: JSON.stringify({
                        instanceName: instanceName,
                        qrcode: true,
                        integration: 'WHATSAPP-BAILEYS',
                        webhookUrl: GROUP_WEBHOOK_URL,
                        webhookByEvents: true,
                        webhookEvents: [
                            'MESSAGES_UPSERT',
                            'GROUP_PARTICIPANTS_UPDATE',
                            'GROUPS_UPSERT',
                            'GROUPS_UPDATE'
                        ],
                        rejectCall: true
                    })
                });

                // Buscar QR novamente
                const retryResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
                    headers: { 'apikey': EVOLUTION_API_KEY }
                });

                if (retryResponse.ok) {
                    const data = await retryResponse.json();
                    return new Response(JSON.stringify({
                        qr_code: data.base64 || data.code,
                        instance_name: instanceName
                    }), {
                        status: 200,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                throw new Error('Failed to get QR code after retry');
            }

            const data = await response.json();

            return new Response(JSON.stringify({
                qr_code: data.base64 || data.code,
                instance_name: instanceName
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // =====================================================
        // ACTION: check_status
        // Verifica status de conexão
        // =====================================================
        if (action === 'check_status') {
            console.log(`🔍 [GROUP-CONNECTION] Verificando status: ${instanceName}`);

            const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            if (!response.ok) {
                return new Response(JSON.stringify({
                    connected: false,
                    status: 'not_found',
                    instance_name: instanceName
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const data = await response.json();
            const isConnected = data.state === 'open' || data.instance?.state === 'open';

            return new Response(JSON.stringify({
                connected: isConnected,
                status: data.state || data.instance?.state || 'unknown',
                instance_name: instanceName
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // =====================================================
        // ACTION: fetch_groups
        // Busca grupos disponíveis na instância conectada
        // =====================================================
        if (action === 'fetch_groups') {
            console.log(`👥 [GROUP-CONNECTION] Buscando grupos: ${instanceName}`);

            const response = await fetch(`${EVOLUTION_API_URL}/group/fetchAllGroups/${instanceName}`, {
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch groups');
            }

            const groups = await response.json();

            return new Response(JSON.stringify({
                groups: groups,
                instance_name: instanceName
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // =====================================================
        // ACTION: disconnect
        // Desconecta a instância
        // =====================================================
        if (action === 'disconnect') {
            console.log(`🔌 [GROUP-CONNECTION] Desconectando: ${instanceName}`);

            const response = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            return new Response(JSON.stringify({
                success: true,
                instance_name: instanceName
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

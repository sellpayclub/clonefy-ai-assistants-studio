// =====================================================
// GROUP CONNECTION - Gerencia conexão WhatsApp isolada para Grupos
// =====================================================

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EVOLUTION_API_URL = 'https://evolutionapi.clonefyia.com';
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') ?? '94805bfbb25f77f37a029f5a3dbfe62b';
const GROUP_WEBHOOK_URL = Deno.env.get('SUPABASE_URL') + '/functions/v1/group-webhook';

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper: extract QR code from Evolution API response (handles v1 and v2 formats)
function extractQrCode(data: any): string | null {
    // Evolution v2: { qrcode: { base64: "...", code: "..." } }
    if (data?.qrcode?.base64) return data.qrcode.base64;
    if (data?.qrcode?.code) return data.qrcode.code;
    // Evolution v1 fallback
    if (data?.base64) return data.base64;
    if (data?.code) return data.code;
    // Nested instance format
    if (data?.instance?.qrcode?.base64) return data.instance.qrcode.base64;
    if (data?.instance?.base64) return data.instance.base64;
    return null;
}

serve(async (req) => {
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

        const instanceName = `group_${user_id.substring(0, 8)}`;

        // =====================================================
        // ACTION: create_instance
        // =====================================================
        if (action === 'create_instance') {
            console.log(`🆕 [GROUP-CONNECTION] Criando instância: ${instanceName}`);

            try {
                const checkResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
                    headers: { 'apikey': EVOLUTION_API_KEY }
                });

                if (checkResponse.ok) {
                    const instances = await checkResponse.json();
                    const existing = instances.find((i: any) =>
                        i.name === instanceName || i.instance?.instanceName === instanceName
                    );

                    if (existing) {
                        return new Response(JSON.stringify({
                            success: true,
                            instance_name: instanceName,
                            message: 'Instance already exists'
                        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                    }
                }
            } catch (e) {
                console.log('⚠️ [GROUP-CONNECTION] Erro ao verificar instâncias existentes');
            }

            const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                body: JSON.stringify({
                    instanceName,
                    qrcode: true,
                    integration: 'WHATSAPP-BAILEYS',
                    webhookUrl: GROUP_WEBHOOK_URL,
                    webhookByEvents: true,
                    webhookEvents: ['MESSAGES_UPSERT', 'GROUP_PARTICIPANTS_UPDATE', 'GROUPS_UPSERT', 'GROUPS_UPDATE'],
                    rejectCall: true
                })
            });

            if (!createResponse.ok) {
                const error = await createResponse.text();
                throw new Error(`Failed to create instance: ${error}`);
            }

            const createData = await createResponse.json();
            return new Response(JSON.stringify({ success: true, instance_name: instanceName, data: createData }), {
                status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // =====================================================
        // ACTION: get_qr
        // =====================================================
        if (action === 'get_qr') {
            console.log(`📱 [GROUP-CONNECTION] Buscando QR Code: ${instanceName}`);

            // Try to ensure instance exists first
            const createFirst = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                body: JSON.stringify({
                    instanceName,
                    qrcode: true,
                    integration: 'WHATSAPP-BAILEYS',
                    webhookUrl: GROUP_WEBHOOK_URL,
                    webhookByEvents: true,
                    webhookEvents: ['MESSAGES_UPSERT', 'GROUP_PARTICIPANTS_UPDATE', 'GROUPS_UPSERT', 'GROUPS_UPDATE'],
                    rejectCall: true
                })
            });

            // Fetch QR code
            const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`❌ [GROUP-CONNECTION] Erro connect: ${errText}`);
                throw new Error(`Failed to get QR code: ${errText}`);
            }

            const data = await response.json();
            console.log(`📱 [GROUP-CONNECTION] QR response keys: ${Object.keys(data).join(', ')}`);

            const qrCode = extractQrCode(data);

            if (!qrCode) {
                console.error(`❌ [GROUP-CONNECTION] QR code não encontrado na resposta:`, JSON.stringify(data).substring(0, 500));
                throw new Error('QR code not found in response');
            }

            return new Response(JSON.stringify({ qr_code: qrCode, instance_name: instanceName }), {
                status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // =====================================================
        // ACTION: check_status
        // =====================================================
        if (action === 'check_status') {
            const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            if (!response.ok) {
                return new Response(JSON.stringify({
                    connected: false,
                    status: 'not_found',
                    instance_name: instanceName
                }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const data = await response.json();
            const state = data?.instance?.state || data?.state || 'unknown';
            const isConnected = state === 'open';

            return new Response(JSON.stringify({
                connected: isConnected,
                status: state,
                instance_name: instanceName
            }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // =====================================================
        // ACTION: fetch_groups (legacy - via Evolution direct)
        // =====================================================
        if (action === 'fetch_groups') {
            const response = await fetch(`${EVOLUTION_API_URL}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch groups');
            }

            const groups = await response.json();
            return new Response(JSON.stringify({ groups, instance_name: instanceName }), {
                status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // =====================================================
        // ACTION: fetch_groups_dedicated
        // Busca grupos da instância dedicada group_{userId}
        // =====================================================
        if (action === 'fetch_groups_dedicated') {
            console.log(`👥 [GROUP-CONNECTION] Buscando grupos da instância dedicada: ${instanceName}`);

            // First verify instance is connected
            const statusResp = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            if (!statusResp.ok) {
                return new Response(JSON.stringify({
                    groups: [],
                    error: 'instance_not_found',
                    message: 'Instância não encontrada. Conecte o WhatsApp primeiro.'
                }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const statusData = await statusResp.json();
            const state = statusData?.instance?.state || statusData?.state || 'unknown';

            if (state !== 'open') {
                return new Response(JSON.stringify({
                    groups: [],
                    error: 'not_connected',
                    message: 'WhatsApp não conectado. Escaneie o QR Code primeiro.'
                }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            // Fetch groups from the dedicated instance
            const groupsResp = await fetch(`${EVOLUTION_API_URL}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            if (!groupsResp.ok) {
                const errText = await groupsResp.text();
                console.error(`❌ [GROUP-CONNECTION] Erro ao buscar grupos: ${errText}`);
                throw new Error(`Failed to fetch groups: ${errText}`);
            }

            const groups = await groupsResp.json();
            console.log(`✅ [GROUP-CONNECTION] Encontrados ${Array.isArray(groups) ? groups.length : 0} grupos`);

            return new Response(JSON.stringify({
                groups: Array.isArray(groups) ? groups : [],
                instance_name: instanceName
            }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // =====================================================
        // ACTION: disconnect
        // =====================================================
        if (action === 'disconnect') {
            console.log(`🔌 [GROUP-CONNECTION] Desconectando: ${instanceName}`);

            await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': EVOLUTION_API_KEY }
            });

            return new Response(JSON.stringify({ success: true, instance_name: instanceName }), {
                status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ [GROUP-CONNECTION] Erro:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});

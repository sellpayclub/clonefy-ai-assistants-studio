import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_API = 'https://api.telegram.org/bot';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const serviceSupabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const body = await req.json();
        const { action } = body;

        console.log(`🤖 Telegram Bot - Action: ${action}, User: ${user.id}`);

        // ========== LIST ==========
        if (action === 'list') {
            const { data: connections, error } = await supabase
                .from('telegram_connections')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return new Response(JSON.stringify({
                success: true,
                connections: connections || []
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ========== CREATE ==========
        if (action === 'create') {
            const { botToken, assistantId, assistantName } = body;

            if (!botToken || !assistantId) {
                return new Response(JSON.stringify({ error: 'botToken e assistantId são obrigatórios' }), {
                    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // 1. Validate bot token via getMe
            console.log('🔍 Validando token do bot...');
            const getMeResponse = await fetch(`${TELEGRAM_API}${botToken}/getMe`);
            const getMeData = await getMeResponse.json();

            if (!getMeData.ok) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Token do bot inválido. Verifique se copiou o token correto do @BotFather.'
                }), {
                    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const botInfo = getMeData.result;
            console.log(`✅ Bot validado: @${botInfo.username} (${botInfo.first_name})`);

            // 2. Check if bot already connected
            const { data: existing } = await serviceSupabase
                .from('telegram_connections')
                .select('id')
                .eq('bot_username', botInfo.username)
                .maybeSingle();

            if (existing) {
                return new Response(JSON.stringify({
                    success: false,
                    error: `O bot @${botInfo.username} já está conectado. Delete a conexão existente primeiro.`
                }), {
                    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // 3. Save connection
            const { data: connection, error: insertError } = await supabase
                .from('telegram_connections')
                .insert({
                    user_id: user.id,
                    bot_token: botToken,
                    bot_username: botInfo.username,
                    bot_name: botInfo.first_name,
                    assistant_openai_id: assistantId,
                    assistant_name: assistantName || 'Assistente',
                    status: 'active'
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // 4. Set webhook
            const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-webhook?bot=${botInfo.username}`;
            console.log(`🔗 Configurando webhook: ${webhookUrl}`);

            const setWebhookResponse = await fetch(`${TELEGRAM_API}${botToken}/setWebhook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: webhookUrl,
                    allowed_updates: ['message'],
                    drop_pending_updates: true
                })
            });

            const webhookResult = await setWebhookResponse.json();
            console.log('📡 Webhook result:', webhookResult);

            if (!webhookResult.ok) {
                // Rollback - delete connection
                await supabase.from('telegram_connections').delete().eq('id', connection.id);
                return new Response(JSON.stringify({
                    success: false,
                    error: `Erro ao configurar webhook do Telegram: ${webhookResult.description}`
                }), {
                    status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({
                success: true,
                connection: {
                    id: connection.id,
                    bot_username: botInfo.username,
                    bot_name: botInfo.first_name,
                    assistant_name: assistantName,
                    status: 'active'
                },
                message: `Bot @${botInfo.username} conectado com sucesso!`
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ========== DELETE ==========
        if (action === 'delete') {
            const { connectionId } = body;
            if (!connectionId) {
                return new Response(JSON.stringify({ error: 'connectionId é obrigatório' }), {
                    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Get connection to remove webhook
            const { data: conn } = await supabase
                .from('telegram_connections')
                .select('bot_token, bot_username')
                .eq('id', connectionId)
                .eq('user_id', user.id)
                .single();

            if (conn) {
                // Remove webhook
                try {
                    await fetch(`${TELEGRAM_API}${conn.bot_token}/deleteWebhook`);
                    console.log(`🗑️ Webhook removido para @${conn.bot_username}`);
                } catch (e) {
                    console.warn('⚠️ Erro ao remover webhook:', e);
                }
            }

            // Delete connection
            const { error: deleteError } = await supabase
                .from('telegram_connections')
                .delete()
                .eq('id', connectionId)
                .eq('user_id', user.id);

            if (deleteError) throw deleteError;

            return new Response(JSON.stringify({
                success: true,
                message: 'Conexão removida com sucesso'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ========== CHECK STATUS ==========
        if (action === 'check_status') {
            const { connectionId } = body;
            if (!connectionId) {
                return new Response(JSON.stringify({ error: 'connectionId é obrigatório' }), {
                    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const { data: conn } = await supabase
                .from('telegram_connections')
                .select('bot_token, bot_username')
                .eq('id', connectionId)
                .eq('user_id', user.id)
                .single();

            if (!conn) {
                return new Response(JSON.stringify({ success: false, error: 'Conexão não encontrada' }), {
                    status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Check via getMe
            const getMeResponse = await fetch(`${TELEGRAM_API}${conn.bot_token}/getMe`);
            const getMeData = await getMeResponse.json();

            // Check webhook info
            const webhookResponse = await fetch(`${TELEGRAM_API}${conn.bot_token}/getWebhookInfo`);
            const webhookData = await webhookResponse.json();

            const isActive = getMeData.ok && webhookData.ok && webhookData.result?.url?.includes('telegram-webhook');

            // Update status in DB
            await supabase
                .from('telegram_connections')
                .update({
                    status: isActive ? 'active' : 'error',
                    last_error: isActive ? null : 'Bot ou webhook inativo',
                    updated_at: new Date().toISOString()
                })
                .eq('id', connectionId);

            return new Response(JSON.stringify({
                success: true,
                isActive,
                bot: getMeData.ok ? getMeData.result : null,
                webhook: webhookData.ok ? { url: webhookData.result?.url, pending: webhookData.result?.pending_update_count } : null
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: `Ação desconhecida: ${action}` }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Erro no telegram-bot:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Erro interno'
        }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

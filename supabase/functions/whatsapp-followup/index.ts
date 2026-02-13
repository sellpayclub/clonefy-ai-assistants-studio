import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

interface FollowupRequest {
    id: number;
    instanceName: string;
    contactNumber: string;
    threadId: string;
    assistantId: string;
    followupNumber: number;
    elevenLabsApiKey?: string;
    voiceId?: string;
}

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log('🔔 Follow-up Webhook - Nova requisição');

        const payload: FollowupRequest = await req.json();
        console.log('📥 Payload:', JSON.stringify(payload, null, 2));

        const {
            id,
            instanceName,
            contactNumber,
            threadId,
            assistantId,
            followupNumber,
            elevenLabsApiKey,
            voiceId
        } = payload;

        // Validações
        if (!instanceName || !contactNumber || !threadId || !assistantId) {
            throw new Error('Dados incompletos para follow-up');
        }

        console.log(`📱 Instância: ${instanceName}`);
        console.log(`👤 Contato: ${contactNumber}`);
        console.log(`🔄 Follow-up #${followupNumber}`);

        // Prompt de follow-up baseado no número
        let followupPrompt = '';
        if (followupNumber === 1) {
            followupPrompt = `INSTRUÇÃO ESPECIAL: O cliente não respondeu há 5 minutos. Envie UMA mensagem curta e natural para recuperar a conversa. Seja amigável e não insistente. Pergunte se pode ajudar em algo ou se ficou alguma dúvida. Máximo 2 frases.`;
        } else if (followupNumber === 2) {
            followupPrompt = `INSTRUÇÃO ESPECIAL: O cliente não respondeu há 15 minutos. Envie uma mensagem curta dizendo que está à disposição quando ele precisar. Seja cordial. Máximo 2 frases.`;
        } else {
            // 3º e último follow-up - 24h depois
            followupPrompt = `INSTRUÇÃO ESPECIAL: Esta é sua ÚLTIMA mensagem de follow-up. O cliente não respondeu há 24 horas. Envie uma despedida cordial e amigável, desejando sucesso e dizendo que está à disposição caso precise no futuro. Seja breve e não insistente. Máximo 2 frases. Não envie mais mensagens após esta.`;
        }

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            throw new Error('OPENAI_API_KEY não configurada');
        }

        // Enviar mensagem de follow-up para o Assistant
        console.log('📤 Enviando prompt de follow-up para OpenAI...');

        const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                role: 'user',
                content: followupPrompt
            })
        });

        if (!messageResponse.ok) {
            const error = await messageResponse.text();
            throw new Error(`Erro ao adicionar mensagem: ${error}`);
        }

        // Executar o assistente
        console.log('🤖 Executando assistente...');

        const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                assistant_id: assistantId
            })
        });

        if (!runResponse.ok) {
            const error = await runResponse.text();
            throw new Error(`Erro ao executar assistente: ${error}`);
        }

        const runData = await runResponse.json();
        const runId = runData.id;

        console.log(`⏳ Run iniciado: ${runId}`);

        // Aguardar conclusão (polling com timeout menor para follow-up)
        let runStatus = 'queued';
        let attempts = 0;
        const maxAttempts = 30; // 30 segundos timeout

        while (runStatus !== 'completed' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                }
            });

            const statusData = await statusResponse.json();
            runStatus = statusData.status;
            attempts++;

            if (runStatus === 'failed' || runStatus === 'cancelled' || runStatus === 'expired') {
                throw new Error(`Assistente falhou: ${runStatus}`);
            }
        }

        if (runStatus !== 'completed') {
            throw new Error(`Timeout na execução do assistente`);
        }

        // Buscar resposta
        console.log('📥 Buscando resposta do assistente...');

        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?order=desc&limit=1`, {
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'OpenAI-Beta': 'assistants=v2'
            }
        });

        const messagesData = await messagesResponse.json();
        const assistantMessage = messagesData.data[0];

        if (!assistantMessage || assistantMessage.role !== 'assistant') {
            throw new Error('Resposta do assistente não encontrada');
        }

        const followupMessage = assistantMessage.content[0].text.value;
        console.log(`🤖 Mensagem de follow-up: ${followupMessage}`);

        // Enviar mensagem via WhatsApp (com áudio se ElevenLabs configurado)
        let sentAsAudio = false;

        if (elevenLabsApiKey && voiceId) {
            console.log('🎙️ ElevenLabs configurado, gerando áudio...');
            try {
                const elevenLabsResponse = await fetch(
                    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'xi-api-key': elevenLabsApiKey
                        },
                        body: JSON.stringify({
                            text: followupMessage,
                            model_id: 'eleven_multilingual_v2',
                            voice_settings: {
                                stability: 0.5,
                                similarity_boost: 0.75
                            }
                        })
                    }
                );

                if (elevenLabsResponse.ok) {
                    const audioBuffer = await elevenLabsResponse.arrayBuffer();
                    const audioBase64 = base64Encode(new Uint8Array(audioBuffer));

                    const audioSendResponse = await fetch(`${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${instanceName}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': EVOLUTION_API_KEY
                        },
                        body: JSON.stringify({
                            number: contactNumber,
                            audio: `data:audio/mpeg;base64,${audioBase64}`
                        })
                    });

                    if (audioSendResponse.ok) {
                        sentAsAudio = true;
                        console.log('✅ Follow-up enviado como áudio!');
                    } else {
                        console.warn('⚠️ Falha ao enviar áudio, enviando como texto...');
                    }
                } else {
                    console.warn('⚠️ Falha ao gerar áudio ElevenLabs, enviando como texto...');
                }
            } catch (audioError) {
                console.warn('⚠️ Erro no ElevenLabs, enviando como texto:', audioError);
            }
        }

        // Fallback: enviar como texto
        if (!sentAsAudio) {
            console.log('📤 Enviando follow-up como texto...');
            const sendResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY
                },
                body: JSON.stringify({
                    number: contactNumber,
                    text: followupMessage
                })
            });

            if (!sendResponse.ok) {
                const error = await sendResponse.text();
                console.error('❌ Erro ao enviar follow-up:', error);
            } else {
                console.log('✅ Follow-up enviado com sucesso!');
            }
        }

        // Atualizar last_message_at após enviar
        await supabase
            .from('n8n_fluxogpt')
            .update({
                last_message_at: new Date().toISOString(),
                last_sender: 'bot'
            })
            .eq('id', id);

        console.log('🎉 Follow-up processado com sucesso!');

        return new Response(JSON.stringify({
            status: 'success',
            instance: instanceName,
            contact: contactNumber,
            followupNumber: followupNumber,
            messageSent: followupMessage.substring(0, 100) + '...'
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Erro no follow-up:', error);

        return new Response(JSON.stringify({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

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

// Configurações
const MESSAGE_BUFFER_SECONDS = 8; // Tempo para acumular mensagens

// Supabase Client com service role para bypass RLS
const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface EvolutionWebhookPayload {
    event: string;
    instance: string;
    data: {
        key: {
            remoteJid: string;
            fromMe: boolean;
            id: string;
        };
        message?: {
            conversation?: string;
            extendedTextMessage?: {
                text: string;
            };
            audioMessage?: {
                url: string;
                mimetype: string;
            };
            imageMessage?: {
                url: string;
                caption?: string;
            };
            documentMessage?: {
                url: string;
                fileName: string;
                mimetype: string;
            };
            videoMessage?: {
                url: string;
                caption?: string;
                mimetype: string;
            };
        };
        messageTimestamp?: number;
        pushName?: string;
        status?: string;
    };
}


serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log('🚀 WhatsApp Webhook - Nova requisição recebida');

        const payload: EvolutionWebhookPayload = await req.json();
        console.log('📥 Payload recebido:', JSON.stringify(payload, null, 2));

        // Filtrar apenas eventos de mensagem
        if (payload.event !== 'messages.upsert') {
            console.log('⏭️ Evento ignorado:', payload.event);
            return new Response(JSON.stringify({ status: 'ignored', event: payload.event }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Detectar se é mensagem do humano (dono da conta) para ativar Human Takeover
        if (payload.data.key.fromMe) {
            console.log('👤 Mensagem do HUMANO detectada - Verificando Human Takeover');

            const instanceName = payload.instance;
            const contactNumber = payload.data.key.remoteJid.replace('@s.whatsapp.net', '');

            // Buscar registro do contato
            const { data: existingContact } = await supabase
                .from('n8n_fluxogpt')
                .select('id')
                .eq('nomeinstancia', instanceName)
                .eq('whatsappuser', contactNumber)
                .single();

            if (existingContact) {
                // Ativar pausa de 2 horas
                const takeoverUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

                await supabase
                    .from('n8n_fluxogpt')
                    .update({ human_takeover_until: takeoverUntil })
                    .eq('id', existingContact.id);

                console.log(`⏸️ HUMAN TAKEOVER ATIVADO! IA pausada até ${takeoverUntil} para contato ${contactNumber}`);

                return new Response(JSON.stringify({
                    status: 'takeover_activated',
                    contact: contactNumber,
                    pausedUntil: takeoverUntil,
                    message: 'IA pausada por 2 horas - humano assumiu a conversa'
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            } else {
                console.log('⏭️ Mensagem própria ignorada (contato ainda não registrado)');
                return new Response(JSON.stringify({ status: 'ignored', reason: 'own_message_no_contact' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        const instanceName = payload.instance;
        const contactNumber = payload.data.key.remoteJid.replace('@s.whatsapp.net', '');
        const contactName = payload.data.pushName || 'Cliente';

        console.log(`📱 Instância: ${instanceName}`);
        console.log(`👤 Contato: ${contactNumber} (${contactName})`);

        // Extrair conteúdo da mensagem
        let messageContent = '';
        let messageType = 'text';
        let mediaUrl = '';

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

        if (payload.data.message?.conversation) {
            messageContent = payload.data.message.conversation;
        } else if (payload.data.message?.extendedTextMessage?.text) {
            messageContent = payload.data.message.extendedTextMessage.text;
        }

        if (payload.data.message?.audioMessage) {
            messageType = 'audio';
            const audioData = payload.data.message.audioMessage;
            const messageId = payload.data.key.id;

            // Transcrever áudio com OpenAI Whisper
            if (openaiApiKey) {
                console.log('🎤 Processando áudio...');
                try {
                    let audioBlob: Blob | null = null;
                    let base64Audio: string | null = null;

                    // MÉTODO 1: Verificar se já tem base64 no payload
                    if ((audioData as any).base64) {
                        console.log('📦 Áudio em base64 direto no payload');
                        base64Audio = (audioData as any).base64;
                    }

                    // MÉTODO 2: Baixar via Evolution API (getBase64FromMediaMessage)
                    if (!base64Audio) {
                        console.log('🔗 Baixando áudio via Evolution API...');
                        try {
                            const mediaResponse = await fetch(`${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instanceName}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'apikey': EVOLUTION_API_KEY
                                },
                                body: JSON.stringify({
                                    message: {
                                        key: payload.data.key,
                                        message: payload.data.message
                                    },
                                    convertToMp4: false
                                })
                            });

                            if (mediaResponse.ok) {
                                const mediaData = await mediaResponse.json();

                                if (mediaData.base64) {
                                    base64Audio = mediaData.base64;
                                    console.log(`✅ Base64 obtido via Evolution API: ${base64Audio.length} caracteres`);
                                }
                            } else {
                                console.log(`❌ Falha Evolution API: ${await mediaResponse.text()}`);
                            }
                        } catch (evoError) {
                            console.log('❌ Erro ao chamar Evolution API:', evoError);
                        }
                    }

                    // MÉTODO 3: Tentar baixar da URL direta (fallback)
                    if (!base64Audio && audioData.url) {
                        console.log('🔗 Tentando baixar da URL direta:', audioData.url);
                        const audioResponse = await fetch(audioData.url);
                        if (audioResponse.ok) {
                            const arrayBuffer = await audioResponse.arrayBuffer();

                            // Converter para base64
                            const uint8Array = new Uint8Array(arrayBuffer);
                            let binary = '';
                            for (let i = 0; i < uint8Array.length; i++) {
                                binary += String.fromCharCode(uint8Array[i]);
                            }
                            base64Audio = btoa(binary);
                        }
                    }

                    // Converter base64 para Blob
                    if (base64Audio) {
                        console.log(`📦 Convertendo base64 para blob (${base64Audio.length} chars)`);
                        const binaryString = atob(base64Audio);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        audioBlob = new Blob([bytes], { type: 'audio/ogg' });
                        console.log(`✅ Blob criado: ${audioBlob.size} bytes`);
                    }

                    if (audioBlob && audioBlob.size > 0) {
                        // Preparar FormData para Whisper
                        const formData = new FormData();
                        formData.append('file', audioBlob, 'audio.ogg');
                        formData.append('model', 'whisper-1');
                        formData.append('language', 'pt');

                        console.log('🎙️ Enviando para Whisper...');
                        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${openaiApiKey}`
                            },
                            body: formData
                        });

                        if (whisperResponse.ok) {
                            const whisperData = await whisperResponse.json();
                            messageContent = whisperData.text || '[Áudio não transcrito]';
                            console.log(`✅ Transcrição: ${messageContent}`);
                        } else {
                            const errorText = await whisperResponse.text();
                            console.warn('⚠️ Falha Whisper:', errorText);
                            messageContent = '[Áudio recebido - transcrição falhou]';
                        }
                    } else {
                        console.warn('⚠️ Não foi possível obter o áudio');
                        messageContent = '[Áudio recebido - não foi possível processar]';
                    }
                } catch (audioError) {
                    console.error('❌ Erro ao transcrever áudio:', audioError);
                    messageContent = '[Áudio recebido - erro na transcrição]';
                }
            } else {
                messageContent = '[Áudio recebido]';
            }
        } else if (payload.data.message?.imageMessage) {
            messageType = 'image';
            const imageData = payload.data.message.imageMessage;
            const caption = imageData.caption || '';
            let base64Image = (imageData as any).base64 || null;

            // Descrever imagem com GPT-4 Vision
            if (openaiApiKey) {
                console.log('🖼️ Analisando imagem com GPT-4 Vision...');
                try {
                    // Se não tem base64, tentar buscar via Evolution API para melhor qualidade
                    if (!base64Image) {
                        try {
                            const mediaResponse = await fetch(`${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instanceName}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'apikey': EVOLUTION_API_KEY
                                },
                                body: JSON.stringify({
                                    message: {
                                        key: payload.data.key,
                                        message: payload.data.message
                                    },
                                    convertToMp4: false
                                })
                            });
                            if (mediaResponse.ok) {
                                const mediaData = await mediaResponse.json();
                                base64Image = mediaData.base64;
                            }
                        } catch (e) {
                            console.log('⚠️ Erro ao buscar base64 da imagem via API');
                        }
                    }

                    // Fallback para URL se ainda não tiver base64
                    const imageUrl = base64Image ? `data:image/jpeg;base64,${base64Image}` : imageData.url;

                    if (imageUrl) {
                        const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${openaiApiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                model: 'gpt-4o',
                                messages: [
                                    {
                                        role: 'user',
                                        content: [
                                            { type: 'text', text: 'Descreva esta imagem de forma concisa para que um assistente de IA possa entender o contexto da conversa. Se houver texto na imagem, extraia-o.' },
                                            {
                                                type: 'image_url',
                                                image_url: { url: imageUrl }
                                            }
                                        ]
                                    }
                                ],
                                max_tokens: 300
                            })
                        });

                        if (visionResponse.ok) {
                            const visionData = await visionResponse.json();
                            const description = visionData.choices[0].message.content;
                            messageContent = `[USÚARIO ENVIOU UMA IMAGEM]\nLegenda: ${caption}\nDescrição da imagem: ${description}`;
                            console.log('✅ Descrição da imagem obtida');
                        } else {
                            messageContent = `[USÚARIO ENVIOU UMA IMAGEM] Legenda: ${caption} (Erro ao analisar imagem)`;
                        }
                    } else {
                        messageContent = `[USÚARIO ENVIOU UMA IMAGEM] Legenda: ${caption}`;
                    }
                } catch (visionError) {
                    console.error('❌ Erro no GPT-4 Vision:', visionError);
                    messageContent = `[USÚARIO ENVIOU UMA IMAGEM] Legenda: ${caption}`;
                }
            } else {
                messageContent = `[USÚARIO ENVIOU UMA IMAGEM] Legenda: ${caption}`;
            }
        } else if (payload.data.message?.documentMessage) {
            messageType = 'document';
            const doc = payload.data.message.documentMessage;
            messageContent = `[USUÁRIO ENVIOU UM DOCUMENTO]\nNome: ${doc.fileName}\nTipo: ${doc.mimetype}`;
        } else if (payload.data.message?.videoMessage) {
            messageType = 'video';
            const video = payload.data.message.videoMessage;
            const caption = video.caption || '';
            messageContent = `[USUÁRIO ENVIOU UM VÍDEO]\nLegenda: ${caption}\nTipo: ${video.mimetype}`;
        }

        if (!messageContent) {
            console.log('❌ Mensagem sem conteúdo identificável');
            return new Response(JSON.stringify({ status: 'error', reason: 'no_content' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`💬 Mensagem (${messageType}): ${messageContent.substring(0, 200)}...`);

        // 1. Buscar configuração da instância
        const { data: instanceConfig, error: instanceError } = await supabase
            .from('n8n_fluxogpt')
            .select('*')
            .eq('nomeinstancia', instanceName)
            .single();

        if (instanceError || !instanceConfig) {
            console.error('❌ Instância não encontrada:', instanceName, instanceError);
            return new Response(JSON.stringify({
                status: 'error',
                reason: 'instance_not_found',
                instance: instanceName
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Buscar user_id do assistente para o Analytics
        const { data: assistantData } = await supabase
            .from('assistants')
            .select('user_id')
            .eq('id', instanceConfig.idassistentgpt)
            .single();

        const userId = assistantData?.user_id || instanceConfig.userId || '';

        console.log('✅ Configuração da instância encontrada');
        console.log(`🤖 Assistant ID: ${instanceConfig.idassistentgpt}`);

        // 2. Buscar ou criar registro para este contato
        // Verificar se já existe um registro com este contato
        const { data: existingContact } = await supabase
            .from('n8n_fluxogpt')
            .select('*')
            .eq('nomeinstancia', instanceName)
            .eq('whatsappuser', contactNumber)
            .single();

        // 🛑 HUMAN TAKEOVER CHECK: Verificar se a IA está pausada para este contato
        if (existingContact?.human_takeover_until) {
            const takeoverUntil = new Date(existingContact.human_takeover_until);

            if (takeoverUntil > new Date()) {
                // IA ainda está pausada - humano está atendendo
                const remainingMinutes = Math.ceil((takeoverUntil.getTime() - Date.now()) / (1000 * 60));
                console.log(`⏸️ HUMAN TAKEOVER ATIVO! IA pausada até ${existingContact.human_takeover_until} (${remainingMinutes} min restantes)`);
                console.log(`👤 Humano está atendendo o contato ${contactNumber} - IA não responderá`);

                return new Response(JSON.stringify({
                    status: 'paused',
                    reason: 'human_takeover',
                    contact: contactNumber,
                    resumesAt: existingContact.human_takeover_until,
                    remainingMinutes: remainingMinutes,
                    message: 'IA pausada - humano está atendendo este contato'
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            } else {
                // Takeover expirou - limpar e continuar
                console.log('✅ Human Takeover expirado - IA voltando a responder');
                await supabase
                    .from('n8n_fluxogpt')
                    .update({ human_takeover_until: null })
                    .eq('id', existingContact.id);
            }
        }

        const now = Date.now().toString();
        let currentMessages = messageContent;
        let threadId = instanceConfig.threadid;

        // Se já existe um registro para este contato específico
        if (existingContact) {
            // Verificar se deve acumular mensagens (dentro do buffer de 10 segundos)
            const lastTimeout = parseInt(existingContact.timeout || '0');
            const timeDiff = Date.now() - lastTimeout;

            if (timeDiff < MESSAGE_BUFFER_SECONDS * 1000 && existingContact.message) {
                // Acumular mensagem
                currentMessages = existingContact.message + '\n' + messageContent;
                console.log(`📝 Acumulando mensagem. Buffer atual: ${currentMessages}`);
            }

            threadId = existingContact.threadid || threadId;

            // Atualizar registro existente - Reset follow-up quando usuário envia mensagem
            await supabase
                .from('n8n_fluxogpt')
                .update({
                    message: currentMessages,
                    timeout: now,
                    whatsappuser: contactNumber,
                    last_message_at: new Date().toISOString(),
                    last_sender: 'user',
                    followup_count: 3  // Quando o usuário responde, encerramos o ciclo de follow-up para ele
                })
                .eq('id', existingContact.id);

            // Registrar Analytics - Nova Mensagem do Usuário
            await updateAnalytics(instanceConfig.idassistentgpt, userId, 'user');

            console.log('⏰ Aguardando mais mensagens por 10 segundos...');

            // Agendar processamento após 10 segundos
            // Nota: Em Edge Functions, usamos uma abordagem diferente
            // Verificamos se devemos processar baseado no timestamp

            // Aguardar e verificar se há novas mensagens
            await new Promise(resolve => setTimeout(resolve, MESSAGE_BUFFER_SECONDS * 1000));

            // Verificar se ainda somos a última mensagem
            const { data: latestData } = await supabase
                .from('n8n_fluxogpt')
                .select('*')
                .eq('id', existingContact.id)
                .single();

            if (latestData && latestData.timeout !== now) {
                console.log('⏭️ Nova mensagem detectada, essa será processada pela próxima requisição');
                return new Response(JSON.stringify({
                    status: 'buffered',
                    message: 'Waiting for newer message processing'
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Pegar mensagens acumuladas
            currentMessages = latestData?.message || currentMessages;
            threadId = latestData?.threadid || threadId;

        } else {
            // Novo contato - criar registro de conversa
            // Não vamos duplicar o registro da instância, vamos usar o existente
            // e apenas atualizar com os dados do contato
            await supabase
                .from('n8n_fluxogpt')
                .update({
                    message: currentMessages,
                    timeout: now,
                    whatsappuser: contactNumber,
                    last_message_at: new Date().toISOString(),
                    last_sender: 'user',
                    followup_count: 3  // Encerra o ciclo para novos contatos também após a primeira resposta
                })
                .eq('id', instanceConfig.id);

            // Registrar Analytics - Nova Mensagem do Usuário e Novo Visitante
            await updateAnalytics(instanceConfig.idassistentgpt, userId, 'user');
            await updateAnalytics(instanceConfig.idassistentgpt, userId, 'visitor');

            // Aguardar buffer
            await new Promise(resolve => setTimeout(resolve, MESSAGE_BUFFER_SECONDS * 1000));

            // Verificar se ainda somos a última mensagem
            const { data: latestData } = await supabase
                .from('n8n_fluxogpt')
                .select('*')
                .eq('id', instanceConfig.id)
                .single();

            if (latestData && latestData.timeout !== now) {
                console.log('⏭️ Nova mensagem detectada, essa será processada pela próxima requisição');
                return new Response(JSON.stringify({
                    status: 'buffered',
                    message: 'Waiting for newer message processing'
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            currentMessages = latestData?.message || currentMessages;
            threadId = latestData?.threadid || threadId;
        }

        console.log(`📨 Processando mensagem completa: ${currentMessages}`);

        // 3. Criar ou usar thread existente do OpenAI
        if (!openaiApiKey) {
            throw new Error('OPENAI_API_KEY não configurada');
        }

        if (!threadId) {
            console.log('🆕 Criando nova thread no OpenAI...');

            const threadResponse = await fetch('https://api.openai.com/v1/threads', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2'
                },
                body: JSON.stringify({})
            });

            if (!threadResponse.ok) {
                const error = await threadResponse.text();
                throw new Error(`Erro ao criar thread: ${error}`);
            }

            const threadData = await threadResponse.json();
            threadId = threadData.id;

            // Salvar thread ID
            await supabase
                .from('n8n_fluxogpt')
                .update({ threadid: threadId })
                .eq('id', existingContact?.id || instanceConfig.id);

            console.log(`✅ Thread criada: ${threadId}`);
        } else {
            console.log(`📎 Usando thread existente: ${threadId}`);
        }

        // Registrar Analytics - Nova Conversa (Início do processamento)
        await updateAnalytics(instanceConfig.idassistentgpt, userId, 'conversation');

        // 4. Adicionar mensagem à thread
        console.log('📤 Enviando mensagem para OpenAI...');

        const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                role: 'user',
                content: currentMessages
            })
        });

        if (!messageResponse.ok) {
            const error = await messageResponse.text();
            throw new Error(`Erro ao adicionar mensagem: ${error}`);
        }

        // 5. Executar o assistente
        console.log('🤖 Executando assistente...');

        const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
                assistant_id: instanceConfig.idassistentgpt
            })
        });

        if (!runResponse.ok) {
            const error = await runResponse.text();
            throw new Error(`Erro ao executar assistente: ${error}`);
        }

        const runData = await runResponse.json();
        const runId = runData.id;

        console.log(`⏳ Run iniciado: ${runId}`);

        // 6. Aguardar conclusão do run (polling)
        let runStatus = 'queued';
        let attempts = 0;
        const maxAttempts = 60; // 60 segundos timeout

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

            console.log(`⏳ Status: ${runStatus} (tentativa ${attempts})`);

            if (runStatus === 'failed' || runStatus === 'cancelled' || runStatus === 'expired') {
                throw new Error(`Assistente falhou: ${runStatus} - ${statusData.last_error?.message || 'Unknown error'}`);
            }

            if (runStatus === 'requires_action') {
                console.log('🛠️ Assistente requer execução de ferramentas...');
                const toolCalls = statusData.required_action.submit_tool_outputs.tool_calls;
                const toolOutputs = [];

                for (const toolCall of toolCalls) {
                    const functionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(`🔧 Executando ferramenta: ${functionName}`, args);

                    let output: any = { success: true };

                    try {
                        // Mapear funções comuns de mídia para a Evolution API
                        if (functionName.includes('image') || functionName.includes('imagem')) {
                            await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                                body: JSON.stringify({
                                    number: contactNumber,
                                    mediatype: 'image',
                                    media: args.url || args.image_url || args.media,
                                    caption: args.caption || args.text || '',
                                    delay: 2
                                })
                            });
                        } else if (functionName.includes('video')) {
                            await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                                body: JSON.stringify({
                                    number: contactNumber,
                                    mediatype: 'video',
                                    media: args.url || args.video_url || args.media,
                                    caption: args.caption || args.text || '',
                                    delay: 2
                                })
                            });
                        } else if (functionName.includes('audio') || functionName.includes('voz')) {
                            await fetch(`${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${instanceName}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                                body: JSON.stringify({
                                    number: contactNumber,
                                    audio: args.url || args.audio_url || args.media,
                                    delay: 2
                                })
                            });
                        } else if (functionName.includes('document') || functionName.includes('arquivo')) {
                            await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                                body: JSON.stringify({
                                    number: contactNumber,
                                    mediatype: 'document',
                                    media: args.url || args.document_url || args.media,
                                    fileName: args.fileName || args.file_name || 'documento',
                                    delay: 2
                                })
                            });
                        }
                    } catch (toolErr) {
                        console.error(`❌ Erro ao executar ferramenta ${functionName}:`, toolErr);
                        output = { success: false, error: toolErr instanceof Error ? toolErr.message : 'Unknown error' };
                    }

                    toolOutputs.push({
                        tool_call_id: toolCall.id,
                        output: JSON.stringify(output)
                    });
                }

                // Enviar resultados de volta para a OpenAI
                console.log('📤 Enviando resultados das ferramentas...');
                await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openaiApiKey}`,
                        'Content-Type': 'application/json',
                        'OpenAI-Beta': 'assistants=v2'
                    },
                    body: JSON.stringify({ tool_outputs: toolOutputs })
                });

                // Continuar o loop de polling
                continue;
            }
        }

        if (runStatus !== 'completed') {
            throw new Error(`Timeout na execução do assistente. Status: ${runStatus}`);
        }

        // 7. Buscar resposta do assistente
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

        const assistantResponse = assistantMessage.content[0].text.value;
        console.log(`🤖 Resposta: ${assistantResponse.substring(0, 100)}...`);

        // 8. Limpar buffer de mensagens e marcar como resposta do bot
        await supabase
            .from('n8n_fluxogpt')
            .update({
                message: null,
                last_message_at: new Date().toISOString(),
                last_sender: 'bot'
            })
            .eq('id', existingContact?.id || instanceConfig.id);

        // 9. Verificar se deve converter para áudio (ElevenLabs)
        // Regra: Responde em áudio APENAS se o usuário mandou áudio E ElevenLabs está configurado
        let responseToSend = assistantResponse;
        let sendAsAudio = false;

        const shouldRespondWithAudio = messageType === 'audio' && instanceConfig.ApiELEVEN && instanceConfig.IDvoz;

        if (shouldRespondWithAudio) {
            console.log('🔊 Usuário mandou áudio, respondendo em áudio via ElevenLabs...');

            try {
                const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${instanceConfig.IDvoz}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': instanceConfig.ApiELEVEN
                    },
                    body: JSON.stringify({
                        text: assistantResponse,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75
                        }
                    })
                });

                if (elevenLabsResponse.ok) {
                    // Converter áudio para base64
                    const audioBuffer = await elevenLabsResponse.arrayBuffer();
                    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

                    // Enviar como áudio via Evolution API
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
                        sendAsAudio = true;
                        console.log('✅ Áudio enviado com sucesso');
                        // Registrar Analytics - Resposta do Bot
                        await updateAnalytics(instanceConfig.idassistentgpt, userId, 'assistant');
                    } else {
                        console.warn('⚠️ Falha ao enviar áudio, enviando como texto');
                    }
                } else {
                    console.warn('⚠️ Falha ao gerar áudio, enviando como texto');
                }
            } catch (audioError) {
                console.warn('⚠️ Erro ao processar áudio:', audioError);
            }
        }

        // 10. Detectar mídias na resposta e enviar se for o caso
        let finalAssistantResponse = assistantResponse;
        const mediaRegex = /(https?:\/\/[^\s]+?\.(jpg|jpeg|png|gif|mp4|mov|pdf|doc|docx|xls|xlsx|ppt|pptx))/gi;
        const mediaMatches = assistantResponse.match(mediaRegex);

        if (mediaMatches) {
            console.log(`📎 Mídia(s) detectada(s) na resposta: ${mediaMatches.length}`);
            for (const mediaUrl of mediaMatches) {
                try {
                    const ext = mediaUrl.split('.').pop()?.toLowerCase();
                    let mediaType: 'image' | 'video' | 'document' = 'document';

                    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) mediaType = 'image';
                    else if (['mp4', 'mov'].includes(ext || '')) mediaType = 'video';

                    console.log(`📤 Enviando mídia (${mediaType}): ${mediaUrl}`);

                    const sendMediaResponse = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': EVOLUTION_API_KEY
                        },
                        body: JSON.stringify({
                            number: contactNumber,
                            mediatype: mediaType,
                            media: mediaUrl,
                            delay: 2
                        })
                    });

                    if (sendMediaResponse.ok) {
                        console.log(`✅ Mídia enviada com sucesso`);
                        // Opcional: remover a URL do texto para ficar mais limpo
                        finalAssistantResponse = finalAssistantResponse.replace(mediaUrl, '').trim();
                    } else {
                        console.warn(`⚠️ Falha ao enviar mídia (${mediaType}): ${await sendMediaResponse.text()}`);
                    }
                } catch (mediaSendError) {
                    console.error('❌ Erro ao processar envio de mídia:', mediaSendError);
                }
            }
        }

        // 11. Enviar resposta como texto (se não enviou como áudio)
        if (!sendAsAudio && finalAssistantResponse.trim()) {
            console.log('📤 Enviando resposta via WhatsApp...');

            // Quebrar em chunks para parecer mais humano
            const chunks = breakMessageIntoChunks(finalAssistantResponse);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];

                // Simular "digitando..." antes da mensagem
                try {
                    await fetch(`${EVOLUTION_API_URL}/chat/sendPresence/${instanceName}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': EVOLUTION_API_KEY
                        },
                        body: JSON.stringify({
                            number: contactNumber,
                            presence: 'composing'
                        })
                    });
                } catch (e) {
                    console.log('⚠️ Não foi possível enviar presença de digitação');
                }

                // Delay curto antes de enviar (500ms-1s)
                const typingDelay = Math.min(Math.max(chunk.length * 10, 500), 1000);
                await new Promise(resolve => setTimeout(resolve, typingDelay));

                const sendResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': EVOLUTION_API_KEY
                    },
                    body: JSON.stringify({
                        number: contactNumber,
                        text: chunk
                    })
                });

                if (!sendResponse.ok) {
                    const error = await sendResponse.text();
                    console.error(`❌ Erro ao enviar mensagem ${i + 1}:`, error);
                } else {
                    console.log(`✅ Mensagem ${i + 1}/${chunks.length} enviada`);
                    // Registrar Analytics - Resposta do Bot (apenas na primeira parte para não inflar métricas de conversação, 
                    // mas total_messages conta cada chunk como uma mensagem para refletir custo/uso)
                    await updateAnalytics(instanceConfig.idassistentgpt, userId, 'assistant');
                }

                // Delay curto entre mensagens (500ms-1s)
                if (i < chunks.length - 1) {
                    const pauseDelay = 500 + Math.random() * 500;
                    await new Promise(resolve => setTimeout(resolve, pauseDelay));
                }
            }
        }

        // --- LÓGICA DE CRM LEADS (Profiling em Background) ---
        // Não esperamos o profiling terminar para responder ao WhatsApp (velocidade é prioridade)
        console.log('📈 Iniciando Profiling de Lead para o CRM...');
        processCRMLead(
            instanceConfig.idassistentgpt,
            userId,
            contactNumber,
            `Usuário: ${currentMessages}\nAssistente: ${assistantResponse}`,
            openaiApiKey
        ).catch(e => console.error('❌ Erro no background profiling:', e));

        console.log('🎉 Processamento concluído com sucesso!');

        return new Response(JSON.stringify({
            status: 'success',
            instance: instanceName,
            contact: contactNumber,
            messageReceived: currentMessages,
            responseLength: assistantResponse.length,
            sentAsAudio: sendAsAudio
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Erro no webhook:', error);

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

/**
 * Quebra mensagem em chunks para envio humanizado
 * - Primeiro tenta quebrar por \n (parágrafos)
 * - Se não tiver \n, quebra a cada 2 frases (.!?)
 */
function breakMessageIntoChunks(message: string): string[] {
    // Primeiro tenta dividir por \n
    const partes = message.split('\n').map(p => p.trim()).filter(p => p !== '');

    // Se conseguiu dividir em múltiplas partes, usa isso
    if (partes.length > 1) {
        console.log(`📝 Dividido por \\n em ${partes.length} partes`);
        return partes;
    }

    // Se é um bloco só, divide a cada 2 frases
    const chunks: string[] = [];
    let currentChunk = '';
    let sentenceCount = 0;

    // Percorre caractere por caractere
    for (let i = 0; i < message.length; i++) {
        currentChunk += message[i];

        // Se é fim de frase (.!?) e próximo char é espaço ou fim
        if ((message[i] === '.' || message[i] === '!' || message[i] === '?') &&
            (i === message.length - 1 || message[i + 1] === ' ')) {
            sentenceCount++;

            // A cada 2 frases, cria um novo chunk
            if (sentenceCount >= 2) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
                sentenceCount = 0;
            }
        }
    }

    // Adiciona o que sobrou
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    // Se conseguiu dividir, retorna
    if (chunks.length > 1) {
        console.log(`📝 Dividido por frases em ${chunks.length} partes`);
        return chunks;
    }

    // Se não conseguiu dividir, retorna a mensagem inteira
    console.log(`📝 Mensagem não foi dividida (sem \\n e poucas frases)`);
    return [message.trim()];
}

/**
 * Atualiza métricas de analytics em tempo real
 */
async function updateAnalytics(assistantId: string, userId: string, type: 'user' | 'assistant' | 'conversation' | 'visitor') {
    if (!assistantId || !userId) return;

    const today = new Date().toISOString().split('T')[0];
    console.log(`📊 Atualizando analytics: ${type} para assistente ${assistantId}`);

    try {
        // Tentar buscar registro hoje
        const { data: analytics, error: fetchError } = await supabase
            .from('widget_analytics')
            .select('*')
            .eq('assistant_id', assistantId)
            .eq('date', today)
            .maybeSingle();

        if (fetchError) {
            console.error('❌ Erro ao buscar analytics:', fetchError);
            return;
        }

        if (!analytics) {
            // Criar novo registro para hoje
            const { error: insertError } = await supabase
                .from('widget_analytics')
                .insert({
                    assistant_id: assistantId,
                    user_id: userId,
                    date: today,
                    unique_visitors: type === 'visitor' ? 1 : 0,
                    total_conversations: type === 'conversation' ? 1 : 0,
                    total_messages: (type === 'user' || type === 'assistant') ? 1 : 0,
                    total_user_messages: type === 'user' ? 1 : 0,
                    total_bot_messages: type === 'assistant' ? 1 : 0
                });

            if (insertError) console.error('❌ Erro ao criar analytics:', insertError);
        } else {
            // Atualizar existente
            const update: any = { updated_at: new Date().toISOString() };

            if (type === 'visitor') update.unique_visitors = (analytics.unique_visitors || 0) + 1;
            if (type === 'conversation') update.total_conversations = (analytics.total_conversations || 0) + 1;
            if (type === 'user' || type === 'assistant') {
                update.total_messages = (analytics.total_messages || 0) + 1;
                if (type === 'user') update.total_user_messages = (analytics.total_user_messages || 0) + 1;
                if (type === 'assistant') update.total_bot_messages = (analytics.total_bot_messages || 0) + 1;
            }

            const { error: updateError } = await supabase
                .from('widget_analytics')
                .update(update)
                .eq('id', analytics.id);

            if (updateError) console.error('❌ Erro ao atualizar analytics:', updateError);
        }
    } catch (err) {
        console.error('❌ Erro global no updateAnalytics:', err);
    }
}

/**
 * Processa a conversa para extrair informações do Lead para o CRM
 */
async function processCRMLead(assistantId: string, userId: string, whatsappNumber: string, conversation: string, apiKey: string) {
    if (!assistantId || !userId || !apiKey) return;

    try {
        console.log('🧠 Extraindo dados do lead via IA...');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Modelo rápido e barato para extração
                messages: [
                    {
                        role: 'system',
                        content: `Você é um analista de CRM. Sua tarefa é extrair informações de uma conversa de WhatsApp.
                        Retorne APENAS um JSON plano com as seguintes chaves:
                        - name: Nome do cliente (se identificado, senão deixe null)
                        - email: Email do cliente (se identificado, senão deixe null)
                        - lead_score: Um número de 0 a 100 baseado no interesse de compra (0=curioso, 100=pronto para comprar)
                        - intent_summary: Um resumo de 1 frase do que o cliente quer.`
                    },
                    {
                        role: 'user',
                        content: `Conversa:\n${conversation}`
                    }
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) throw new Error('Falha na extração GPT');

        const data = await response.json();
        const profiling = JSON.parse(data.choices[0].message.content);

        console.log('📊 Dados extraídos p/ CRM:', profiling);

        // Upsert na tabela crm_leads
        // Procurar lead existente
        const { data: existingLead } = await supabase
            .from('crm_leads')
            .select('id')
            .eq('user_id', userId)
            .eq('whatsapp_number', whatsappNumber)
            .maybeSingle();

        const leadData: any = {
            user_id: userId,
            assistant_id: assistantId,
            whatsapp_number: whatsappNumber,
            last_interaction: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (profiling.name) leadData.name = profiling.name;
        if (profiling.email) leadData.email = profiling.email;
        if (profiling.lead_score !== undefined) leadData.lead_score = profiling.lead_score;
        if (profiling.intent_summary) leadData.intent_summary = profiling.intent_summary;

        if (existingLead) {
            console.log('📝 Atualizando lead existente no CRM...');
            await supabase
                .from('crm_leads')
                .update(leadData)
                .eq('id', existingLead.id);
        } else {
            console.log('🆕 Criando novo lead no CRM...');
            await supabase
                .from('crm_leads')
                .insert(leadData);
        }

    } catch (err) {
        console.error('⚠️ Falha no profiling/CRM:', err);
    }
}

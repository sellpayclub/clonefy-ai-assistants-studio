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

// Configurações
const MESSAGE_BUFFER_SECONDS = 8; // Tempo para acumular mensagens

// Supabase Client com service role para bypass RLS
const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper para salvar arquivos no CRM
interface SaveAttachmentParams {
    supabase: any;
    base64Data: string;
    fileName: string;
    mimeType: string;
    fileType: 'image' | 'document';
    source: 'whatsapp' | 'widget';
    contactNumber: string;
    instanceName: string;
    aiDescription: string | null;
}

async function saveAttachmentToCRM(params: SaveAttachmentParams) {
    const { supabase, base64Data, fileName, mimeType, fileType, source, contactNumber, instanceName, aiDescription } = params;

    try {
        // 1. Buscar lead pelo número e instância
        const { data: instanceConfig } = await supabase
            .from('n8n_fluxogpt')
            .select('userId')
            .eq('nomeinstancia', instanceName)
            .not('emailuser', 'is', null)
            .limit(1)
            .maybeSingle();

        if (!instanceConfig?.userId) {
            console.log('⚠️ Não foi possível identificar user_id para salvar anexo');
            return;
        }

        const userId = instanceConfig.userId;

        // 2. Buscar ou criar lead
        const { data: existingLead } = await supabase
            .from('crm_leads')
            .select('id')
            .eq('user_id', userId)
            .eq('whatsapp_number', contactNumber)
            .maybeSingle();

        let leadId = existingLead?.id;

        if (!leadId) {
            // Criar lead básico se não existir
            const { data: newLead } = await supabase
                .from('crm_leads')
                .insert({
                    user_id: userId,
                    whatsapp_number: contactNumber,
                    source: 'whatsapp',
                    status: 'new',
                    lead_score: 0
                })
                .select('id')
                .single();

            leadId = newLead?.id;
        }

        if (!leadId) {
            console.log('⚠️ Não foi possível criar/encontrar lead para anexo');
            return;
        }

        // 3. Converter base64 para Blob e fazer upload no storage
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const fileExtension = fileName.split('.').pop() || 'bin';
        const uniqueFileName = `${userId}/${leadId}/${Date.now()}_${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('lead-files')
            .upload(uniqueFileName, bytes, {
                contentType: mimeType,
                upsert: false
            });

        if (uploadError) {
            console.error('❌ Erro ao fazer upload do arquivo:', uploadError);
            return;
        }

        // 4. Obter URL pública
        const { data: urlData } = supabase.storage
            .from('lead-files')
            .getPublicUrl(uniqueFileName);

        const fileUrl = urlData?.publicUrl;

        // 5. Salvar metadados na tabela de anexos
        const { error: insertError } = await supabase
            .from('crm_lead_attachments')
            .insert({
                lead_id: leadId,
                user_id: userId,
                file_name: fileName,
                file_url: fileUrl,
                file_type: fileType,
                mime_type: mimeType,
                file_size: bytes.length,
                source: source,
                ai_description: aiDescription
            });

        if (insertError) {
            console.error('❌ Erro ao salvar metadados do anexo:', insertError);
            return;
        }

        console.log(`✅ Anexo salvo no CRM: ${fileName} (${fileType})`);
    } catch (error) {
        console.error('❌ Erro ao salvar anexo no CRM:', error);
    }
}

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
        
        // Log resumido para debug (evita explodir console)
        const logSummary = {
            event: payload.event,
            instance: payload.instance,
            fromMe: payload.data?.key?.fromMe,
            remoteJid: payload.data?.key?.remoteJid,
            messageType: payload.data?.message?.conversation ? 'text' : 
                         payload.data?.message?.extendedTextMessage ? 'extendedText' :
                         payload.data?.message?.audioMessage ? 'audio' :
                         payload.data?.message?.imageMessage ? 'image' :
                         payload.data?.message?.documentMessage ? 'document' :
                         payload.data?.message?.videoMessage ? 'video' : 'other',
            textPreview: (payload.data?.message?.conversation || payload.data?.message?.extendedTextMessage?.text || '').substring(0, 50)
        };
        console.log('📥 Payload resumido:', JSON.stringify(logSummary));

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
                .maybeSingle();

            if (existingContact) {
                // Ativar pausa de 2 horas
                const takeoverUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

                await supabase
                    .from('n8n_fluxogpt')
                    .update({ human_takeover_until: takeoverUntil })
                    .eq('id', existingContact.id);

                // 📺 Sincronizar com Live Chat Sessions
                await supabase
                    .from('live_chat_sessions')
                    .update({ 
                        status: 'human_takeover',
                        human_takeover_until: takeoverUntil 
                    })
                    .eq('instance_name', instanceName)
                    .eq('contact_number', contactNumber);

                console.log(`⏸️ HUMAN TAKEOVER ATIVADO! IA pausada até ${takeoverUntil} para contato ${contactNumber}`);
                console.log('📺 Live Chat: Status atualizado para human_takeover');

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
                                    console.log(`✅ Base64 obtido via Evolution API: ${base64Audio?.length ?? 0} caracteres`);
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
                            base64Audio = base64Encode(new Uint8Array(arrayBuffer));
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
            let aiDescription = '';

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
                            aiDescription = visionData.choices[0].message.content;
                            messageContent = `[USÚARIO ENVIOU UMA IMAGEM]\nLegenda: ${caption}\nDescrição da imagem: ${aiDescription}`;
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

            // 📁 SALVAR IMAGEM NO CRM - Enviar para storage em background
            if (base64Image) {
                console.log('📁 Salvando imagem no CRM...');
                saveAttachmentToCRM({
                    supabase,
                    base64Data: base64Image,
                    fileName: `image_${Date.now()}.jpg`,
                    mimeType: 'image/jpeg',
                    fileType: 'image',
                    source: 'whatsapp',
                    contactNumber,
                    instanceName,
                    aiDescription
                }).catch(e => console.error('❌ Erro ao salvar imagem no CRM:', e));
            }
        } else if (payload.data.message?.documentMessage) {
            messageType = 'document';
            const doc = payload.data.message.documentMessage;
            messageContent = `[USUÁRIO ENVIOU UM DOCUMENTO]\nNome: ${doc.fileName}\nTipo: ${doc.mimetype}`;

            // 📁 SALVAR DOCUMENTO NO CRM
            console.log('📁 Processando documento para CRM...');
            try {
                // Buscar base64 do documento via Evolution API
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
                        saveAttachmentToCRM({
                            supabase,
                            base64Data: mediaData.base64,
                            fileName: doc.fileName || `document_${Date.now()}`,
                            mimeType: doc.mimetype || 'application/octet-stream',
                            fileType: 'document',
                            source: 'whatsapp',
                            contactNumber,
                            instanceName,
                            aiDescription: null
                        }).catch(e => console.error('❌ Erro ao salvar documento no CRM:', e));
                    }
                }
            } catch (docError) {
                console.error('❌ Erro ao processar documento para CRM:', docError);
            }
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

        // 🔒 HUMAN TAKEOVER CHECK PRIMÁRIO: Verificar no live_chat_sessions (fonte da verdade)
        // Isso garante que quando o operador pausar a IA no painel, ela realmente pare de responder
        const { data: liveSession } = await supabase
            .from('live_chat_sessions')
            .select('id, status, human_takeover_until')
            .eq('instance_name', instanceName)
            .eq('contact_number', contactNumber)
            .maybeSingle();

        if (liveSession) {
            const isHumanTakeover = liveSession.status === 'human_takeover';
            const takeoverUntil = liveSession.human_takeover_until ? new Date(liveSession.human_takeover_until) : null;
            
            if (isHumanTakeover && takeoverUntil && takeoverUntil > new Date()) {
                const remainingMinutes = Math.ceil((takeoverUntil.getTime() - Date.now()) / (1000 * 60));
                console.log(`🔒 HUMAN TAKEOVER ATIVO (live_chat_sessions)! IA pausada até ${liveSession.human_takeover_until} (${remainingMinutes} min restantes)`);
                console.log(`👤 Operador está atendendo o contato ${contactNumber} - IA NÃO responderá`);

                // Ainda precisamos salvar a mensagem do cliente no Live Chat antes de sair
                // Buscar config para obter userId
                const { data: instanceConfigForMsg } = await supabase
                    .from('n8n_fluxogpt')
                    .select('userId')
                    .eq('nomeinstancia', instanceName)
                    .not('emailuser', 'is', null)
                    .limit(1)
                    .maybeSingle();

                if (instanceConfigForMsg?.userId) {
                    // Salvar mensagem do cliente (mesmo com IA pausada)
                    await supabase
                        .from('live_chat_messages')
                        .insert({
                            user_id: instanceConfigForMsg.userId,
                            session_id: liveSession.id,
                            instance_name: instanceName,
                            contact_number: contactNumber,
                            contact_name: contactName,
                            sender_type: 'customer',
                            content: messageContent,
                            message_type: messageType,
                            source: 'whatsapp'
                        });

                    // Atualizar sessão com preview
                    await supabase
                        .from('live_chat_sessions')
                        .update({
                            last_message_at: new Date().toISOString(),
                            last_message_preview: messageContent.substring(0, 100),
                            last_sender_type: 'customer',
                            unread_count: (liveSession as any).unread_count ? (liveSession as any).unread_count + 1 : 1
                        })
                        .eq('id', liveSession.id);

                    console.log('📺 Live Chat: Mensagem salva mesmo com IA pausada');
                }

                return new Response(JSON.stringify({
                    status: 'paused',
                    reason: 'human_takeover_live_chat',
                    contact: contactNumber,
                    resumesAt: liveSession.human_takeover_until,
                    remainingMinutes: remainingMinutes,
                    message: 'IA pausada - operador está atendendo este contato'
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            } else if (isHumanTakeover && takeoverUntil && takeoverUntil <= new Date()) {
                // Takeover expirou - reativar IA
                console.log('✅ Human Takeover expirado - reativando IA automaticamente');
                await supabase
                    .from('live_chat_sessions')
                    .update({ 
                        status: 'ai_active',
                        human_takeover_until: null 
                    })
                    .eq('id', liveSession.id);
            }
        }

        // 1. Buscar configuração da instância (registro base com emailuser preenchido)
        const { data: instanceConfig, error: instanceError } = await supabase
            .from('n8n_fluxogpt')
            .select('*')
            .eq('nomeinstancia', instanceName)
            .not('emailuser', 'is', null)
            .limit(1)
            .maybeSingle();

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

        // 🔧 CORREÇÃO CRÍTICA: Buscar assistente por openai_assistant_id (não por UUID)
        // O campo idassistentgpt contém o OpenAI assistant ID (ex: asst_...)
        // Precisamos do UUID interno (assistants.id) para CRM e Analytics
        let assistantData: { id: string; user_id: string; name: string; openai_assistant_id: string } | null = null;
        
        // Primeiro: tentar buscar por openai_assistant_id
        const { data: assistantByOpenAI } = await supabase
            .from('assistants')
            .select('id, user_id, name, openai_assistant_id')
            .eq('openai_assistant_id', instanceConfig.idassistentgpt)
            .single();
        
        if (assistantByOpenAI) {
            assistantData = assistantByOpenAI;
            console.log('✅ Assistente encontrado por openai_assistant_id');
        } else {
            // Fallback: tentar buscar por UUID (caso legado)
            const { data: assistantByUUID } = await supabase
                .from('assistants')
                .select('id, user_id, name, openai_assistant_id')
                .eq('id', instanceConfig.idassistentgpt)
                .single();
            
            if (assistantByUUID) {
                assistantData = assistantByUUID;
                console.log('✅ Assistente encontrado por UUID (legado)');
            }
        }

        // Variáveis normalizadas para uso em todo o código
        const assistantUuid = assistantData?.id || '';  // UUID interno (para CRM e Analytics)
        const openaiAssistantId = assistantData?.openai_assistant_id || instanceConfig.idassistentgpt;  // Para OpenAI API
        const userId = assistantData?.user_id || instanceConfig.userId || '';
        const assistantName = assistantData?.name || 'Assistente';

        console.log('🤖 Mapeamento de assistente:', {
            openaiId: openaiAssistantId,
            uuid: assistantUuid || '(não encontrado)',
            userId: userId || '(não encontrado)',
            name: assistantName
        });

        // 📺 LIVE CHAT: Salvar mensagem do cliente e atualizar sessão
        let liveChatSessionId: string | null = null;
        try {
            // Buscar ou criar sessão (inclui unread_count para incremento seguro)
            const { data: existingSession } = await supabase
                .from('live_chat_sessions')
                .select('id, unread_count')
                .eq('user_id', userId)
                .eq('instance_name', instanceName)
                .eq('contact_number', contactNumber)
                .maybeSingle();

            if (existingSession) {
                liveChatSessionId = existingSession.id;
                // Atualizar sessão existente
                await supabase
                    .from('live_chat_sessions')
                    .update({
                        last_message_at: new Date().toISOString(),
                        last_message_preview: messageContent.substring(0, 100),
                        last_sender_type: 'customer',
                        unread_count: ((existingSession as any).unread_count || 0) + 1,
                        contact_name: contactName
                    })
                    .eq('id', existingSession.id);
            } else if (userId) {
                // Criar nova sessão
                const { data: newSession } = await supabase
                    .from('live_chat_sessions')
                    .insert({
                        user_id: userId,
                        instance_name: instanceName,
                        contact_number: contactNumber,
                        contact_name: contactName,
                        source: 'whatsapp',
                        status: 'ai_active',
                        assistant_id: openaiAssistantId,
                        assistant_name: assistantName,
                        last_message_at: new Date().toISOString(),
                        last_message_preview: messageContent.substring(0, 100),
                        last_sender_type: 'customer',
                        unread_count: 1
                    })
                    .select('id')
                    .single();
                
                liveChatSessionId = newSession?.id || null;
            }

            // Salvar mensagem do cliente
            if (userId) {
                await supabase
                    .from('live_chat_messages')
                    .insert({
                        user_id: userId,
                        session_id: liveChatSessionId,
                        instance_name: instanceName,
                        contact_number: contactNumber,
                        contact_name: contactName,
                        sender_type: 'customer',
                        content: messageContent,
                        message_type: messageType,
                        source: 'whatsapp',
                        assistant_id: openaiAssistantId,
                        assistant_name: assistantName
                    });
            }
            console.log('📺 Live Chat: Mensagem do cliente salva');
        } catch (liveChatError) {
            console.error('⚠️ Live Chat error (non-blocking):', liveChatError);
        }

        // 2. Buscar ou criar registro para este contato
        // Verificar se já existe um registro com este contato
        let { data: existingContact } = await supabase
            .from('n8n_fluxogpt')
            .select('*')
            .eq('nomeinstancia', instanceName)
            .eq('whatsappuser', contactNumber)
            .maybeSingle();

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
        let threadId = null; // NUNCA herdar thread da instancia - cada contato tem sua propria thread

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
            await updateAnalytics(assistantUuid, userId, 'user');

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
            // Novo contato - INSERIR nova linha isolada (nunca sobrescrever a config da instancia)
            console.log(`🆕 Novo contato ${contactNumber} - criando registro isolado`);
            const { data: newContactData, error: insertError } = await supabase
                .from('n8n_fluxogpt')
                .insert({
                    nomeinstancia: instanceName,
                    idassistentgpt: instanceConfig.idassistentgpt,
                    whatsappuser: contactNumber,
                    message: currentMessages,
                    timeout: now,
                    last_message_at: new Date().toISOString(),
                    last_sender: 'user',
                    followup_count: 3
                })
                .select()
                .single();

            if (insertError) {
                console.error('❌ Erro ao inserir novo contato:', insertError);
                throw new Error(`Erro ao criar registro do contato: ${insertError.message}`);
            }

            const newContactId = newContactData.id;
            console.log(`✅ Registro criado para contato ${contactNumber} com id ${newContactId}`);

            // Registrar Analytics - Nova Mensagem do Usuário e Novo Visitante
            await updateAnalytics(assistantUuid, userId, 'user');
            await updateAnalytics(assistantUuid, userId, 'visitor');

            // Aguardar buffer
            await new Promise(resolve => setTimeout(resolve, MESSAGE_BUFFER_SECONDS * 1000));

            // Verificar se ainda somos a última mensagem - agora na linha do CONTATO
            const { data: latestData } = await supabase
                .from('n8n_fluxogpt')
                .select('*')
                .eq('id', newContactId)
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

            // Guardar referencia para salvar threadId depois
            existingContact = newContactData;
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
        await updateAnalytics(assistantUuid, userId, 'conversation');

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
                assistant_id: openaiAssistantId  // Usar OpenAI assistant ID (asst_...)
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
                        // ======== AGENDIFY TOOL CALLS ========
                        if (functionName.startsWith('agendify_')) {
                            console.log(`📅 Executando ferramenta Agendify: ${functionName}`);
                            
                            // Mapear nome da função para action do proxy
                            const actionMap: Record<string, string> = {
                                'agendify_list_services': 'list_services',
                                'agendify_list_professionals': 'list_professionals',
                                'agendify_check_availability': 'check_availability',
                                'agendify_create_appointment': 'create_appointment',
                                'agendify_cancel_appointment': 'cancel_appointment',
                                'agendify_list_appointments': 'list_appointments',
                                'agendify_search_clients': 'search_clients',
                            };
                            
                            const action = actionMap[functionName];
                            if (action) {
                                // Chamar o proxy do Agendify
                                const proxyResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/agendify-proxy`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                                    },
                                    body: JSON.stringify({
                                        action,
                                        assistant_id: assistantUuid,
                                        ...args
                                    })
                                });
                                
                                if (proxyResponse.ok) {
                                    output = await proxyResponse.json();
                                    console.log(`✅ Agendify ${action} executado com sucesso`);
                                } else {
                                    const errorText = await proxyResponse.text();
                                    console.error(`❌ Agendify ${action} falhou:`, errorText);
                                    output = { success: false, error: 'Erro ao processar solicitação de agendamento', message: 'Desculpe, ocorreu um erro ao acessar o sistema de agendamentos. Tente novamente.' };
                                }
                            } else {
                                output = { success: false, error: `Função Agendify desconhecida: ${functionName}` };
                            }
                        }
                        // ======== MEDIA TOOL CALLS ========
                        else if (functionName.includes('image') || functionName.includes('imagem')) {
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

        // 📺 LIVE CHAT: Salvar resposta da IA
        try {
            if (userId && liveChatSessionId) {
                await supabase
                    .from('live_chat_messages')
                    .insert({
                        user_id: userId,
                        session_id: liveChatSessionId,
                        instance_name: instanceName,
                        contact_number: contactNumber,
                        contact_name: contactName,
                        sender_type: 'ai',
                        content: assistantResponse,
                        message_type: 'text',
                        source: 'whatsapp',
                        assistant_id: openaiAssistantId,
                        assistant_name: assistantName
                    });

                // Atualizar sessão
                await supabase
                    .from('live_chat_sessions')
                    .update({
                        last_message_at: new Date().toISOString(),
                        last_message_preview: assistantResponse.substring(0, 100),
                        last_sender_type: 'ai'
                    })
                    .eq('id', liveChatSessionId);

                console.log('📺 Live Chat: Resposta da IA salva');
            }
        } catch (liveChatError) {
            console.error('⚠️ Live Chat AI response error (non-blocking):', liveChatError);
        }

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
                    const audioBase64 = base64Encode(new Uint8Array(audioBuffer));

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
                        await updateAnalytics(assistantUuid, userId, 'assistant');
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
                    await updateAnalytics(assistantUuid, userId, 'assistant');
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
            assistantUuid,  // UUID interno do assistente (para CRM)
            userId,
            contactNumber,
            instanceName,  // Novo parâmetro para buscar histórico completo
            contactName,   // NOVO: Nome do WhatsApp (pushName) para usar como fallback
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
 * Versão expandida: busca histórico completo e extrai análise detalhada igual ao Widget
 */
async function processCRMLead(
    assistantId: string, 
    userId: string, 
    whatsappNumber: string, 
    instanceName: string,  // NOVO parâmetro para buscar histórico
    whatsappName: string,  // NOVO: Nome do contato no WhatsApp (pushName)
    conversation: string, 
    apiKey: string
) {
    if (!assistantId || !userId || !apiKey) return;

    try {
        console.log('🧠 [WhatsApp CRM] Buscando histórico completo da conversa...');

        // Buscar TODAS as mensagens do Live Chat para este contato
        const { data: allMessages } = await supabase
            .from('live_chat_messages')
            .select('sender_type, content, created_at')
            .eq('instance_name', instanceName)
            .eq('contact_number', whatsappNumber)
            .order('created_at', { ascending: true })
            .limit(50);

        // Formatar conversa completa
        let fullConversation = conversation;
        if (allMessages && allMessages.length > 0) {
            fullConversation = allMessages
                .map(m => `${m.sender_type === 'customer' ? 'Cliente' : 'Assistente'}: ${m.content}`)
                .join('\n\n');
        }

        console.log(`🧠 [WhatsApp CRM] Analisando ${allMessages?.length || 0} mensagens via IA...`);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `Você é um analista de CRM experiente. Analise a conversa completa de WhatsApp e extraia informações detalhadas para o time de vendas.

Retorne APENAS um JSON com as seguintes chaves:
{
  "name": "Nome do cliente (null se não identificado)",
  "email": "Email do cliente (null se não identificado)",
  "lead_score": 0-100 baseado em interesse REAL de compra (0=só curiosidade, 100=pronto para comprar AGORA),
  "urgency_level": "baixa | média | alta | imediata",
  "sentiment": "positivo | neutro | negativo | misto",
  "intent_summary": "Resumo de 2-3 frases do objetivo principal do cliente",
  "conversation_analysis": "Análise DETALHADA em 3-5 parágrafos sobre: contexto da conversa, comportamento do cliente, pontos de interesse, objeções levantadas, e recomendações para o vendedor",
  "key_topics": ["lista", "de", "tópicos", "principais", "discutidos"],
  "customer_questions": ["perguntas", "específicas", "que", "o", "cliente", "fez"],
  "objections": ["objeções", "preocupações", "ou", "hesitações", "do", "cliente"],
  "products_mentioned": ["produtos", "serviços", "ou", "planos", "mencionados"],
  "next_action": "Próximo passo ESPECÍFICO recomendado para o vendedor (ex: ligar para confirmar, enviar proposta, agendar demo)",
  "pipeline_stage": "novo | contato feito | qualificado | proposta | negociacao | fechado | perdido - classifique baseado no estágio REAL da negociação: novo=primeiro contato, contato feito=já conversaram, qualificado=interesse real demonstrado, proposta=preço discutido, negociacao=comparando/pedindo desconto, fechado=compra confirmada, perdido=recusou ou sumiu"
}

SEJA DETALHADO! O vendedor vai usar essa análise para fechar a venda.`
                    },
                    {
                        role: 'user',
                        content: `Conversa completa do WhatsApp:\n\n${fullConversation}`
                    }
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) throw new Error('Falha na extração GPT');

        const data = await response.json();
        const profiling = JSON.parse(data.choices[0].message.content);

        console.log('📊 [WhatsApp CRM] Dados extraídos:', {
            name: profiling.name,
            score: profiling.lead_score,
            urgency: profiling.urgency_level,
            sentiment: profiling.sentiment
        });

        // Preparar dados do lead COM TODOS OS CAMPOS
        const leadData: any = {
            user_id: userId,
            assistant_id: assistantId,
            whatsapp_number: whatsappNumber,
            source: 'whatsapp',  // ✅ CRÍTICO - Agora define corretamente
            last_interaction: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // 🔑 NOME: Priorizar nome extraído pela IA, mas usar pushName do WhatsApp como fallback
        // Isso evita leads "Desconhecido" quando o nome está disponível no WhatsApp
        const extractedName = profiling.name;
        const finalName = extractedName && extractedName !== 'null' && extractedName !== 'Cliente' 
            ? extractedName 
            : (whatsappName && whatsappName !== 'Cliente' ? whatsappName : null);
        
        if (finalName) leadData.name = finalName;
        console.log(`📛 CRM Nome: IA="${extractedName}" | WhatsApp="${whatsappName}" | Final="${finalName}"`);

        if (profiling.email) leadData.email = profiling.email;
        if (profiling.lead_score !== undefined) leadData.lead_score = profiling.lead_score;
        if (profiling.intent_summary) leadData.intent_summary = profiling.intent_summary;

        // Campos avançados (NOVOS para WhatsApp)
        if (profiling.conversation_analysis) leadData.conversation_analysis = profiling.conversation_analysis;
        if (profiling.key_topics) leadData.key_topics = profiling.key_topics;
        if (profiling.customer_questions) leadData.customer_questions = profiling.customer_questions;
        if (profiling.objections) leadData.objections = profiling.objections;
        if (profiling.products_mentioned) leadData.products_mentioned = profiling.products_mentioned;
        if (profiling.urgency_level) leadData.urgency_level = profiling.urgency_level;
        if (profiling.next_action) leadData.next_action = profiling.next_action;
        if (profiling.sentiment) leadData.sentiment = profiling.sentiment;
        if (profiling.pipeline_stage) leadData.pipeline_stage = profiling.pipeline_stage;

        // Upsert na tabela crm_leads
        const { data: existingLead } = await supabase
            .from('crm_leads')
            .select('id')
            .eq('user_id', userId)
            .eq('whatsapp_number', whatsappNumber)
            .maybeSingle();

        if (existingLead) {
            console.log('📝 [WhatsApp CRM] Atualizando lead existente...');
            await supabase
                .from('crm_leads')
                .update(leadData)
                .eq('id', existingLead.id);
        } else {
            console.log('🆕 [WhatsApp CRM] Criando novo lead...');
            await supabase
                .from('crm_leads')
                .insert(leadData);
        }

        console.log('✅ [WhatsApp CRM] Lead salvo com sucesso! source: whatsapp');

    } catch (err) {
        console.error('⚠️ [WhatsApp CRM] Falha no profiling:', err);
    }
}



# Plano de Implementação: WhatsApp → CRM + Chat ao Vivo

## Objetivo

Corrigir a integração para que leads do WhatsApp:
- Sejam salvos no CRM com `source: 'whatsapp'`
- Tenham análise completa igual aos leads do Widget
- Apareçam no Chat ao Vivo em tempo real
- Sincronizem status de Human Takeover

---

## Modificações no Arquivo

### Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

---

### Modificação 1: Sincronizar Human Takeover com Live Chat Sessions

**Localização:** Linhas 99-108

**O que faz:** Quando o humano envia mensagem pelo WhatsApp direto, além de atualizar `n8n_fluxogpt`, também atualiza `live_chat_sessions` para que o painel Chat ao Vivo mostre o status correto.

**Código atual:**
```javascript
// Ativar pausa de 2 horas
const takeoverUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

await supabase
    .from('n8n_fluxogpt')
    .update({ human_takeover_until: takeoverUntil })
    .eq('id', existingContact.id);
```

**Código novo:**
```javascript
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

console.log('📺 Live Chat: Status atualizado para human_takeover');
```

---

### Modificação 2: Atualizar Chamada da Função processCRMLead

**Localização:** Linhas 1065-1071

**O que faz:** Adiciona `instanceName` como parâmetro para permitir buscar histórico completo.

**Código atual:**
```javascript
processCRMLead(
    instanceConfig.idassistentgpt,
    userId,
    contactNumber,
    `Usuário: ${currentMessages}\nAssistente: ${assistantResponse}`,
    openaiApiKey
).catch(e => console.error('❌ Erro no background profiling:', e));
```

**Código novo:**
```javascript
processCRMLead(
    instanceConfig.idassistentgpt,
    userId,
    contactNumber,
    instanceName,  // NOVO parâmetro
    `Usuário: ${currentMessages}\nAssistente: ${assistantResponse}`,
    openaiApiKey
).catch(e => console.error('❌ Erro no background profiling:', e));
```

---

### Modificação 3: Expandir Função processCRMLead

**Localização:** Linhas 1218-1299

**O que faz:** 
- Adiciona parâmetro `instanceName`
- Busca histórico completo de `live_chat_messages`
- Usa prompt expandido com análise detalhada
- Define `source: 'whatsapp'`
- Inclui todos os campos avançados do CRM

**Código novo completo:**
```javascript
async function processCRMLead(
    assistantId: string, 
    userId: string, 
    whatsappNumber: string, 
    instanceName: string,  // NOVO parâmetro
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
  "next_action": "Próximo passo ESPECÍFICO recomendado para o vendedor (ex: ligar para confirmar, enviar proposta, agendar demo)"
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

        // Campos básicos
        if (profiling.name) leadData.name = profiling.name;
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
```

---

## Resumo das Mudanças

| Linha | Ação | Descrição |
|-------|------|-----------|
| 99-108 | Adicionar | Sincronizar Human Takeover com `live_chat_sessions` |
| 1065-1071 | Modificar | Adicionar `instanceName` na chamada da função |
| 1218-1299 | Substituir | Nova versão expandida de `processCRMLead` |

---

## Resultado Esperado

Após as modificações:

**CRM:**
- Leads do WhatsApp aparecerão com ícone 📱 (source: 'whatsapp')
- Número do cliente visível na lista
- Análise completa: tópicos, objeções, urgência, próxima ação, sentimento
- Mesmo nível de detalhe que leads do Widget

**Chat ao Vivo:**
- Conversas do WhatsApp visíveis em tempo real ✅ (já funciona)
- Status Human Takeover sincronizado entre WhatsApp e painel
- Quando humano envia mensagem direto no WhatsApp, painel mostra "Humano Atendendo"

**Sincronização:**
- Pausar IA pelo painel → funciona
- Pausar IA pelo WhatsApp direto → funciona E atualiza painel

---

## Segurança

Todas as modificações mantêm:
- Service Role Key para bypass de RLS (necessário para edge functions)
- Validações existentes de `userId` e `assistantId`
- Tratamento de erros não-bloqueantes (Live Chat errors são logados mas não interrompem fluxo principal)


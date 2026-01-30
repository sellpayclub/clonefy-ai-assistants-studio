import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

console.log('OpenAI API Key check:', openAIApiKey ? 'Key found' : 'Key NOT found');

if (!openAIApiKey) {
  console.error('OPENAI_API_KEY is not configured - please set it in Supabase Edge Function secrets');
}
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if OpenAI API key is configured
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key não configurada. Por favor, configure a OPENAI_API_KEY nas configurações do projeto.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...data } = await req.json();
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    console.log(`OpenAI Assistants API - Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'create':
        return await createAssistant(user.id, data);
      case 'list':
        return await listAssistants(user.id);
      case 'get':
        return await getAssistant(user.id, data.assistantId);
      case 'update':
        return await updateAssistant(user.id, data.assistantId, data);
      case 'delete':
        return await deleteAssistant(user.id, data.assistantId);
      case 'upload-knowledge-file':
        return await uploadKnowledgeFile(data);
      case 'delete-knowledge-file':
        return await deleteKnowledgeFile(data.openai_file_id);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in openai-assistants function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================
// INSTRUÇÕES COMPLETAS E DETALHADAS DO AGENDIFY
// ============================================================
const AGENDIFY_INSTRUCTIONS = `

=== 🗓️ SISTEMA DE AGENDAMENTO AGENDIFY - INSTRUÇÕES OBRIGATÓRIAS ===

VOCÊ ESTÁ CONECTADO A UM SISTEMA DE AGENDAMENTO REAL chamado Agendify.
Os dados de serviços, profissionais e horários são REAIS e vêm de uma API externa.

🚨 REGRAS ABSOLUTAS - QUEBRE ESTAS REGRAS E O SISTEMA FALHARÁ:

1. NUNCA INVENTE DADOS FICTÍCIOS
   - Você NÃO sabe quais serviços existem até chamar agendify_list_services
   - Você NÃO sabe quais profissionais existem até chamar agendify_list_professionals
   - Você NÃO sabe quais horários estão livres até chamar agendify_check_availability
   - Se inventar dados, o agendamento FALHARÁ porque os IDs não existem no sistema real
   - NUNCA assuma ou invente nomes de serviços como "Corte Masculino" sem verificar primeiro

2. SEMPRE USE AS FUNÇÕES DISPONÍVEIS
   Você tem 7 funções para gerenciar agendamentos. Use-as SEMPRE:
   
   📋 agendify_list_services
   - Retorna TODOS os serviços disponíveis com ID, nome, preço e duração
   - CHAME PRIMEIRO quando cliente demonstrar interesse em agendar
   - Retorno esperado: {services: [{id: "uuid-real", name: "Nome do Serviço", price: X, duration_minutes: Y}]}
   - MOSTRE os serviços ao cliente COM PREÇOS
   
   👥 agendify_list_professionals  
   - Retorna profissionais disponíveis, opcionalmente filtrados por serviceId
   - CHAME APÓS o cliente escolher um serviço para ver quem realiza esse serviço
   - Parâmetros: serviceId (opcional, mas recomendado)
   - Retorno esperado: {professionals: [{id: "uuid-real", name: "Nome", role: "Função"}]}
   
   📅 agendify_check_availability (OBRIGATÓRIO ANTES DE QUALQUER AGENDAMENTO)
   - Retorna horários REAIS disponíveis para uma data específica
   - VOCÊ DEVE CHAMAR ESTA FUNÇÃO antes de criar qualquer agendamento
   - Parâmetros OBRIGATÓRIOS: date (formato YYYY-MM-DD), serviceId (obtido de list_services)
   - Parâmetros opcionais: professionalId
   - Retorno esperado: {availableSlots: [{time: "14:00", available: true}], message: "..."}
   - MOSTRE APENAS os horários que vieram no retorno availableSlots
   - NÃO invente horários! Use SOMENTE os que vieram da API
   
   ✅ agendify_create_appointment
   - Cria o agendamento no sistema real do Agendify
   - SOMENTE CHAME quando tiver TODOS os dados confirmados pelo cliente:
     * clientName: Nome completo do cliente
     * clientPhone: Telefone com DDD (formato: 5511999999999)
     * serviceId: ID REAL do serviço (obtido de agendify_list_services)
     * professionalId: ID REAL do profissional (obtido de agendify_list_professionals)
     * date: Data no formato YYYY-MM-DD
     * time: Horário no formato HH:MM (DEVE estar na lista de availableSlots!)
     * notes: Observações opcionais
   
   ❌ agendify_cancel_appointment
   - Cancela um agendamento existente
   - Parâmetros: appointmentId (obrigatório), reason (opcional)
   
   📜 agendify_list_appointments
   - Lista agendamentos existentes
   - Parâmetros opcionais: date (YYYY-MM-DD), clientPhone
   - Use para verificar agendamentos de um cliente ou de uma data
   
   🔍 agendify_search_clients
   - Busca clientes cadastrados no sistema
   - Parâmetros: search (nome, telefone ou email)

📝 FLUXO OBRIGATÓRIO PARA CRIAR UM AGENDAMENTO:

PASSO 1: Cliente demonstra interesse em agendar
→ CHAME IMEDIATAMENTE: agendify_list_services
→ MOSTRE os serviços disponíveis COM PREÇOS E DURAÇÃO
→ Exemplo: "Temos os seguintes serviços: 1) Corte - R$50 (30min), 2) Barba - R$30 (20min)"

PASSO 2: Cliente escolhe o serviço
→ SALVE o serviceId do serviço escolhido (você precisará dele)
→ CHAME: agendify_list_professionals com o serviceId
→ MOSTRE os profissionais disponíveis para aquele serviço

PASSO 3: Cliente escolhe profissional (ou aceita qualquer um disponível)
→ SALVE o professionalId escolhido (você precisará dele)
→ Se cliente aceitar "qualquer um", escolha o primeiro da lista

PASSO 4: Pergunte qual DATA o cliente deseja
→ Formato esperado da API: YYYY-MM-DD
→ Se cliente disser "amanhã", calcule a data correta
→ Se cliente disser "segunda-feira", calcule a próxima segunda

PASSO 5: OBRIGATÓRIO - Verifique disponibilidade
→ CHAME: agendify_check_availability com date, serviceId e professionalId
→ MOSTRE APENAS os horários que vieram no retorno availableSlots
→ Se não houver horários, sugira outra data e verifique novamente
→ NÃO INVENTE HORÁRIOS! Use SOMENTE os que a API retornou!

PASSO 6: Cliente escolhe horário
→ CONFIRME que o horário escolhido está na lista de disponíveis
→ SALVE o horário escolhido (formato HH:MM)

PASSO 7: Colete dados do cliente
→ Pergunte o NOME completo
→ Pergunte o TELEFONE com DDD (formato: 11999887766)

PASSO 8: Confirme TODOS os dados antes de agendar
→ Exemplo: "Vou confirmar seu agendamento:
   📅 Serviço: [Nome do Serviço] - R$[Preço]
   👤 Profissional: [Nome do Profissional]
   📆 Data: [Data formatada] às [Hora]
   📱 Nome: [Nome do Cliente], Tel: [Telefone]
   Está tudo correto?"

PASSO 9: Cliente confirma
→ CHAME: agendify_create_appointment com TODOS os parâmetros
→ Se sucesso, confirme com os dados do retorno
→ Se erro, informe o cliente e pergunte se quer tentar outro horário

❌ O QUE NUNCA FAZER (REGRAS ABSOLUTAS):

- NUNCA diga "temos horário às 14:30" sem chamar agendify_check_availability
- NUNCA invente nomes de serviços - chame agendify_list_services primeiro
- NUNCA invente nomes de profissionais - chame agendify_list_professionals primeiro
- NUNCA crie agendamento sem ter serviceId e professionalId REAIS da API
- NUNCA assuma que um horário está disponível sem verificar
- NUNCA pule a etapa de verificação de disponibilidade (check_availability)
- NUNCA crie agendamento sem coletar nome e telefone do cliente
- NUNCA use IDs fictícios - todos os IDs devem vir das funções de listagem

✅ EXEMPLO DE DIÁLOGO CORRETO:

Cliente: "Oi, quero agendar um horário"
Você: [CHAMA agendify_list_services]
Sistema retorna: {services: [{id: "abc123", name: "Corte Masculino", price: 50, duration_minutes: 30}]}
Você: "Olá! Temos os seguintes serviços disponíveis:
• Corte Masculino - R$50 (30min)
Qual você gostaria de agendar?"

Cliente: "Quero o corte masculino"
Você: [CHAMA agendify_list_professionals com serviceId: "abc123"]
Sistema retorna: {professionals: [{id: "def456", name: "João Barbeiro", role: "Barbeiro"}]}
Você: "Ótimo! O profissional disponível para Corte Masculino é o João Barbeiro. Qual dia você prefere?"

Cliente: "Amanhã"
Você: [CHAMA agendify_check_availability com date: "2024-02-20", serviceId: "abc123", professionalId: "def456"]
Sistema retorna: {availableSlots: [{time: "09:00", available: true}, {time: "10:30", available: true}, {time: "14:00", available: true}]}
Você: "Para amanhã (20/02) temos os seguintes horários disponíveis:
• 09:00
• 10:30
• 14:00
Qual horário você prefere?"

Cliente: "14:00"
Você: "Perfeito! Para finalizar, preciso do seu nome completo e telefone com DDD."

Cliente: "Carlos Silva, 11999887766"
Você: "Vou confirmar seu agendamento:
📅 Corte Masculino - R$50 com João Barbeiro
📆 Amanhã (20/02/2024) às 14:00
👤 Carlos Silva - (11) 99988-7766
Está tudo certo?"

Cliente: "Sim"
Você: [CHAMA agendify_create_appointment com clientName: "Carlos Silva", clientPhone: "5511999887766", serviceId: "abc123", professionalId: "def456", date: "2024-02-20", time: "14:00"]
Sistema retorna: {success: true, appointment: {...}}
Você: "Agendamento confirmado! ✅
📅 Corte Masculino com João Barbeiro
📆 20/02/2024 às 14:00
Até lá, Carlos!"

⚠️ TRATAMENTO DE ERROS:

- Se agendify_list_services retornar vazio: "No momento não há serviços disponíveis. Por favor, entre em contato por outro canal."
- Se agendify_check_availability retornar sem horários: "Infelizmente não há horários disponíveis para esta data. Gostaria de verificar outro dia?"
- Se agendify_create_appointment falhar: "Houve um problema ao criar o agendamento. Vamos tentar novamente? [Verificar disponibilidade novamente]"
- Se o cliente pedir um horário que não está na lista: "Este horário não está disponível. Os horários livres são: [listar horários do availableSlots]"

=== FIM DAS INSTRUÇÕES DO AGENDIFY ===
`;

async function createAssistant(userId: string, data: any) {
  console.log('createAssistant called with data:', data);
  console.log('OpenAI API Key available:', !!openAIApiKey);
  
  const { name, description, instructions, model = 'gpt-4o-mini', calendar_enabled = false, agendify_enabled = false } = data;

  console.log('Creating assistant with model:', model);
  
  // Check if assistant with this name already exists for this user
  const { data: existingAssistant, error: checkError } = await supabase
    .from('assistants')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name)
    .eq('is_active', true)
    .single();
    
  if (existingAssistant) {
    throw new Error('Já existe um agente com esse nome. Por favor, escolha um nome diferente.');
  }
  
  // Build final instructions with Agendify context if enabled
  let finalInstructions = instructions || '';
  if (agendify_enabled) {
    finalInstructions = finalInstructions + AGENDIFY_INSTRUCTIONS;
  }
  
  // Prepare tools array for function calling
  const tools = [];
  
  // ======== AGENDIFY TOOLS ========
  if (agendify_enabled) {
    tools.push({
      type: "function",
      function: {
        name: "agendify_list_services",
        description: "Lista todos os serviços disponíveis no sistema de agendamento Agendify. Use para mostrar ao cliente quais serviços estão disponíveis.",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      }
    });

    tools.push({
      type: "function",
      function: {
        name: "agendify_list_professionals",
        description: "Lista os profissionais disponíveis, opcionalmente filtrados por serviço.",
        parameters: {
          type: "object",
          properties: {
            serviceId: {
              type: "string",
              description: "ID do serviço para filtrar profissionais que o realizam (opcional)"
            }
          },
          required: []
        }
      }
    });

    tools.push({
      type: "function",
      function: {
        name: "agendify_check_availability",
        description: "Verifica horários disponíveis para agendamento em uma data específica. SEMPRE use esta função antes de criar um agendamento para mostrar os horários disponíveis ao cliente.",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Data para verificar disponibilidade (formato YYYY-MM-DD, ex: 2024-02-20)"
            },
            serviceId: {
              type: "string",
              description: "ID do serviço desejado (obrigatório)"
            },
            professionalId: {
              type: "string",
              description: "ID do profissional específico (opcional, se não informado mostra todos)"
            }
          },
          required: ["date", "serviceId"]
        }
      }
    });

    tools.push({
      type: "function",
      function: {
        name: "agendify_create_appointment",
        description: "Cria um novo agendamento no sistema. Use SOMENTE após confirmar com o cliente: nome, telefone, serviço, profissional, data e horário.",
        parameters: {
          type: "object",
          properties: {
            clientName: {
              type: "string",
              description: "Nome completo do cliente"
            },
            clientPhone: {
              type: "string",
              description: "Telefone do cliente com DDD (ex: 5511999999999)"
            },
            serviceId: {
              type: "string",
              description: "ID do serviço escolhido"
            },
            professionalId: {
              type: "string",
              description: "ID do profissional escolhido"
            },
            date: {
              type: "string",
              description: "Data do agendamento (formato YYYY-MM-DD)"
            },
            time: {
              type: "string",
              description: "Horário do agendamento (formato HH:MM, ex: 14:30)"
            },
            notes: {
              type: "string",
              description: "Observações adicionais do cliente (opcional)"
            }
          },
          required: ["clientName", "clientPhone", "serviceId", "professionalId", "date", "time"]
        }
      }
    });

    tools.push({
      type: "function",
      function: {
        name: "agendify_cancel_appointment",
        description: "Cancela um agendamento existente.",
        parameters: {
          type: "object",
          properties: {
            appointmentId: {
              type: "string",
              description: "ID do agendamento a ser cancelado"
            },
            reason: {
              type: "string",
              description: "Motivo do cancelamento"
            }
          },
          required: ["appointmentId"]
        }
      }
    });

    tools.push({
      type: "function",
      function: {
        name: "agendify_list_appointments",
        description: "Lista agendamentos existentes, podendo filtrar por data ou telefone do cliente.",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Data específica para buscar agendamentos (formato YYYY-MM-DD)"
            },
            clientPhone: {
              type: "string",
              description: "Telefone do cliente para buscar seus agendamentos"
            }
          },
          required: []
        }
      }
    });

    tools.push({
      type: "function",
      function: {
        name: "agendify_search_clients",
        description: "Busca clientes cadastrados no sistema por nome, telefone ou email.",
        parameters: {
          type: "object",
          properties: {
            search: {
              type: "string",
              description: "Termo de busca (nome, telefone ou email)"
            }
          },
          required: []
        }
      }
    });
  }
  if (calendar_enabled) {
    tools.push({
      type: "function",
      function: {
        name: "check_availability",
        description: "Check available time slots for appointments",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Date to check availability (YYYY-MM-DD format)"
            },
            duration: {
              type: "integer", 
              description: "Duration of appointment in minutes (default: 30)"
            }
          },
          required: ["date"]
        }
      }
    });
    
    tools.push({
      type: "function",
      function: {
        name: "create_appointment",
        description: "Create a new appointment",
        parameters: {
          type: "object",
          properties: {
            client_name: {
              type: "string",
              description: "Name of the client"
            },
            client_phone: {
              type: "string", 
              description: "Phone number of the client"
            },
            date: {
              type: "string",
              description: "Date of appointment (YYYY-MM-DD format)"
            },
            time: {
              type: "string",
              description: "Time of appointment (HH:MM format)"
            },
            duration: {
              type: "integer",
              description: "Duration in minutes (default: 30)"
            },
            description: {
              type: "string",
              description: "Optional description or notes about the appointment"
            }
          },
          required: ["client_name", "client_phone", "date", "time"]
        }
      }
    });

    tools.push({
      type: "function", 
      function: {
        name: "list_appointments",
        description: "List appointments for a specific date or all upcoming appointments",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Specific date to list appointments (YYYY-MM-DD format). If not provided, lists all upcoming appointments"
            },
            status: {
              type: "string",
              description: "Filter by status: scheduled, completed, cancelled, rescheduled"
            }
          }
        }
      }
    });

    tools.push({
      type: "function",
      function: {
        name: "cancel_appointment", 
        description: "Cancel an existing appointment",
        parameters: {
          type: "object",
          properties: {
            client_phone: {
              type: "string",
              description: "Phone number of the client"
            },
            date: {
              type: "string", 
              description: "Date of the appointment to cancel (YYYY-MM-DD format)"
            }
          },
          required: ["client_phone", "date"]
        }
      }
    });

    tools.push({
      type: "function",
      function: {
        name: "reschedule_appointment",
        description: "Reschedule an existing appointment to a new date and time",
        parameters: {
          type: "object", 
          properties: {
            client_phone: {
              type: "string",
              description: "Phone number of the client"
            },
            old_date: {
              type: "string",
              description: "Current date of the appointment (YYYY-MM-DD format)"
            },
            new_date: {
              type: "string",
              description: "New date for the appointment (YYYY-MM-DD format)"
            },
            new_time: {
              type: "string",
              description: "New time for the appointment (HH:MM format)"
            }
          },
          required: ["client_phone", "old_date", "new_date", "new_time"]
        }
      }
    });
  }

  // Create assistant in OpenAI
  const openAIResponse = await fetch('https://api.openai.com/v1/assistants', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({
      name,
      description: description || null,
      instructions: finalInstructions || null,
      model,
      tools
    }),
  });

  console.log('OpenAI Response status:', openAIResponse.status);
  
  if (!openAIResponse.ok) {
    const errorText = await openAIResponse.text();
    console.error('OpenAI API error response:', errorText);
    
    let error;
    try {
      error = JSON.parse(errorText);
    } catch {
      error = { error: { message: errorText } };
    }
    
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const openAIAssistant = await openAIResponse.json();
  
  console.log('Assistant created successfully:', openAIAssistant.id);

  // Save assistant in Supabase
  const { data: assistant, error } = await supabase
    .from('assistants')
    .insert({
      user_id: userId,
      openai_assistant_id: openAIAssistant.id,
      name,
      description: description || null,
      instructions: instructions || null,
      model,
      tools,
      metadata: openAIAssistant
    })
    .select()
    .single();

  if (error) {
    // If Supabase insert fails, try to delete the OpenAI assistant
    try {
      await fetch(`https://api.openai.com/v1/assistants/${openAIAssistant.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });
    } catch (deleteError) {
      console.error('Failed to cleanup OpenAI assistant:', deleteError);
    }
    
    // Check for specific error types to provide better messages
    let errorMessage = error.message;
    if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
      errorMessage = 'Já existe um agente com esse nome. Por favor, escolha um nome diferente.';
    } else if (error.code === '23514' || error.message.includes('check constraint')) {
      errorMessage = 'Os dados fornecidos não atendem aos requisitos. Verifique os campos obrigatórios.';
    } else if (error.code === '23503' || error.message.includes('foreign key')) {
      errorMessage = 'Erro de referência no banco de dados. Tente novamente.';
    }
    
    throw new Error(errorMessage);
  }

  return new Response(JSON.stringify({ assistant }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function listAssistants(userId: string) {
  const { data: assistants, error } = await supabase
    .from('assistants')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ assistants }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getAssistant(userId: string, assistantId: string) {
  const { data: assistant, error } = await supabase
    .from('assistants')
    .select('*')
    .eq('user_id', userId)
    .eq('id', assistantId)
    .single();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ assistant }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateAssistant(userId: string, assistantId: string, data: any) {
  const { name, description, instructions, model, calendar_enabled = false, agendify_enabled = false } = data;

  // Get current assistant from database
  const { data: currentAssistant, error: fetchError } = await supabase
    .from('assistants')
    .select('*')
    .eq('user_id', userId)
    .eq('id', assistantId)
    .single();

  if (fetchError) {
    throw new Error(`Assistant not found: ${fetchError.message}`);
  }

  // Build final instructions with Agendify context if enabled
  let finalInstructions = instructions || '';
  if (agendify_enabled) {
    // Remove existing Agendify instructions if present (to avoid duplication)
    finalInstructions = finalInstructions.replace(/\n=== SISTEMA DE AGENDAMENTO AGENDIFY ===[\s\S]*$/, '');
    finalInstructions = finalInstructions + AGENDIFY_INSTRUCTIONS;
  }

  // Prepare tools array for function calling
  const tools = [];
  
  // ======== AGENDIFY TOOLS ========
  if (agendify_enabled) {
    tools.push({
      type: "function",
      function: {
        name: "agendify_list_services",
        description: "Lista todos os serviços disponíveis no sistema de agendamento Agendify.",
        parameters: { type: "object", properties: {}, required: [] }
      }
    });
    tools.push({
      type: "function",
      function: {
        name: "agendify_list_professionals",
        description: "Lista os profissionais disponíveis.",
        parameters: {
          type: "object",
          properties: { serviceId: { type: "string", description: "ID do serviço (opcional)" } },
          required: []
        }
      }
    });
    tools.push({
      type: "function",
      function: {
        name: "agendify_check_availability",
        description: "Verifica horários disponíveis para agendamento.",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "Data (YYYY-MM-DD)" },
            serviceId: { type: "string", description: "ID do serviço" },
            professionalId: { type: "string", description: "ID do profissional (opcional)" }
          },
          required: ["date", "serviceId"]
        }
      }
    });
    tools.push({
      type: "function",
      function: {
        name: "agendify_create_appointment",
        description: "Cria um novo agendamento.",
        parameters: {
          type: "object",
          properties: {
            clientName: { type: "string" },
            clientPhone: { type: "string" },
            serviceId: { type: "string" },
            professionalId: { type: "string" },
            date: { type: "string" },
            time: { type: "string" },
            notes: { type: "string" }
          },
          required: ["clientName", "clientPhone", "serviceId", "professionalId", "date", "time"]
        }
      }
    });
    tools.push({
      type: "function",
      function: {
        name: "agendify_cancel_appointment",
        description: "Cancela um agendamento.",
        parameters: {
          type: "object",
          properties: {
            appointmentId: { type: "string" },
            reason: { type: "string" }
          },
          required: ["appointmentId"]
        }
      }
    });
    tools.push({
      type: "function",
      function: {
        name: "agendify_list_appointments",
        description: "Lista agendamentos.",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string" },
            clientPhone: { type: "string" }
          },
          required: []
        }
      }
    });
    tools.push({
      type: "function",
      function: {
        name: "agendify_search_clients",
        description: "Busca clientes cadastrados.",
        parameters: {
          type: "object",
          properties: { search: { type: "string" } },
          required: []
        }
      }
    });
  }
  
  if (calendar_enabled) {
    // Add the same calendar functions as in create
    tools.push({
      type: "function",
      function: {
        name: "check_availability",
        description: "Check available time slots for appointments",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date to check availability (YYYY-MM-DD format)" },
            duration: { type: "integer", description: "Duration of appointment in minutes (default: 30)" }
          },
          required: ["date"]
        }
      }
    });
    
    tools.push({
      type: "function",
      function: {
        name: "create_appointment",
        description: "Create a new appointment",
        parameters: {
          type: "object",
          properties: {
            client_name: { type: "string", description: "Name of the client" },
            client_phone: { type: "string", description: "Phone number of the client" },
            date: { type: "string", description: "Date of appointment (YYYY-MM-DD format)" },
            time: { type: "string", description: "Time of appointment (HH:MM format)" },
            duration: { type: "integer", description: "Duration in minutes (default: 30)" },
            description: { type: "string", description: "Optional description or notes about the appointment" }
          },
          required: ["client_name", "client_phone", "date", "time"]
        }
      }
    });

    tools.push({
      type: "function", 
      function: {
        name: "list_appointments",
        description: "List appointments for a specific date or all upcoming appointments",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "Specific date to list appointments (YYYY-MM-DD format). If not provided, lists all upcoming appointments" },
            status: { type: "string", description: "Filter by status: scheduled, completed, cancelled, rescheduled" }
          }
        }
      }
    });

    tools.push({
      type: "function",
      function: {
        name: "cancel_appointment", 
        description: "Cancel an existing appointment",
        parameters: {
          type: "object",
          properties: {
            client_phone: { type: "string", description: "Phone number of the client" },
            date: { type: "string", description: "Date of the appointment to cancel (YYYY-MM-DD format)" }
          },
          required: ["client_phone", "date"]
        }
      }
    });

    tools.push({
      type: "function",
      function: {
        name: "reschedule_appointment",
        description: "Reschedule an existing appointment to a new date and time",
        parameters: {
          type: "object", 
          properties: {
            client_phone: { type: "string", description: "Phone number of the client" },
            old_date: { type: "string", description: "Current date of the appointment (YYYY-MM-DD format)" },
            new_date: { type: "string", description: "New date for the appointment (YYYY-MM-DD format)" },
            new_time: { type: "string", description: "New time for the appointment (HH:MM format)" }
          },
          required: ["client_phone", "old_date", "new_date", "new_time"]
        }
      }
    });
  }

  // Update assistant in OpenAI
  const openAIResponse = await fetch(`https://api.openai.com/v1/assistants/${currentAssistant.openai_assistant_id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({
      name,
      description,
      instructions: finalInstructions,
      model,
      tools
    }),
  });

  if (!openAIResponse.ok) {
    const error = await openAIResponse.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const openAIAssistant = await openAIResponse.json();

  // Update assistant in Supabase
  const { data: assistant, error } = await supabase
    .from('assistants')
    .update({
      name,
      description,
      instructions,
      model,
      tools,
      metadata: openAIAssistant
    })
    .eq('user_id', userId)
    .eq('id', assistantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ assistant }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteAssistant(userId: string, assistantId: string) {
  // Get current assistant from database
  const { data: currentAssistant, error: fetchError } = await supabase
    .from('assistants')
    .select('*')
    .eq('user_id', userId)
    .eq('id', assistantId)
    .single();

  if (fetchError) {
    throw new Error(`Assistant not found: ${fetchError.message}`);
  }

  // Delete assistant in OpenAI
  const openAIResponse = await fetch(`https://api.openai.com/v1/assistants/${currentAssistant.openai_assistant_id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'OpenAI-Beta': 'assistants=v2',
    },
  });

  if (!openAIResponse.ok) {
    const error = await openAIResponse.json();
    console.error('Failed to delete OpenAI assistant:', error);
    // Continue with database deletion even if OpenAI deletion fails
  }

  // Mark assistant as inactive in Supabase (soft delete)
  const { error } = await supabase
    .from('assistants')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('id', assistantId);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function uploadKnowledgeFile(data: any) {
  const { file, fileName, mimeType } = data;
  
  try {
    // Convert base64 to binary data
    const binaryData = Uint8Array.from(atob(file), c => c.charCodeAt(0));
    
    // Create FormData for OpenAI
    const formData = new FormData();
    const blob = new Blob([binaryData], { type: mimeType });
    formData.append('file', blob, fileName);
    formData.append('purpose', 'assistants');

    // Upload file to OpenAI
    const response = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Failed to upload file'}`);
    }

    const fileData = await response.json();
    
    return new Response(JSON.stringify({ 
      success: true, 
      openai_file_id: fileData.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error uploading knowledge file:', error);
    throw new Error(`Failed to upload knowledge file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function deleteKnowledgeFile(openaiFileId: string) {
  try {
    // Delete file from OpenAI
    const response = await fetch(`https://api.openai.com/v1/files/${openaiFileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to delete OpenAI file:', error);
      // Continue even if OpenAI deletion fails
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error deleting knowledge file:', error);
    throw new Error(`Failed to delete knowledge file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
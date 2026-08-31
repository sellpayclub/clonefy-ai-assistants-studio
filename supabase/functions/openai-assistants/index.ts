import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseServiceKey } from '../_shared/openai-responses.ts';

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
const supabaseServiceKey = getSupabaseServiceKey();

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MAX_INSTRUCTIONS_LENGTH = 200000; // Safe limit below OpenAI's 256k

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key não configurada. Por favor, configure a OPENAI_API_KEY nas configurações do projeto.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...data } = await req.json();
    
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
      case 'sync-vector-store':
        return await syncVectorStore(user.id, data.assistantId);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in openai-assistants function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Provide specific error codes for frontend
    let errorCode = 'UNKNOWN';
    if (errorMessage.includes('maximum') || errorMessage.includes('too long') || errorMessage.includes('token')) {
      errorCode = 'INSTRUCTIONS_TOO_LONG';
    } else if (errorMessage.includes('Invalid token') || errorMessage.includes('authorization')) {
      errorCode = 'AUTH_ERROR';
    } else if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
      errorCode = 'DUPLICATE_NAME';
    }
    
    return new Response(JSON.stringify({ error: errorMessage, errorCode }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================
// AGENDIFY INSTRUCTIONS
// ============================================================
const AGENDIFY_INSTRUCTIONS = `

=== 🗓️ SISTEMA DE AGENDAMENTO AGENDIFY - INSTRUÇÕES OBRIGATÓRIAS ===

VOCÊ ESTÁ CONECTADO A UM SISTEMA DE AGENDAMENTO REAL chamado Agendify.
Os dados de serviços, profissionais e horários são REAIS e vêm de uma API externa.

🚨 REGRAS ABSOLUTAS:

1. NUNCA INVENTE DADOS FICTÍCIOS - sempre use as funções para obter dados reais
2. SEMPRE USE AS FUNÇÕES DISPONÍVEIS:
   - agendify_list_services: Lista serviços disponíveis
   - agendify_list_professionals: Lista profissionais
   - agendify_check_availability: Verifica horários (OBRIGATÓRIO antes de agendar)
   - agendify_create_appointment: Cria agendamento
   - agendify_cancel_appointment: Cancela agendamento
   - agendify_list_appointments: Lista agendamentos
   - agendify_search_clients: Busca clientes

FLUXO: list_services → list_professionals → check_availability → confirmar dados → create_appointment

=== FIM AGENDIFY ===
`;

// ============================================================
// VECTOR STORE MANAGEMENT
// ============================================================

async function getOrCreateVectorStore(assistantId: string, openaiAssistantId: string): Promise<string> {
  // Check if we already have a vector store ID in metadata
  const { data: assistant } = await supabase
    .from('assistants')
    .select('metadata')
    .eq('id', assistantId)
    .single();

  const metadata = assistant?.metadata as any;
  const existingVsId = metadata?.vector_store_id;

  if (existingVsId) {
    // Verify it still exists
    const checkResp = await fetch(`https://api.openai.com/v1/vector_stores/${existingVsId}`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });
    if (checkResp.ok) {
      return existingVsId;
    }
    console.log(`Vector store ${existingVsId} no longer exists, creating new one`);
  }

  // Create a new vector store
  const createResp = await fetch('https://api.openai.com/v1/vector_stores', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({
      name: `knowledge-${assistantId}`,
    }),
  });

  if (!createResp.ok) {
    const err = await createResp.text();
    throw new Error(`Failed to create vector store: ${err}`);
  }

  const vs = await createResp.json();
  console.log(`Created vector store: ${vs.id} for assistant ${assistantId}`);

  // Save vector_store_id in metadata
  await supabase
    .from('assistants')
    .update({
      metadata: { ...metadata, vector_store_id: vs.id },
    })
    .eq('id', assistantId);

  return vs.id;
}

async function syncVectorStore(userId: string, assistantId: string) {
  console.log(`Syncing vector store for assistant ${assistantId}`);

  // Get assistant info
  const { data: assistant, error } = await supabase
    .from('assistants')
    .select('*')
    .eq('id', assistantId)
    .eq('user_id', userId)
    .single();

  if (error || !assistant) {
    throw new Error('Assistant not found');
  }

  // Get all knowledge files for this assistant
  const { data: knowledgeFiles } = await supabase
    .from('assistant_knowledge_files')
    .select('openai_file_id')
    .eq('assistant_id', assistantId)
    .not('openai_file_id', 'is', null);

  const fileIds = (knowledgeFiles || []).map((f: any) => f.openai_file_id).filter(Boolean);

  if (fileIds.length === 0) {
    // No files - remove file_search from assistant
    console.log('No knowledge files, removing file_search from assistant');
    await updateOpenAIAssistantTools(assistant.openai_assistant_id, assistant, false);
    return new Response(JSON.stringify({ success: true, message: 'No files to sync' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get or create vector store
  const vectorStoreId = await getOrCreateVectorStore(assistantId, assistant.openai_assistant_id);

  // Get current files in vector store
  const listResp = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files?limit=100`, {
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'OpenAI-Beta': 'assistants=v2',
    },
  });

  let existingFileIds: string[] = [];
  if (listResp.ok) {
    const listData = await listResp.json();
    existingFileIds = (listData.data || []).map((f: any) => f.id);
  }

  // Add missing files to vector store
  const filesToAdd = fileIds.filter((id: string) => !existingFileIds.includes(id));
  for (const fileId of filesToAdd) {
    console.log(`Adding file ${fileId} to vector store ${vectorStoreId}`);
    const addResp = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({ file_id: fileId }),
    });
    if (!addResp.ok) {
      const err = await addResp.text();
      console.error(`Failed to add file ${fileId} to vector store: ${err}`);
    }
  }

  // Remove files no longer in DB
  const filesToRemove = existingFileIds.filter((id: string) => !fileIds.includes(id));
  for (const fileId of filesToRemove) {
    console.log(`Removing file ${fileId} from vector store ${vectorStoreId}`);
    await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });
  }

  // Update OpenAI assistant with file_search tool + vector store
  await updateOpenAIAssistantTools(assistant.openai_assistant_id, assistant, true, vectorStoreId);

  console.log(`Vector store sync complete: ${filesToAdd.length} added, ${filesToRemove.length} removed`);
  
  return new Response(JSON.stringify({ success: true, vectorStoreId, filesAdded: filesToAdd.length, filesRemoved: filesToRemove.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateOpenAIAssistantTools(openaiAssistantId: string, assistant: any, enableFileSearch: boolean, vectorStoreId?: string) {
  // Responses API receives tools and vector_store_ids on every response.
  // Keep this compatibility function so existing sync flows continue working.
  console.log('Responses tool configuration saved locally', {
    openaiAssistantId,
    enableFileSearch,
    vectorStoreId,
    toolCount: Array.isArray(assistant.tools) ? assistant.tools.length : 0,
  });
}

// ============================================================
// TOOL BUILDERS
// ============================================================

function buildAgendifyTools() {
  return [
    { type: "function", function: { name: "agendify_list_services", description: "Lista todos os serviços disponíveis no sistema de agendamento Agendify.", parameters: { type: "object", properties: {}, required: [] } } },
    { type: "function", function: { name: "agendify_list_professionals", description: "Lista os profissionais disponíveis, opcionalmente filtrados por serviço.", parameters: { type: "object", properties: { serviceId: { type: "string", description: "ID do serviço para filtrar profissionais (opcional)" } }, required: [] } } },
    { type: "function", function: { name: "agendify_check_availability", description: "Verifica horários disponíveis para agendamento em uma data específica. SEMPRE use esta função antes de criar um agendamento.", parameters: { type: "object", properties: { date: { type: "string", description: "Data (YYYY-MM-DD)" }, serviceId: { type: "string", description: "ID do serviço (obrigatório)" }, professionalId: { type: "string", description: "ID do profissional (opcional)" } }, required: ["date", "serviceId"] } } },
    { type: "function", function: { name: "agendify_create_appointment", description: "Cria um novo agendamento no sistema.", parameters: { type: "object", properties: { clientName: { type: "string" }, clientPhone: { type: "string" }, serviceId: { type: "string" }, professionalId: { type: "string" }, date: { type: "string" }, time: { type: "string" }, notes: { type: "string" } }, required: ["clientName", "clientPhone", "serviceId", "professionalId", "date", "time"] } } },
    { type: "function", function: { name: "agendify_cancel_appointment", description: "Cancela um agendamento existente.", parameters: { type: "object", properties: { appointmentId: { type: "string" }, reason: { type: "string" } }, required: ["appointmentId"] } } },
    { type: "function", function: { name: "agendify_list_appointments", description: "Lista agendamentos existentes.", parameters: { type: "object", properties: { date: { type: "string" }, clientPhone: { type: "string" } }, required: [] } } },
    { type: "function", function: { name: "agendify_search_clients", description: "Busca clientes cadastrados.", parameters: { type: "object", properties: { search: { type: "string" } }, required: [] } } },
  ];
}

function buildCalendarTools() {
  return [
    { type: "function", function: { name: "check_availability", description: "Check available time slots for appointments", parameters: { type: "object", properties: { date: { type: "string", description: "Date (YYYY-MM-DD)" }, duration: { type: "integer", description: "Duration in minutes (default: 30)" } }, required: ["date"] } } },
    { type: "function", function: { name: "create_appointment", description: "Create a new appointment", parameters: { type: "object", properties: { client_name: { type: "string" }, client_phone: { type: "string" }, date: { type: "string" }, time: { type: "string" }, duration: { type: "integer" }, description: { type: "string" } }, required: ["client_name", "client_phone", "date", "time"] } } },
    { type: "function", function: { name: "list_appointments", description: "List appointments", parameters: { type: "object", properties: { date: { type: "string" }, status: { type: "string" } } } } },
    { type: "function", function: { name: "cancel_appointment", description: "Cancel an existing appointment", parameters: { type: "object", properties: { client_phone: { type: "string" }, date: { type: "string" } }, required: ["client_phone", "date"] } } },
    { type: "function", function: { name: "reschedule_appointment", description: "Reschedule an appointment", parameters: { type: "object", properties: { client_phone: { type: "string" }, old_date: { type: "string" }, new_date: { type: "string" }, new_time: { type: "string" } }, required: ["client_phone", "old_date", "new_date", "new_time"] } } },
  ];
}

// ============================================================
// ASSISTANT CRUD
// ============================================================

async function createAssistant(userId: string, data: any) {
  const { name, description, instructions, model = 'gpt-4o-mini', calendar_enabled = false, agendify_enabled = false } = data;

  // Validate instructions length
  if (instructions && instructions.length > MAX_INSTRUCTIONS_LENGTH) {
    throw new Error(`Instruções muito longas (${instructions.length} caracteres). O limite é ${MAX_INSTRUCTIONS_LENGTH} caracteres. Use a Base de Conhecimento para documentos e transcrições longas.`);
  }

  // Check duplicate name
  const { data: existingAssistant } = await supabase
    .from('assistants')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name)
    .eq('is_active', true)
    .single();
    
  if (existingAssistant) {
    throw new Error('Já existe um agente com esse nome. Por favor, escolha um nome diferente.');
  }
  
  let finalInstructions = instructions || '';
  if (agendify_enabled) {
    finalInstructions = finalInstructions + AGENDIFY_INSTRUCTIONS;
  }
  
  // Build tools
  const tools: any[] = [];
  if (agendify_enabled) tools.push(...buildAgendifyTools());
  if (calendar_enabled) tools.push(...buildCalendarTools());

  // Assistants are now application-owned configurations. The Responses API
  // receives this configuration on each request instead of creating an asst_*.
  const localAssistantId = `resp_${crypto.randomUUID()}`;
  const assistantMetadata = {
    provider: 'openai_responses',
    migrated_at: new Date().toISOString(),
  };

  // Save in Supabase
  const { data: assistant, error } = await supabase
    .from('assistants')
    .insert({
      user_id: userId,
      openai_assistant_id: localAssistantId,
      name,
      description: description || null,
      instructions: instructions || null,
      model,
      tools,
      metadata: assistantMetadata,
    })
    .select()
    .single();

  if (error) {
    let errorMessage = error.message;
    if (error.code === '23505') errorMessage = 'Já existe um agente com esse nome.';
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

  if (error) throw new Error(`Database error: ${error.message}`);

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

  if (error) throw new Error(`Database error: ${error.message}`);

  return new Response(JSON.stringify({ assistant }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateAssistant(userId: string, assistantId: string, data: any) {
  const { name, description, instructions, model, calendar_enabled = false, agendify_enabled = false } = data;

  // Validate instructions length
  if (instructions && instructions.length > MAX_INSTRUCTIONS_LENGTH) {
    throw new Error(`Instruções muito longas (${instructions.length} caracteres). O limite é ${MAX_INSTRUCTIONS_LENGTH} caracteres. Use a Base de Conhecimento para documentos e transcrições longas.`);
  }

  const { data: currentAssistant, error: fetchError } = await supabase
    .from('assistants')
    .select('*')
    .eq('user_id', userId)
    .eq('id', assistantId)
    .single();

  if (fetchError) throw new Error(`Assistant not found: ${fetchError.message}`);

  let finalInstructions = instructions || '';
  if (agendify_enabled) {
    finalInstructions = finalInstructions.replace(/\n=== SISTEMA DE AGENDAMENTO AGENDIFY ===[\s\S]*$/, '');
    finalInstructions = finalInstructions + AGENDIFY_INSTRUCTIONS;
  }

  // Build tools
  const tools: any[] = [];
  if (agendify_enabled) tools.push(...buildAgendifyTools());
  if (calendar_enabled) tools.push(...buildCalendarTools());

  // Check if assistant has knowledge files → add file_search
  const { data: knowledgeFiles } = await supabase
    .from('assistant_knowledge_files')
    .select('openai_file_id')
    .eq('assistant_id', assistantId)
    .not('openai_file_id', 'is', null);

  const hasKnowledgeFiles = (knowledgeFiles || []).length > 0;
  
  // Preserve the vector store; Responses consumes it directly per request.
  const existingMetadata = (currentAssistant.metadata as any) || {};
  const newMetadata = {
    ...existingMetadata,
    provider: 'openai_responses',
    migrated_at: existingMetadata.migrated_at || new Date().toISOString(),
    vector_store_id: existingMetadata.vector_store_id,
    has_knowledge_files: hasKnowledgeFiles,
  };

  const { data: assistant, error } = await supabase
    .from('assistants')
    .update({
      name,
      description,
      instructions,
      model,
      tools,
      metadata: newMetadata,
    })
    .eq('user_id', userId)
    .eq('id', assistantId)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);

  return new Response(JSON.stringify({ assistant }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteAssistant(userId: string, assistantId: string) {
  const { data: currentAssistant, error: fetchError } = await supabase
    .from('assistants')
    .select('*')
    .eq('user_id', userId)
    .eq('id', assistantId)
    .single();

  if (fetchError) throw new Error(`Assistant not found: ${fetchError.message}`);

  // Delete vector store if exists
  const metadata = currentAssistant.metadata as any;
  if (metadata?.vector_store_id) {
    try {
      await fetch(`https://api.openai.com/v1/vector_stores/${metadata.vector_store_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'OpenAI-Beta': 'assistants=v2' },
      });
    } catch (e) { console.error('Failed to delete vector store:', e); }
  }

  // Soft delete
  const { error } = await supabase
    .from('assistants')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('id', assistantId);

  if (error) throw new Error(`Database error: ${error.message}`);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function uploadKnowledgeFile(data: any) {
  const { file, fileName, mimeType } = data;
  
  try {
    const binaryData = Uint8Array.from(atob(file), c => c.charCodeAt(0));
    
    const formData = new FormData();
    const blob = new Blob([binaryData], { type: mimeType });
    formData.append('file', blob, fileName);
    formData.append('purpose', 'user_data');

    const response = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAIApiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Failed to upload file'}`);
    }

    const fileData = await response.json();
    
    return new Response(JSON.stringify({ 
      success: true, 
      openai_file_id: fileData.id,
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
    const response = await fetch(`https://api.openai.com/v1/files/${openaiFileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${openAIApiKey}` },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to delete OpenAI file:', error);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error deleting knowledge file:', error);
    throw new Error(`Failed to delete knowledge file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

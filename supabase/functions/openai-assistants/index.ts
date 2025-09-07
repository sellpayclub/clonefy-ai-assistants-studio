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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createAssistant(userId: string, data: any) {
  console.log('createAssistant called with data:', data);
  console.log('OpenAI API Key available:', !!openAIApiKey);
  
  const { name, description, instructions, model = 'gpt-4o-mini', calendar_enabled = false } = data;

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
  
  // Prepare tools array for calendar function calling
  const tools = [];
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
      instructions: instructions || null,
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
  const { name, description, instructions, model, calendar_enabled = false } = data;

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

  // Prepare tools array for calendar function calling
  const tools = [];
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
      instructions,
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
    throw new Error(`Failed to upload knowledge file: ${error.message}`);
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
    throw new Error(`Failed to delete knowledge file: ${error.message}`);
  }
}
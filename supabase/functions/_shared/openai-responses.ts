/**
 * Compatibility layer for the OpenAI Responses API.
 *
 * The Assistants API was shut down on 2026-08-26. This module keeps the
 * application's Supabase data model intact while replacing Assistants/Threads
 * calls with Responses/Conversations calls.
 */

export type AssistantConfig = {
  model?: string | null;
  instructions?: string | null;
  tools?: unknown;
  metadata?: Record<string, unknown> | null;
};

export type ToolCall = {
  call_id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type ToolHandler = (call: ToolCall) => Promise<unknown>;

export type ResponseInput =
  | string
  | Array<Record<string, unknown>>;

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export function getSupabaseServiceKey(): string {
  const newKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (newKeys) {
    try {
      const parsed = JSON.parse(newKeys);
      if (typeof parsed.default === 'string' && parsed.default) return parsed.default;
    } catch {
      console.warn('SUPABASE_SECRET_KEYS is not valid JSON; falling back to legacy key');
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}

async function openAIJson(
  apiKey: string,
  path: string,
  init: RequestInit,
): Promise<Record<string, any>> {
  const response = await fetch(`${OPENAI_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const raw = await response.text();
  let data: Record<string, any> = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    const message = data.error?.message || raw || `HTTP ${response.status}`;
    throw new Error(`OpenAI Responses API: ${message}`);
  }

  return data;
}

export function isResponsesConversationId(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('conv_');
}

export async function createOpenAIConversation(
  apiKey: string,
  metadata: Record<string, string> = {},
): Promise<Record<string, any>> {
  return await openAIJson(apiKey, '/conversations', {
    method: 'POST',
    body: JSON.stringify({ metadata }),
  });
}

function normalizeTools(assistant: AssistantConfig): Array<Record<string, unknown>> {
  const source = Array.isArray(assistant.tools) ? assistant.tools : [];
  const tools: Array<Record<string, unknown>> = [];

  for (const item of source as Array<Record<string, any>>) {
    if (item?.type === 'function' && item.function?.name) {
      tools.push({
        type: 'function',
        name: item.function.name,
        description: item.function.description || '',
        parameters: item.function.parameters || { type: 'object', properties: {} },
      });
    } else if (item?.type === 'function' && item.name) {
      tools.push(item);
    }
  }

  const vectorStoreId = assistant.metadata?.vector_store_id;
  if (typeof vectorStoreId === 'string' && vectorStoreId) {
    tools.push({
      type: 'file_search',
      vector_store_ids: [vectorStoreId],
    });
  }

  return tools;
}

function extractText(response: Record<string, any>): string {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const chunks: string[] = [];
  for (const item of response.output || []) {
    if (item?.type !== 'message') continue;
    for (const content of item.content || []) {
      const value = content?.text?.value ?? content?.text;
      if ((content?.type === 'output_text' || content?.type === 'text') && typeof value === 'string') {
        chunks.push(value);
      }
    }
  }
  return chunks.join('\n').trim();
}

function getToolCalls(response: Record<string, any>): Array<Record<string, any>> {
  return (response.output || []).filter((item: Record<string, any>) => item?.type === 'function_call');
}

export async function runOpenAIResponse(options: {
  apiKey: string;
  conversationId: string;
  assistant: AssistantConfig;
  input: ResponseInput;
  onToolCall?: ToolHandler;
  maxToolRounds?: number;
}): Promise<{ id: string; text: string; response: Record<string, any> }> {
  const { apiKey, conversationId, assistant, onToolCall } = options;
  const tools = normalizeTools(assistant);
  const maxToolRounds = options.maxToolRounds ?? 8;
  let input: ResponseInput = options.input;
  let lastResponse: Record<string, any> = {};

  for (let round = 0; round <= maxToolRounds; round++) {
    const body: Record<string, unknown> = {
      model: assistant.model || 'gpt-4o-mini',
      conversation: conversationId,
      instructions: assistant.instructions || '',
      input,
      store: true,
    };
    if (tools.length > 0) body.tools = tools;

    lastResponse = await openAIJson(apiKey, '/responses', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const calls = getToolCalls(lastResponse);
    if (calls.length === 0) {
      const text = extractText(lastResponse);
      if (!text) {
        throw new Error('A OpenAI concluiu a resposta, mas não retornou texto.');
      }
      return { id: lastResponse.id, text, response: lastResponse };
    }

    if (round === maxToolRounds) {
      throw new Error('O agente excedeu o limite de chamadas de ferramentas.');
    }

    input = await Promise.all(calls.map(async (item: Record<string, any>) => {
      let args: Record<string, unknown> = {};
      try {
        args = typeof item.arguments === 'string' ? JSON.parse(item.arguments) : (item.arguments || {});
      } catch {
        args = {};
      }

      let output: unknown;
      try {
        output = onToolCall
          ? await onToolCall({ call_id: item.call_id, name: item.name, arguments: args })
          : { success: false, error: `Ferramenta ${item.name} não disponível neste canal.` };
      } catch (error) {
        output = {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao executar ferramenta',
        };
      }

      return {
        type: 'function_call_output',
        call_id: item.call_id,
        output: typeof output === 'string' ? output : JSON.stringify(output),
      };
    }));
  }

  throw new Error('Não foi possível concluir a resposta do agente.');
}

import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export function knowledgeStorageKey(userId: string, assistantId: string, fileName: string): string {
  const safeName = fileName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+/, '').slice(-160) || 'document.txt';
  return `${userId}/${assistantId}/${crypto.randomUUID()}-${safeName}`;
}

export function knowledgeStoragePath(fileUrl: string): string {
  const marker = '/assistant-knowledge/';
  const start = fileUrl.indexOf(marker);
  if (start < 0) throw new Error('Endereço do arquivo inválido.');
  return decodeURIComponent(fileUrl.slice(start + marker.length).split('?')[0]);
}

async function invokeKnowledge(session: Session, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('openai-assistants', {
    body, headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) {
    let message = error.message;
    if (error.context instanceof Response) {
      const detail = await error.context.clone().json().catch(() => null);
      message = detail?.error || message;
    }
    throw new Error(message);
  }
  if (data?.error || !data?.success) throw new Error(data?.error || 'Não foi possível preparar o documento.');
  return data;
}

export async function syncKnowledgeFiles(session: Session, assistantId: string) {
  return invokeKnowledge(session, { action: 'sync-vector-store', assistantId });
}

export async function uploadAgentKnowledge(session: Session, assistantId: string, file: File, description?: string) {
  const filePath = knowledgeStorageKey(session.user.id, assistantId, file.name);
  const mimeType = file.type || (file.name.toLowerCase().endsWith('.md') ? 'text/markdown' : 'text/plain');
  const { error: uploadError } = await supabase.storage.from('assistant-knowledge').upload(filePath, file, { contentType: mimeType });
  if (uploadError) throw uploadError;
  let persisted = false;
  let openaiFileId: string | undefined;
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result.split(',')[1]) : reject(new Error('Falha ao ler arquivo.'));
      reader.onerror = () => reject(new Error('Falha ao ler arquivo.'));
      reader.readAsDataURL(file);
    });
    const result = await invokeKnowledge(session, { action: 'upload-knowledge-file', file: base64, fileName: file.name, mimeType });
    openaiFileId = result.openai_file_id;
    if (!openaiFileId) throw new Error('A OpenAI não retornou o arquivo enviado.');
    const { data: { publicUrl } } = supabase.storage.from('assistant-knowledge').getPublicUrl(filePath);
    const { error } = await supabase.from('assistant_knowledge_files').insert({
      assistant_id: assistantId, user_id: session.user.id, file_name: file.name,
      file_url: publicUrl, openai_file_id: openaiFileId, file_size: file.size,
      mime_type: mimeType, description: description || null,
    });
    if (error) throw error;
    persisted = true;
    await syncKnowledgeFiles(session, assistantId);
    return result;
  } catch (error) {
    if (!persisted) {
      await supabase.storage.from('assistant-knowledge').remove([filePath]);
      if (openaiFileId) await invokeKnowledge(session, { action: 'delete-knowledge-file', openai_file_id: openaiFileId }).catch(() => undefined);
    }
    throw error;
  }
}

export async function deleteAgentKnowledge(session: Session, assistantId: string, file: { id: string; file_url: string; openai_file_id: string | null }) {
  const { error } = await supabase.from('assistant_knowledge_files').delete().eq('id', file.id).eq('assistant_id', assistantId);
  if (error) throw error;
  await syncKnowledgeFiles(session, assistantId);
  const { error: storageError } = await supabase.storage.from('assistant-knowledge').remove([knowledgeStoragePath(file.file_url)]);
  if (storageError) throw storageError;
  if (file.openai_file_id) await invokeKnowledge(session, { action: 'delete-knowledge-file', openai_file_id: file.openai_file_id });
}
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export interface KnowledgeFile {
  id: string;
  assistant_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  openai_file_id: string | null;
  file_size?: number;
  mime_type?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const useAssistantKnowledgeFiles = (session: Session | null, assistantId?: string) => {
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKnowledgeFiles = useCallback(async () => {
    if (!session || !assistantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('assistant_knowledge_files')
        .select('*')
        .eq('assistant_id', assistantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKnowledgeFiles(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading knowledge files:', err);
    } finally {
      setLoading(false);
    }
  }, [session, assistantId]);

  const uploadKnowledgeFile = async (file: File, description?: string) => {
    if (!session || !assistantId) throw new Error('Session or assistant ID missing');

    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:type;base64, prefix
        };
        reader.onerror = error => reject(error);
      });
    };

    const base64File = await fileToBase64(file);
    
    // Upload para o Supabase Storage
    const fileName = `${session.user.id}/${assistantId}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assistant-knowledge')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Obter URL público
    const { data: { publicUrl } } = supabase.storage
      .from('assistant-knowledge')
      .getPublicUrl(fileName);

    // Upload para OpenAI
    const response = await supabase.functions.invoke('openai-assistants', {
      body: {
        action: 'upload-knowledge-file',
        file: base64File,
        fileName: file.name,
        mimeType: file.type
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Erro ao fazer upload para OpenAI');
    }

    // Salvar metadados no banco
    const { error: dbError } = await supabase
      .from('assistant_knowledge_files')
      .insert({
        assistant_id: assistantId,
        user_id: session.user.id,
        file_name: file.name,
        file_url: publicUrl,
        openai_file_id: response.data.openai_file_id,
        file_size: file.size,
        mime_type: file.type,
        description: description || null,
      });

    if (dbError) throw dbError;

    await loadKnowledgeFiles();
    return response.data;
  };

  const deleteKnowledgeFile = async (fileId: string, fileName: string, openaiFileId: string | null) => {
    if (!session || !assistantId) throw new Error('Session or assistant ID missing');

    // Deletar do OpenAI se tiver ID
    if (openaiFileId) {
      await supabase.functions.invoke('openai-assistants', {
        body: {
          action: 'delete-knowledge-file',
          openai_file_id: openaiFileId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    }

    // Deletar do storage
    const filePath = `${session.user.id}/${assistantId}/${fileName}`;
    await supabase.storage
      .from('assistant-knowledge')
      .remove([filePath]);

    // Deletar do banco
    const { error } = await supabase
      .from('assistant_knowledge_files')
      .delete()
      .eq('id', fileId);

    if (error) throw error;

    await loadKnowledgeFiles();
  };

  useEffect(() => {
    loadKnowledgeFiles();
  }, [loadKnowledgeFiles]);

  return {
    knowledgeFiles,
    loading,
    error,
    loadKnowledgeFiles,
    uploadKnowledgeFile,
    deleteKnowledgeFile,
  };
};
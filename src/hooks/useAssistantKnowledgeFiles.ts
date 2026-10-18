import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { uploadAgentKnowledge, deleteAgentKnowledge } from '@/lib/knowledge-files';

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

    const result = await uploadAgentKnowledge(session, assistantId, file, description);

    await loadKnowledgeFiles();
    return result;
  };

  const deleteKnowledgeFile = async (fileId: string, fileName: string, openaiFileId: string | null) => {
    if (!session || !assistantId) throw new Error('Session or assistant ID missing');

    const file = knowledgeFiles.find(item => item.id === fileId);
    if (!file) throw new Error('Arquivo não encontrado');
    await deleteAgentKnowledge(session, assistantId, file);

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
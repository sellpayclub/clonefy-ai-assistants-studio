import React, { useState, useRef } from "react";
import { Upload, X, FileText, Loader2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AssistantKnowledgeUploadProps {
  assistantId: string;
  onUploadComplete?: () => void;
}

interface KnowledgeFile {
  id: string;
  file_name: string;
  file_url: string;
  openai_file_id: string | null;
  file_size?: number;
  mime_type?: string;
  description?: string;
  created_at: string;
}

export const AssistantKnowledgeUpload = ({ assistantId, onUploadComplete }: AssistantKnowledgeUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadKnowledgeFiles = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('assistant_knowledge_files')
        .select('*')
        .eq('assistant_id', assistantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKnowledgeFiles((data || []) as KnowledgeFile[]);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      toast.error('Erro ao carregar arquivos de conhecimento');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadKnowledgeFiles();
  }, [assistantId]);

  const getFileIcon = () => {
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  const isValidFileType = (file: File): boolean => {
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/json',
      'text/markdown'
    ];
    return allowedTypes.includes(file.type);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      if (!isValidFileType(file)) {
        throw new Error('Tipo de arquivo não suportado. Use: PDF, DOC, DOCX, TXT, CSV, JSON ou MD');
      }

      // Upload para o Supabase Storage
      const fileName = `${user.user.id}/${assistantId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assistant-knowledge')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL público
      const { data: { publicUrl } } = supabase.storage
        .from('assistant-knowledge')
        .getPublicUrl(fileName);

      // Upload para OpenAI (para file search)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'assistants');

      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('openai-assistants', {
        body: {
          action: 'upload-knowledge-file',
          file: await fileToBase64(file),
          fileName: file.name,
          mimeType: file.type
        },
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`,
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
          user_id: user.user.id,
          file_name: file.name,
          file_url: publicUrl,
          openai_file_id: response.data.openai_file_id,
          file_size: file.size,
          mime_type: file.type,
          description: description || null,
        });

      if (dbError) throw dbError;

      // Sync vector store after upload
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        await supabase.functions.invoke('openai-assistants', {
          body: { action: 'sync-vector-store', assistantId },
          headers: { Authorization: `Bearer ${sessionData?.session?.access_token}` },
        });
      } catch (syncError) {
        console.error('Error syncing vector store:', syncError);
      }

      toast.success('Arquivo de conhecimento enviado e indexado com sucesso!');
      setDescription("");
      loadKnowledgeFiles();
      onUploadComplete?.();

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(error.message || 'Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

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

  const deleteFile = async (knowledgeId: string, fileName: string, openaiFileId: string | null) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      // Deletar do OpenAI se tiver ID
      if (openaiFileId) {
        const { data: session } = await supabase.auth.getSession();
        await supabase.functions.invoke('openai-assistants', {
          body: {
            action: 'delete-knowledge-file',
            openai_file_id: openaiFileId
          },
          headers: {
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
        });
      }

      // Deletar do storage
      const filePath = `${user.user.id}/${assistantId}/${fileName}`;
      await supabase.storage
        .from('assistant-knowledge')
        .remove([filePath]);

      // Deletar do banco
      const { error } = await supabase
        .from('assistant_knowledge_files')
        .delete()
        .eq('id', knowledgeId);

      if (error) throw error;

      // Sync vector store after delete
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        await supabase.functions.invoke('openai-assistants', {
          body: { action: 'sync-vector-store', assistantId },
          headers: { Authorization: `Bearer ${sessionData?.session?.access_token}` },
        });
      } catch (syncError) {
        console.error('Error syncing vector store:', syncError);
      }

      toast.success('Arquivo de conhecimento removido!');
      loadKnowledgeFiles();
      onUploadComplete?.();

    } catch (error: any) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar arquivo');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Base de Conhecimento</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Faça upload de documentos que o assistente pode consultar para gerar respostas mais precisas. 
        Suporta: PDF, DOC, DOCX, TXT, CSV, JSON e MD.
      </p>
      
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
        <h4 className="text-xs font-medium text-purple-800 mb-2 flex items-center gap-1">
          🧠 Como a IA usa a base de conhecimento:
        </h4>
        <div className="text-xs text-purple-700 space-y-1">
          <p>• <strong>Consulta:</strong> A IA lê e analisa automaticamente estes documentos</p>
          <p>• <strong>Respostas:</strong> Usa as informações para dar respostas mais precisas</p>
          <p>• <strong>Contexto:</strong> Combina conhecimento dos arquivos com a conversa</p>
          <p>• <strong>Exemplo:</strong> Manual de produtos + FAQ = respostas completas sobre funcionalidades</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="knowledge-description">Descrição (opcional)</Label>
          <Input
            id="knowledge-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o conteúdo do arquivo..."
            className="mt-1"
          />
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.csv,.json,.md"
            disabled={uploading}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
            variant="outline"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Arquivo de Conhecimento
              </>
            )}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {knowledgeFiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum arquivo de conhecimento enviado ainda.
            </p>
          ) : (
            knowledgeFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon()}
                  <div>
                    <p className="font-medium">{file.file_name}</p>
                    {file.description && (
                      <p className="text-sm text-muted-foreground">{file.description}</p>
                    )}
                    {file.file_size && (
                      <p className="text-xs text-muted-foreground">
                        {(file.file_size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteFile(file.id, file.file_name, file.openai_file_id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
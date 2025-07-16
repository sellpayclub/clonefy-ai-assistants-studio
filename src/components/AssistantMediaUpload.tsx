import React, { useState, useRef } from "react";
import { Upload, X, FileImage, FileVideo, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AssistantMediaUploadProps {
  assistantId: string;
  onUploadComplete?: () => void;
}

type FileType = 'image' | 'video' | 'document';

interface MediaFile {
  id: string;
  file_name: string;
  file_type: FileType;
  file_url: string;
  description?: string;
  created_at: string;
}

export const AssistantMediaUpload = ({ assistantId, onUploadComplete }: AssistantMediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMediaFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assistant_media')
        .select('*')
        .eq('assistant_id', assistantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMediaFiles((data || []) as MediaFile[]);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      toast.error('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  };

  // Carregar arquivos quando o componente montar
  React.useEffect(() => {
    loadMediaFiles();
  }, [assistantId]);

  const getFileType = (file: File): FileType => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case 'image': return <FileImage className="h-4 w-4" />;
      case 'video': return <FileVideo className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const uploadFile = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const fileType = getFileType(file);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.user.id}/${assistantId}/${Date.now()}.${fileExt}`;

      // Upload do arquivo para o storage
      const { error: uploadError } = await supabase.storage
        .from('assistant-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL público do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('assistant-media')
        .getPublicUrl(fileName);

      // Salvar informações na tabela assistant_media
      const { error: insertError } = await supabase
        .from('assistant_media')
        .insert({
          assistant_id: assistantId,
          user_id: user.user.id,
          file_name: file.name,
          file_type: fileType,
          file_url: publicUrl,
          description: description || null
        });

      if (insertError) throw insertError;

      toast.success('Arquivo enviado com sucesso!');
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadMediaFiles();
      onUploadComplete?.();

    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (mediaId: string, fileName: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      // Extrair o caminho do arquivo do URL
      const filePath = `${user.user.id}/${assistantId}/${fileName.split('/').pop()}`;

      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('assistant-media')
        .remove([filePath]);

      if (storageError) {
        console.warn('Erro ao deletar do storage:', storageError);
      }

      // Deletar da tabela
      const { error: deleteError } = await supabase
        .from('assistant_media')
        .delete()
        .eq('id', mediaId);

      if (deleteError) throw deleteError;

      toast.success('Arquivo removido com sucesso!');
      loadMediaFiles();
      onUploadComplete?.();

    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      toast.error('Erro ao remover arquivo');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-6">
        <div className="text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <h3 className="text-sm font-medium mb-2">Adicionar Arquivos</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Imagens, vídeos e documentos que a IA poderá enviar no WhatsApp
          </p>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="description" className="text-xs">
                Descrição (opcional)
              </Label>
              <Input
                id="description"
                placeholder="Ex: Catálogo de produtos, vídeo explicativo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs"
              />
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              className="hidden"
              id="file-upload"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
              size="sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Arquivo
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : mediaFiles.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Arquivos Disponíveis</h4>
          <div className="space-y-2">
            {mediaFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.file_name}
                    </p>
                    {file.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {file.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {file.file_type.toUpperCase()} • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteFile(file.id, file.file_url)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Nenhum arquivo adicionado ainda
          </p>
        </div>
      )}
    </div>
  );
};
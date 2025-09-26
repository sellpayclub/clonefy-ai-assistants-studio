import React, { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucket: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ label, value, onChange, bucket }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);

      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem');
      }

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo deve ter no máximo 5MB');
      }

      // Gerar nome único com pasta do usuário (necessário para RLS)
      const fileExt = file.name.split('.').pop();
      const fileName = `widget_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) throw error;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      
      toast({
        title: 'Sucesso!',
        description: 'Imagem enviada com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar imagem',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const removeImage = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {value ? (
        <div className="space-y-2">
          <div className="relative inline-block">
            <img
              src={value}
              alt={label}
              className="w-20 h-20 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
              onClick={removeImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Clique no botão abaixo para alterar a imagem
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <div className="text-sm text-gray-600 mb-2">
            Nenhuma imagem selecionada
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Enviando...' : value ? 'Alterar Imagem' : 'Selecionar Imagem'}
        </Button>
        
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Ou cole a URL da imagem"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="text-xs text-muted-foreground">
        Formatos suportados: JPG, PNG, GIF • Tamanho máximo: 5MB
      </div>
    </div>
  );
};

export default ImageUpload;
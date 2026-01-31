import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeadAttachment {
  id: string;
  lead_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: 'image' | 'document';
  mime_type: string | null;
  file_size: number | null;
  source: 'whatsapp' | 'widget';
  ai_description: string | null;
  created_at: string;
}

export function useLeadAttachments(leadId: string | null) {
  const queryClient = useQueryClient();

  const { data: attachments, isLoading, error } = useQuery({
    queryKey: ['lead-attachments', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from('crm_lead_attachments')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LeadAttachment[];
    },
    enabled: !!leadId
  });

  const deleteAttachment = useMutation({
    mutationFn: async (attachmentId: string) => {
      const { error } = await supabase
        .from('crm_lead_attachments')
        .delete()
        .eq('id', attachmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-attachments', leadId] });
    }
  });

  const imageAttachments = attachments?.filter(a => a.file_type === 'image') || [];
  const documentAttachments = attachments?.filter(a => a.file_type === 'document') || [];

  return {
    attachments: attachments || [],
    imageAttachments,
    documentAttachments,
    isLoading,
    error,
    deleteAttachment
  };
}

// Helper function to format file size
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Helper function to get icon for file type
export function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return '📄';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('word') || mimeType.includes('doc')) return '📘';
  if (mimeType.includes('excel') || mimeType.includes('sheet') || mimeType.includes('xls')) return '📗';
  if (mimeType.includes('image')) return '🖼️';
  return '📄';
}

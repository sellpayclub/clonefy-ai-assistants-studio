import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Calendar,
  Smartphone,
  Globe
} from "lucide-react";
import { useLeadAttachments, formatFileSize, getFileIcon } from "@/hooks/useLeadAttachments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LeadAttachmentsTabProps {
  leadId: string;
}

export function LeadAttachmentsTab({ leadId }: LeadAttachmentsTabProps) {
  const { attachments, imageAttachments, documentAttachments, isLoading, deleteAttachment } = useLeadAttachments(leadId);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Carregando arquivos...</p>
      </div>
    );
  }

  if (!attachments.length) {
    return (
      <div className="p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h4 className="font-medium mb-1">Nenhum documento encontrado</h4>
        <p className="text-sm text-muted-foreground">
          Os documentos e imagens enviados pelo cliente aparecerão aqui.
        </p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteAttachment.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getSourceBadge = (source: string) => {
    if (source === 'widget') {
      return (
        <Badge variant="outline" className="text-[10px] gap-1 border-purple-500/50 text-purple-600">
          <Globe className="h-2.5 w-2.5" /> Site
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] gap-1 border-green-500/50 text-green-600">
        <Smartphone className="h-2.5 w-2.5" /> WhatsApp
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all" className="gap-2">
            <FileText className="h-3.5 w-3.5" /> Todos ({attachments.length})
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-2">
            <ImageIcon className="h-3.5 w-3.5" /> Imagens ({imageAttachments.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-3.5 w-3.5" /> Docs ({documentAttachments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            {attachments.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                attachment={attachment}
                onView={() => attachment.file_type === 'image' && setSelectedImage(attachment.file_url)}
                onDelete={() => setDeleteId(attachment.id)}
                getSourceBadge={getSourceBadge}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            {imageAttachments.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                attachment={attachment}
                onView={() => setSelectedImage(attachment.file_url)}
                onDelete={() => setDeleteId(attachment.id)}
                getSourceBadge={getSourceBadge}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="space-y-2">
            {documentAttachments.map((attachment) => (
              <DocumentRow
                key={attachment.id}
                attachment={attachment}
                onDelete={() => setDeleteId(attachment.id)}
                getSourceBadge={getSourceBadge}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir arquivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O arquivo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface AttachmentCardProps {
  attachment: any;
  onView: () => void;
  onDelete: () => void;
  getSourceBadge: (source: string) => JSX.Element;
}

function AttachmentCard({ attachment, onView, onDelete, getSourceBadge }: AttachmentCardProps) {
  const isImage = attachment.file_type === 'image';

  return (
    <Card className="overflow-hidden group">
      {isImage ? (
        <div 
          className="aspect-square bg-muted cursor-pointer relative"
          onClick={onView}
        >
          <img 
            src={attachment.file_url} 
            alt={attachment.file_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="h-6 w-6 text-white" />
          </div>
        </div>
      ) : (
        <div className="aspect-square bg-muted flex items-center justify-center">
          <span className="text-4xl">{getFileIcon(attachment.mime_type)}</span>
        </div>
      )}
      <CardContent className="p-2">
        <p className="text-xs font-medium truncate mb-1">{attachment.file_name}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {getSourceBadge(attachment.source)}
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              asChild
            >
              <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-3 w-3" />
              </a>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DocumentRowProps {
  attachment: any;
  onDelete: () => void;
  getSourceBadge: (source: string) => JSX.Element;
}

function DocumentRow({ attachment, onDelete, getSourceBadge }: DocumentRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <span className="text-2xl">{getFileIcon(attachment.mime_type)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.file_name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(attachment.file_size)}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(attachment.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getSourceBadge(attachment.source)}
        <Button size="sm" variant="outline" className="gap-1" asChild>
          <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir
          </a>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

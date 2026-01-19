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
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

interface DeleteCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName: string;
}

const DeleteCampaignDialog = ({
  open,
  onOpenChange,
  campaignId,
  campaignName,
}: DeleteCampaignDialogProps) => {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete in order: schedules → messages → leads → campaign
      
      // 1. Delete schedules
      await (supabase as any)
        .from('followup_schedules')
        .delete()
        .eq('campaign_id', campaignId);

      // 2. Delete messages
      await (supabase as any)
        .from('followup_messages')
        .delete()
        .eq('campaign_id', campaignId);

      // 3. Delete leads
      await (supabase as any)
        .from('followup_leads')
        .delete()
        .eq('campaign_id', campaignId);

      // 4. Delete campaign
      const { error } = await (supabase as any)
        .from('followup_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast({ title: "Campanha excluída com sucesso! 🗑️" });
      navigate('/followup');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({ 
        title: "Erro ao excluir campanha", 
        description: "Tente novamente",
        variant: "destructive" 
      });
    } finally {
      setDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir Campanha
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Tem certeza que deseja excluir a campanha <strong>"{campaignName}"</strong>?
            </p>
            <p className="text-destructive font-medium">
              Esta ação é irreversível e irá excluir:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Todos os leads associados</li>
              <li>Todas as mensagens enviadas</li>
              <li>Todos os agendamentos pendentes</li>
              <li>A configuração da campanha</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleting ? "Excluindo..." : "Sim, Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteCampaignDialog;

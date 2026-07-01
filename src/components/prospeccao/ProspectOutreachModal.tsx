import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Loader2, MessageCircle, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ProspectCompany } from '@/lib/prospeccao/constants';
import {
  DEFAULT_OUTREACH_TEMPLATE,
  hasValidPhone,
  renderMessageTemplate,
} from '@/lib/prospeccao/message-template';

interface WhatsAppConnection {
  nomeinstancia: string;
  idassistentgpt: string;
  isConnected?: boolean;
  state?: string;
}

interface ProspectOutreachModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: ProspectCompany[];
  onStart: (params: {
    messageTemplate: string;
    whatsappInstance: string;
    delaySeconds: number;
    importToCrm: boolean;
  }) => Promise<{ campaignId: string; queued: number; skipped: number; estimatedMinutes: number }>;
  getCampaignStatus: (campaignId: string) => Promise<{
    status: string;
    total_leads: number;
    sent_count: number;
    failed_count: number;
    pending_count: number;
  }>;
  processQueueDev?: () => Promise<{ processed: number }>;
  isLocalMode?: boolean;
}

export function ProspectOutreachModal({
  open,
  onOpenChange,
  companies,
  onStart,
  getCampaignStatus,
  processQueueDev,
  isLocalMode,
}: ProspectOutreachModalProps) {
  const { toast } = useToast();
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [whatsappInstance, setWhatsappInstance] = useState('');
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_OUTREACH_TEMPLATE);
  const [delaySeconds, setDelaySeconds] = useState(45);
  const [importToCrm, setImportToCrm] = useState(true);
  const [starting, setStarting] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    status: string;
    total: number;
    sent: number;
    failed: number;
    pending: number;
  } | null>(null);

  const leadsWithPhone = useMemo(
    () => companies.filter(hasValidPhone),
    [companies],
  );

  const previewMessage = useMemo(() => {
    const sample = leadsWithPhone[0] || companies[0];
    if (!sample) return '';
    return renderMessageTemplate(messageTemplate, sample);
  }, [messageTemplate, leadsWithPhone, companies]);

  const estimatedMinutes = Math.ceil((leadsWithPhone.length * delaySeconds) / 60);

  useEffect(() => {
    if (!open) return;

    setCampaignId(null);
    setProgress(null);

    const loadConnections = async () => {
      setLoadingConnections(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await supabase.functions.invoke('whatsapp-evolution', {
          body: { action: 'list' },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (response.error) throw new Error(response.error.message);

        const list = (response.data?.connections || []) as WhatsAppConnection[];
        const withAssistant = list.filter(
          c => c.idassistentgpt?.trim() && (c.isConnected !== false && c.state !== 'close'),
        );
        setConnections(withAssistant);
        if (withAssistant.length === 1) {
          setWhatsappInstance(withAssistant[0].nomeinstancia);
        }
      } catch (err: any) {
        toast({
          title: 'Erro ao carregar conexões',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setLoadingConnections(false);
      }
    };

    loadConnections();
  }, [open, toast]);

  useEffect(() => {
    if (!campaignId || !open) return;

    const poll = async () => {
      try {
        const status = await getCampaignStatus(campaignId);
        setProgress({
          status: status.status,
          total: status.total_leads,
          sent: status.sent_count,
          failed: status.failed_count,
          pending: status.pending_count,
        });

        if (isLocalMode && processQueueDev && status.status === 'running' && status.pending_count > 0) {
          await processQueueDev();
        }

        if (['completed', 'failed', 'cancelled'].includes(status.status)) {
          toast({
            title: status.status === 'completed' ? 'Disparo concluído' : 'Disparo finalizado',
            description: `${status.sent_count} enviada(s), ${status.failed_count} falha(s).`,
          });
        }
      } catch (err) {
        console.warn('Poll status error:', err);
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [campaignId, open, getCampaignStatus, processQueueDev, isLocalMode, toast]);

  const handleStart = async () => {
    if (!whatsappInstance) {
      toast({ title: 'Selecione uma conexão WhatsApp', variant: 'destructive' });
      return;
    }
    if (!messageTemplate.trim()) {
      toast({ title: 'Digite a mensagem', variant: 'destructive' });
      return;
    }
    if (!leadsWithPhone.length) {
      toast({ title: 'Nenhum lead com telefone válido', variant: 'destructive' });
      return;
    }

    setStarting(true);
    try {
      const result = await onStart({
        messageTemplate: messageTemplate.trim(),
        whatsappInstance,
        delaySeconds,
        importToCrm,
      });
      setCampaignId(result.campaignId);
      setProgress({
        status: 'running',
        total: result.queued,
        sent: 0,
        failed: 0,
        pending: result.queued,
      });
      toast({
        title: 'Disparo iniciado',
        description: `${result.queued} mensagem(ns) na fila (~${result.estimatedMinutes} min).`,
      });
      if (isLocalMode && processQueueDev) {
        await processQueueDev();
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao iniciar disparo',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setStarting(false);
    }
  };

  const progressPercent = progress
    ? Math.round(((progress.sent + progress.failed) / Math.max(progress.total, 1)) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Disparar WhatsApp com IA
          </DialogTitle>
          <DialogDescription>
            Envie mensagem personalizada para os leads selecionados. Quando responderem, a IA da
            conexão assumirá o atendimento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md bg-muted p-3 text-sm space-y-1">
            <p>
              <strong>{leadsWithPhone.length}</strong> lead(s) com telefone válido
              {companies.length > leadsWithPhone.length && (
                <span className="text-muted-foreground">
                  {' '}({companies.length - leadsWithPhone.length} sem telefone serão ignorados)
                </span>
              )}
            </p>
            <p className="text-muted-foreground">
              Tempo estimado: ~{estimatedMinutes} min (intervalo de {delaySeconds}s)
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Smartphone className="h-3.5 w-3.5" />
              Conexão WhatsApp
            </Label>
            {loadingConnections ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando conexões...
              </div>
            ) : connections.length === 0 ? (
              <p className="text-sm text-destructive">
                Nenhuma conexão com assistente IA encontrada. Configure em Conexões WhatsApp.
              </p>
            ) : (
              <Select value={whatsappInstance} onValueChange={setWhatsappInstance}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conexão" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map(c => (
                    <SelectItem key={c.nomeinstancia} value={c.nomeinstancia}>
                      {c.nomeinstancia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Mensagem (use {'{nome}'}, {'{empresa}'}, {'{cidade}'}, {'{socio}'})</Label>
            <Textarea
              value={messageTemplate}
              onChange={e => setMessageTemplate(e.target.value)}
              rows={4}
              disabled={!!campaignId}
            />
            {previewMessage && (
              <div className="rounded border p-2 text-xs bg-muted/50">
                <span className="text-muted-foreground">Preview: </span>
                {previewMessage}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Intervalo entre mensagens: {delaySeconds}s</Label>
            <input
              type="range"
              min={30}
              max={120}
              step={5}
              value={delaySeconds}
              onChange={e => setDelaySeconds(Number(e.target.value))}
              className="w-full"
              disabled={!!campaignId}
            />
            <p className="text-xs text-muted-foreground">
              Intervalo maior reduz risco de bloqueio no WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="import-crm"
              checked={importToCrm}
              onCheckedChange={v => setImportToCrm(!!v)}
              disabled={!!campaignId}
            />
            <Label htmlFor="import-crm" className="font-normal cursor-pointer">
              Importar leads no CRM automaticamente
            </Label>
          </div>

          {progress && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-sm">
                <span>
                  {progress.status === 'running' ? 'Enviando...' : 'Concluído'}
                </span>
                <span>
                  {progress.sent}/{progress.total} enviadas
                  {progress.failed > 0 && ` · ${progress.failed} falhas`}
                </span>
              </div>
              <Progress value={progressPercent} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {campaignId ? 'Fechar' : 'Cancelar'}
          </Button>
          {!campaignId && (
            <Button
              onClick={handleStart}
              disabled={starting || !connections.length || !leadsWithPhone.length}
              className="gap-2"
            >
              {starting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              Iniciar disparo
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

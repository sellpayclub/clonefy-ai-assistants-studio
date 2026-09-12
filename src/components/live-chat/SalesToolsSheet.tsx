/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { Archive, Bot, File, FileAudio, FileImage, Film, MessageSquare, Search, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { LiveChatSession } from '@/hooks/useLiveChat';
import type { SalesAsset, SalesFunnel, SalesMediaType } from '@/hooks/useSalesLibrary';

const db = supabase as any;
const icons: Record<SalesMediaType, typeof File> = {
  text: MessageSquare, audio: FileAudio, image: FileImage, video: Film, document: File,
};

export function SalesToolsSheet({ session }: { session: LiveChatSession }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<SalesAsset[]>([]);
  const [funnels, setFunnels] = useState<SalesFunnel[]>([]);
  const [activeRun, setActiveRun] = useState<{ id: string; status: string; sales_funnels?: { name: string } } | null>(null);
  const [lastRunError, setLastRunError] = useState<string | null>(null);

  const load = async () => {
    if (!user?.id || session.source !== 'whatsapp') return;
    setLoading(true);
    try {
      const { data: memberships } = await db.from('sales_library_members').select('library_id').eq('user_id', user.id);
      const libraryIds = (memberships || []).map((item: any) => item.library_id);
      if (libraryIds.length === 0) { setAssets([]); setFunnels([]); return; }

      const [assetsResult, funnelsResult, runResult] = await Promise.all([
        db.from('sales_media_assets').select('*').in('library_id', libraryIds).eq('is_active', true).order('folder').order('name'),
        db.from('sales_funnels').select('*, sales_funnel_steps(*)').in('library_id', libraryIds).eq('is_active', true).order('name'),
        db.from('sales_funnel_runs').select('id, status, last_error, sales_funnels(name)').eq('session_id', session.id).order('started_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      setAssets((assetsResult.data || []) as SalesAsset[]);
      setFunnels((funnelsResult.data || []) as SalesFunnel[]);
      const latestRun = runResult.data;
      const activeStatuses = ['running', 'processing', 'waiting_time', 'waiting_reply', 'paused'];
      setActiveRun(latestRun && activeStatuses.includes(latestRun.status) ? latestRun : null);
      setLastRunError(latestRun?.status === 'failed' ? latestRun.last_error || 'A sequência não pôde ser concluída.' : null);
    } finally {
      setLoading(false);
    }
  };

  // Reload when the drawer opens or the selected conversation changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) load().catch(console.error); }, [open, session.id, user?.id]);

  const filteredAssets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return assets;
    return assets.filter((item) => `${item.name} ${item.folder} ${item.content || ''}`.toLowerCase().includes(term));
  }, [assets, search]);

  const filteredFunnels = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return funnels;
    return funnels.filter((item) => `${item.name} ${item.description || ''}`.toLowerCase().includes(term));
  }, [funnels, search]);

  const sendAsset = async (asset: SalesAsset) => {
    if (!user?.id || sendingId) return;
    setSendingId(asset.id);
    try {
      const { error } = await supabase.functions.invoke('live-chat-send', { body: {
        session_id: session.id,
        instance_name: session.instance_name,
        contact_number: session.contact_number,
        source: session.source,
        user_id: user.id,
        asset_id: asset.id,
      }});
      if (error) throw error;
      toast({ title: 'Material enviado', description: asset.name });
      setOpen(false);
    } catch (error) {
      toast({ title: 'Erro ao enviar', description: error instanceof Error ? error.message : 'Tente novamente', variant: 'destructive' });
    } finally { setSendingId(null); }
  };

  const startFunnel = async (funnel: SalesFunnel) => {
    if (sendingId) return;
    setSendingId(funnel.id);
    try {
      const { data, error } = await supabase.functions.invoke('sales-funnel-engine', { body: {
        action: 'start', funnel_id: funnel.id, session_id: session.id,
      }});
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setLastRunError(null);
      toast({ title: funnel.flow_kind === 'quick_reply' ? 'Resposta enviada' : 'Funil iniciado', description: funnel.name });
      await load();
    } catch (error) {
      toast({ title: 'Não foi possível iniciar', description: error instanceof Error ? error.message : 'Tente novamente', variant: 'destructive' });
    } finally { setSendingId(null); }
  };

  const cancelRun = async () => {
    if (!activeRun) return;
    setSendingId(activeRun.id);
    try {
      const { data, error } = await supabase.functions.invoke('sales-funnel-engine', { body: { action: 'cancel', run_id: activeRun.id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setActiveRun(null);
      toast({ title: 'Funil interrompido' });
    } catch (error) {
      toast({ title: 'Erro ao interromper', description: error instanceof Error ? error.message : 'Tente novamente', variant: 'destructive' });
    } finally { setSendingId(null); }
  };

  if (session.source !== 'whatsapp') return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button variant="outline" size="icon" title="Materiais e funis"><Archive className="h-4 w-4" /></Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>Materiais e funis</SheetTitle><SheetDescription>Envie uma resposta pronta ou inicie uma sequência nesta conversa.</SheetDescription></SheetHeader>
        <div className="relative mt-5"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar áudio, texto ou funil…" /></div>

        {activeRun && <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-center justify-between gap-3"><div><p className="font-medium text-sm">Funil em execução</p><p className="text-xs text-muted-foreground">{activeRun.sales_funnels?.name || 'Sequência ativa'} · {activeRun.status === 'waiting_reply' ? 'aguardando resposta' : 'aguardando próxima etapa'}</p></div><Button variant="destructive" size="sm" onClick={cancelRun} disabled={!!sendingId}><Square className="h-3 w-3 mr-2" />Parar</Button></div>}
        {lastRunError && <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3"><p className="font-medium text-sm text-destructive">A última sequência falhou</p><p className="text-xs text-muted-foreground mt-1">{lastRunError}</p></div>}

        <Tabs defaultValue="materials" className="mt-5"><TabsList className="grid grid-cols-2"><TabsTrigger value="materials">Materiais</TabsTrigger><TabsTrigger value="funnels">Fluxos</TabsTrigger></TabsList>
          <TabsContent value="materials" className="space-y-2 mt-4">{loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : filteredAssets.map((asset) => { const Icon = icons[asset.media_type]; return <button key={asset.id} disabled={!!sendingId} onClick={() => sendAsset(asset)} className="w-full rounded-lg border p-3 text-left flex items-start gap-3 hover:border-primary hover:bg-primary/5 disabled:opacity-50"><Icon className="h-5 w-5 text-primary mt-0.5" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="font-medium truncate">{asset.name}</p><Badge variant="secondary">{asset.folder}</Badge></div>{asset.content && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{asset.content}</p>}</div></button>; })}{!loading && filteredAssets.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Nenhum material disponível.</p>}</TabsContent>
          <TabsContent value="funnels" className="space-y-2 mt-4">{filteredFunnels.map((funnel) => <button key={funnel.id} disabled={!!sendingId || !!activeRun} onClick={() => startFunnel(funnel)} className="w-full rounded-lg border p-3 text-left flex items-start gap-3 hover:border-primary hover:bg-primary/5 disabled:opacity-50"><Bot className="h-5 w-5 text-primary mt-0.5" /><div className="flex-1"><div className="flex items-center justify-between gap-2"><p className="font-medium">{funnel.name}</p><Badge>{funnel.flow_kind === 'automation' ? 'Automático' : 'Resposta pronta'}</Badge></div><p className="text-xs text-muted-foreground mt-1">{funnel.sales_funnel_steps?.length || 0} etapas</p></div></button>)}{!loading && filteredFunnels.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Nenhum fluxo ativo.</p>}</TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

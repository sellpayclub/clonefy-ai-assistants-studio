import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, Bot, Clock, Copy, File as FileIcon, FileAudio, FileImage, Film, Link2, MessageSquare, Mic, Plus, Save, Square, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { SalesAsset, SalesFunnel, SalesMediaType, SalesStepType, useSalesLibrary } from '@/hooks/useSalesLibrary';
import { formatFileSize, salesMediaRules, validateSalesFile } from '@/lib/sales-media';

const mediaLabels: Record<SalesMediaType, string> = {
  text: 'Texto', audio: 'Áudio', image: 'Imagem', video: 'Vídeo', document: 'Documento',
};

const stepLabels: Record<SalesStepType, string> = {
  ...mediaLabels,
  wait: 'Esperar tempo e continuar',
  wait_for_reply: 'Esperar o cliente responder',
};

const mediaIcons: Record<SalesMediaType, typeof FileIcon> = {
  text: MessageSquare, audio: FileAudio, image: FileImage, video: Film, document: FileIcon,
};

export default function SalesFunnels() {
  const sales = useSalesLibrary();
  const { toast } = useToast();
  const [joinCode, setJoinCode] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetFolder, setAssetFolder] = useState('Geral');
  const [assetType, setAssetType] = useState<SalesMediaType>('audio');
  const [assetContent, setAssetContent] = useState('');
  const [assetCaption, setAssetCaption] = useState('');
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const [newFunnelName, setNewFunnelName] = useState('');
  const [newFunnelKind, setNewFunnelKind] = useState<SalesFunnel['flow_kind']>('automation');
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);
  const [stepType, setStepType] = useState<SalesStepType>('text');
  const [stepAssetId, setStepAssetId] = useState('custom');
  const [stepContent, setStepContent] = useState('');
  const [stepDelay, setStepDelay] = useState(0);

  const canManage = sales.selectedLibrary?.role === 'owner' || sales.selectedLibrary?.role === 'editor';
  const selectedFunnel = sales.funnels.find((item) => item.id === selectedFunnelId) || null;
  const compatibleAssets = useMemo(() => sales.assets.filter((asset) => asset.media_type === stepType), [sales.assets, stepType]);

  useEffect(() => {
    if (!['text', 'wait', 'wait_for_reply'].includes(stepType) && stepAssetId === 'custom' && compatibleAssets[0]) {
      setStepAssetId(compatibleAssets[0].id);
    }
  }, [compatibleAssets, stepAssetId, stepType]);

  useEffect(() => {
    if (!selectedFunnelId && sales.funnels[0]) setSelectedFunnelId(sales.funnels[0].id);
    if (selectedFunnelId && !sales.funnels.some((item) => item.id === selectedFunnelId)) {
      setSelectedFunnelId(sales.funnels[0]?.id || null);
    }
  }, [sales.funnels, selectedFunnelId]);

  useEffect(() => () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      toast({ title: success });
    } catch (error) {
      toast({ title: 'Não foi possível concluir', description: error instanceof Error ? error.message : 'Tente novamente', variant: 'destructive' });
    }
  };

  const submitAsset = async () => {
    if (!assetName.trim()) return;
    await run(async () => {
      await sales.createAsset({
        name: assetName.trim(), folder: assetFolder.trim() || 'Geral', mediaType: assetType,
        content: assetContent, caption: assetCaption, file: assetFile,
      });
      setAssetName(''); setAssetContent(''); setAssetCaption(''); setAssetFile(null);
    }, 'Material salvo');
  };

  const selectAssetFile = (file: File | null) => {
    if (!file) {
      setAssetFile(null);
      return;
    }
    const validationError = validateSalesFile(file, assetType);
    if (validationError) {
      setAssetFile(null);
      toast({ title: 'Arquivo não aceito', description: validationError, variant: 'destructive' });
      return;
    }
    setAssetFile(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find((mime) => MediaRecorder.isTypeSupported(mime));
      const recorder = new MediaRecorder(stream, preferredMime ? { mimeType: preferredMime } : undefined);
      recordingChunksRef.current = [];
      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || preferredMime || 'audio/webm';
        const extension = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const recordedFile = new File(recordingChunksRef.current, `audio-${Date.now()}.${extension}`, { type: mimeType });
        const validationError = validateSalesFile(recordedFile, 'audio');
        if (validationError) {
          setAssetFile(null);
          toast({ title: 'Gravação muito grande', description: validationError, variant: 'destructive' });
        } else {
          setAssetFile(recordedFile);
        }
        setAssetName((current) => current || 'Áudio gravado');
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);
      };
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: 'Microfone indisponível',
        description: error instanceof Error ? error.message : 'Permita o acesso ao microfone no navegador.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
  };

  const submitStep = async () => {
    if (!selectedFunnel) return;
    const isControl = stepType === 'wait' || stepType === 'wait_for_reply';
    if (!isControl && stepAssetId === 'custom' && !stepContent.trim()) return;
    await run(async () => {
      await sales.addStep(selectedFunnel, {
        step_type: stepType,
        asset_id: isControl || stepAssetId === 'custom' ? null : stepAssetId,
        content: !isControl && stepAssetId === 'custom' ? stepContent : null,
        delay_seconds: stepDelay,
      });
      setStepContent(''); setStepAssetId('custom'); setStepDelay(0);
    }, 'Etapa adicionada');
  };

  if (sales.loading) return <main className="flex-1 flex items-center justify-center">Carregando biblioteca…</main>;

  if (sales.error) return (
    <main className="flex-1 overflow-auto p-4 md:p-6">
      <Card className="max-w-2xl mx-auto mt-10">
        <CardHeader>
          <CardTitle>Não foi possível abrir a biblioteca</CardTitle>
          <CardDescription>{sales.error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void sales.retry()}>Tentar novamente</Button>
        </CardContent>
      </Card>
    </main>
  );

  return (
    <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Funis e respostas prontas</h1>
          <p className="text-muted-foreground">Monte sequências e disponibilize os mesmos materiais no Chat ao Vivo.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sales.libraries.length > 1 && (
            <Select value={sales.selectedLibraryId || ''} onValueChange={sales.setSelectedLibraryId}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>{sales.libraries.map((library) => <SelectItem key={library.id} value={library.id}>{library.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {sales.selectedLibrary?.role === 'owner' && (
            <Button variant="outline" onClick={() => {
              navigator.clipboard.writeText(sales.selectedLibrary?.share_code || '');
              toast({ title: 'Código copiado' });
            }}>
              <Copy className="h-4 w-4 mr-2" /> Compartilhar: {sales.selectedLibrary.share_code}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1 space-y-2">
            <Label>Entrar numa biblioteca da equipe</Label>
            <Input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="Cole o código compartilhado" />
          </div>
          <Button variant="secondary" disabled={!joinCode.trim()} onClick={() => run(async () => {
            await sales.joinLibrary(joinCode); setJoinCode('');
          }, 'Biblioteca adicionada')}><Link2 className="h-4 w-4 mr-2" />Entrar</Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="funnels">
        <TabsList>
          <TabsTrigger value="funnels"><Bot className="h-4 w-4 mr-2" />Funis</TabsTrigger>
          <TabsTrigger value="library"><Archive className="h-4 w-4 mr-2" />Biblioteca</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          {canManage && (
            <Card>
              <CardHeader><CardTitle>Novo material</CardTitle><CardDescription>Textos e arquivos ficam disponíveis para toda a equipe.</CardDescription></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Nome</Label><Input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="Ex.: Áudio de apresentação" /></div>
                <div className="space-y-2"><Label>Pasta</Label><Input value={assetFolder} onChange={(e) => setAssetFolder(e.target.value)} /></div>
                <div className="space-y-2"><Label>Tipo</Label><Select disabled={isRecording} value={assetType} onValueChange={(value) => { setAssetType(value as SalesMediaType); setAssetFile(null); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(mediaLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                {assetType === 'text' ? (
                  <div className="space-y-2 md:col-span-2"><Label>Texto</Label><Textarea className="min-h-40 font-sans" value={assetContent} onChange={(e) => setAssetContent(e.target.value)} placeholder="Use {nome} e {telefone} para personalizar." /><p className="text-xs text-muted-foreground">Variáveis: {'{nome}'} usa o primeiro nome, {'{nome_completo}'} usa o nome inteiro e {'{telefone}'} usa o número. Maiúsculas e chaves duplas também funcionam. Quebras de linha, emojis, links, *negrito*, _itálico_ e ~tachado~ serão preservados.</p></div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>{assetType === 'audio' ? 'Áudio' : 'Arquivo'}</Label>
                      <Input disabled={isRecording} type="file" accept={salesMediaRules[assetType].accept} onChange={(e) => selectAssetFile(e.target.files?.[0] || null)} />
                      {assetType === 'audio' && (
                        <div className="flex items-center gap-2">
                          <Button type="button" variant={isRecording ? 'destructive' : 'outline'} onClick={isRecording ? stopRecording : startRecording}>
                            {isRecording ? <Square className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                            {isRecording ? 'Parar gravação' : 'Gravar pelo microfone'}
                          </Button>
                          {assetFile && !isRecording && <span className="text-xs text-muted-foreground truncate">{assetFile.name}</span>}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {salesMediaRules[assetType].formats} · máximo {formatFileSize(salesMediaRules[assetType].maxBytes)}. {salesMediaRules[assetType].hint}
                      </p>
                    </div>
                    <div className="space-y-2 md:col-span-2"><Label>Legenda opcional</Label><Textarea value={assetCaption} onChange={(e) => setAssetCaption(e.target.value)} /></div>
                  </>
                )}
                <div className="md:col-span-2"><Button onClick={submitAsset} disabled={!assetName.trim() || (assetType === 'text' ? !assetContent.trim() : !assetFile)}><Save className="h-4 w-4 mr-2" />Salvar material</Button></div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sales.assets.map((asset) => {
              const Icon = mediaIcons[asset.media_type];
              return <Card key={asset.id}><CardContent className="pt-5 flex items-start gap-3"><Icon className="h-5 w-5 text-primary mt-1" /><div className="min-w-0 flex-1"><p className="font-medium truncate">{asset.name}</p><p className="text-xs text-muted-foreground">{asset.folder} · {mediaLabels[asset.media_type]}</p>{asset.content && <p className="text-sm mt-2 whitespace-pre-wrap break-words line-clamp-6">{asset.content}</p>}</div>{canManage && <Button size="icon" variant="ghost" onClick={() => run(() => sales.deleteAsset(asset), 'Material removido')}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</CardContent></Card>;
            })}
          </div>
        </TabsContent>

        <TabsContent value="funnels" className="space-y-4">
          {canManage && (
            <Card><CardContent className="pt-6 flex flex-col md:flex-row gap-3 md:items-end"><div className="flex-1 space-y-2"><Label>Nome do novo fluxo</Label><Input value={newFunnelName} onChange={(e) => setNewFunnelName(e.target.value)} placeholder="Ex.: Apresentação comercial" /></div><div className="space-y-2"><Label>Modo</Label><Select value={newFunnelKind} onValueChange={(value) => setNewFunnelKind(value as SalesFunnel['flow_kind'])}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="automation">Automação</SelectItem><SelectItem value="quick_reply">Resposta pronta</SelectItem></SelectContent></Select></div><Button disabled={!newFunnelName.trim()} onClick={() => run(async () => { const id = await sales.createFunnel(newFunnelName.trim(), newFunnelKind); setSelectedFunnelId(id); setNewFunnelName(''); }, 'Fluxo criado')}><Plus className="h-4 w-4 mr-2" />Criar</Button></CardContent></Card>
          )}

          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <Card><CardHeader><CardTitle className="text-base">Seus fluxos</CardTitle></CardHeader><CardContent className="space-y-2">{sales.funnels.map((funnel) => <button key={funnel.id} onClick={() => setSelectedFunnelId(funnel.id)} className={`w-full text-left rounded-lg border p-3 transition ${selectedFunnelId === funnel.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}><div className="flex items-center justify-between gap-2"><span className="font-medium truncate">{funnel.name}</span><Badge variant={funnel.is_active ? 'default' : 'secondary'}>{funnel.is_active ? 'Ativo' : 'Rascunho'}</Badge></div><p className="text-xs text-muted-foreground mt-1">{funnel.flow_kind === 'automation' ? 'Automação' : 'Resposta pronta'} · {funnel.sales_funnel_steps.length} etapas</p></button>)}</CardContent></Card>

            {selectedFunnel ? (
              <Card>
                <CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>{selectedFunnel.name}</CardTitle><CardDescription>{selectedFunnel.flow_kind === 'automation' ? 'Executa etapas e pode esperar o cliente responder.' : 'Sequência curta acionada pelo vendedor.'}</CardDescription></div>{canManage && <div className="flex items-center gap-3"><Label htmlFor="funnel-active">Disponível no chat</Label><Switch id="funnel-active" checked={selectedFunnel.is_active} onCheckedChange={(checked) => run(() => sales.updateFunnel(selectedFunnel.id, { is_active: checked }), checked ? 'Fluxo ativado' : 'Fluxo pausado')} /><Button variant="ghost" size="icon" onClick={() => run(() => sales.deleteFunnel(selectedFunnel.id), 'Fluxo removido')}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>}</div></CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                    <strong className="text-foreground">Controle do tempo:</strong> em qualquer texto ou arquivo, informe quantos segundos esperar antes da próxima etapa. Para uma pausa separada, escolha <strong className="text-foreground">Esperar tempo e continuar</strong>. Para só continuar depois de uma mensagem do cliente, escolha <strong className="text-foreground">Esperar o cliente responder</strong>.
                  </div>
                  <div className="space-y-2">{selectedFunnel.sales_funnel_steps.map((step) => {
                    const asset = sales.assets.find((item) => item.id === step.asset_id);
                    return <div key={step.id} className="flex items-start gap-3 rounded-lg border p-3"><Badge variant="outline">{step.position}</Badge><div className="flex-1 min-w-0"><p className="font-medium">{stepLabels[step.step_type]}</p><p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">{asset?.name || step.content || (step.step_type === 'wait' ? `${step.delay_seconds}s` : `Após resposta: ${step.delay_seconds}s`)}</p></div>{step.delay_seconds > 0 && step.step_type !== 'wait' && <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{step.delay_seconds}s</Badge>}{canManage && <Button size="icon" variant="ghost" onClick={() => run(() => sales.deleteStep(selectedFunnel, step), 'Etapa removida')}><Trash2 className="h-4 w-4" /></Button>}</div>;
                  })}</div>

                  {canManage && <div className="rounded-lg border border-dashed p-4 space-y-4"><h3 className="font-medium">Adicionar próxima etapa</h3><div className="grid gap-3 md:grid-cols-3"><div className="space-y-2"><Label>O que deve acontecer?</Label><Select value={stepType} onValueChange={(value) => { setStepType(value as SalesStepType); setStepAssetId('custom'); setStepContent(''); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(stepLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>{stepType !== 'wait' && stepType !== 'wait_for_reply' && <div className="space-y-2"><Label>Material</Label><Select value={stepAssetId} onValueChange={setStepAssetId}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{stepType === 'text' && <SelectItem value="custom">Texto personalizado</SelectItem>}{compatibleAssets.map((asset) => <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>)}</SelectContent></Select></div>}<div className="space-y-2"><Label>{stepType === 'wait' ? 'Aguardar antes de continuar' : stepType === 'wait_for_reply' ? 'Após a resposta, aguardar' : 'Antes da próxima etapa'} (segundos)</Label><Input type="number" min={0} value={stepDelay} onChange={(e) => setStepDelay(Math.max(0, Number(e.target.value)))} /></div></div>{stepType === 'text' && stepAssetId === 'custom' && <div className="space-y-2"><Textarea className="min-h-36" value={stepContent} onChange={(e) => setStepContent(e.target.value)} placeholder="Digite a mensagem. Você pode usar {nome}." /><p className="text-xs text-muted-foreground">{'{nome}'} = primeiro nome · {'{nome_completo}'} = nome inteiro · {'{telefone}'} = número. O WhatsApp receberá as mesmas quebras de linha e marcações digitadas aqui.</p></div>}{!['text', 'wait', 'wait_for_reply'].includes(stepType) && compatibleAssets.length === 0 && <p className="text-sm text-amber-600">Cadastre primeiro um material desse tipo na aba Biblioteca.</p>}<Button onClick={submitStep} disabled={!['text', 'wait', 'wait_for_reply'].includes(stepType) && compatibleAssets.length === 0}><Plus className="h-4 w-4 mr-2" />Adicionar etapa</Button></div>}
                </CardContent>
              </Card>
            ) : <Card><CardContent className="py-16 text-center text-muted-foreground"><Users className="h-10 w-10 mx-auto mb-3 opacity-40" />Crie ou selecione um fluxo.</CardContent></Card>}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

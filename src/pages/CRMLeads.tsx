import { useState, useEffect, useMemo, useCallback } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Plus, MessageSquare, Phone, Mail, Calendar, Globe, Smartphone, Flame, Thermometer, Snowflake, ArrowRight, LayoutList, Kanban, Settings2, Building2, MessageCircle, Trash2, Eraser } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LeadDetailsDrawer } from "@/components/crm/LeadDetailsDrawer";
import { LeadForm } from "@/components/crm/LeadForm";
import { LeadFilters } from "@/components/crm/LeadFilters";
import { LeadKanban } from "@/components/crm/LeadKanban";
import { PipelineSettings } from "@/components/crm/PipelineSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useCRMLeads, type Lead } from "@/hooks/useCRMLeads";
import { ProspectOutreachModal } from "@/components/prospeccao/ProspectOutreachModal";
import {
  getOutreachCampaignStatus,
  startOutreachCampaign,
} from "@/lib/outreach/call-outreach";
import {
  isCrmLeadCallable,
  mapCallableCrmLeads,
} from "@/lib/outreach/map-crm-lead";
import type { ProspectCompany } from "@/lib/prospeccao/constants";
import { useToast } from "@/hooks/use-toast";

const CRMLeads = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const crm = useCRMLeads();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showPipelineSettings, setShowPipelineSettings] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [outreachCompanies, setOutreachCompanies] = useState<ProspectCompany[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupDays, setCleanupDays] = useState('90');

  const callableFilteredLeads = useMemo(
    () => crm.filteredLeads.filter(isCrmLeadCallable),
    [crm.filteredLeads],
  );

  const callableIdSet = useMemo(
    () => new Set(callableFilteredLeads.map(l => l.id)),
    [callableFilteredLeads],
  );

  const selectedLeads = useMemo(
    () => crm.filteredLeads.filter(l => selectedIds.has(l.id)),
    [crm.filteredLeads, selectedIds],
  );

  const selectedCount = selectedIds.size;
  const allFilteredSelected =
    callableFilteredLeads.length > 0 &&
    callableFilteredLeads.every(l => selectedIds.has(l.id));

  const toggleLeadSelection = useCallback((leadId: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(leadId);
      else next.delete(leadId);
      return next;
    });
  }, []);

  const toggleSelectAllFiltered = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(callableFilteredLeads.map(l => l.id)));
  }, [allFilteredSelected, callableFilteredLeads]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleOpenOutreach = useCallback(() => {
    const mapped = mapCallableCrmLeads(selectedLeads);
    if (!mapped.length) {
      toast({
        title: 'Nenhum lead com telefone válido',
        description: 'Selecione leads com número WhatsApp real (não widget).',
        variant: 'destructive',
      });
      return;
    }
    if (mapped.length < selectedLeads.length) {
      toast({
        title: `${selectedLeads.length - mapped.length} lead(s) ignorado(s)`,
        description: 'Leads sem telefone válido não entram no disparo.',
      });
    }
    setOutreachCompanies(mapped);
    setOutreachOpen(true);
  }, [selectedLeads, toast]);

  const handleDeleteSelected = useCallback(async () => {
    await crm.deleteLeadsBulk.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
    setConfirmDeleteOpen(false);
  }, [crm.deleteLeadsBulk, selectedIds]);

  const handleCleanupOld = useCallback(async () => {
    const days = parseInt(cleanupDays, 10);
    if (!Number.isFinite(days) || days < 1) return;
    await crm.cleanupOldLeads.mutateAsync(days);
    setCleanupOpen(false);
  }, [crm.cleanupOldLeads, cleanupDays]);



  // Init default stages if none exist
  useEffect(() => {
    if (!crm.stagesLoading && crm.pipelineStages.length === 0 && user?.id) {
      crm.initDefaultStages.mutate();
    }
  }, [crm.stagesLoading, crm.pipelineStages.length, user?.id]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    crm.openLeadNotes(lead.id);
    setIsDrawerOpen(true);
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-red-500 hover:bg-red-600 gap-1 text-xs"><Flame className="h-3 w-3" /> Quente ({score})</Badge>;
    if (score >= 40) return <Badge className="bg-orange-400 hover:bg-orange-500 gap-1 text-xs"><Thermometer className="h-3 w-3" /> Morno ({score})</Badge>;
    return <Badge className="bg-blue-400 hover:bg-blue-500 gap-1 text-xs"><Snowflake className="h-3 w-3" /> Frio ({score})</Badge>;
  };

  const getSourceBadge = (source: string | null) => {
    if (source === 'widget') return <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight px-1.5 py-0 gap-1 border-purple-500/50 text-purple-600"><Globe className="h-2.5 w-2.5" />Site</Badge>;
    if (source === 'prospeccao') return <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight px-1.5 py-0 gap-1 border-blue-500/50 text-blue-600"><Building2 className="h-2.5 w-2.5" />Prospecção</Badge>;
    return <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight px-1.5 py-0 gap-1 border-green-500/50 text-green-600"><Smartphone className="h-2.5 w-2.5" />WhatsApp</Badge>;
  };

  const getUrgencyIndicator = (urgency: string | null) => {
    const config: Record<string, string> = { 'imediata': '🚨', 'alta': '⚡', 'média': '⏳', 'baixa': '' };
    return config[urgency || 'baixa'] || '';
  };

  if (!user && !crm.leadsLoading) return null;

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6">
        <div className="relative w-full h-32 sm:h-40 md:h-48 rounded-xl overflow-hidden mb-4">
          <img src="/clonefy-office.jpg" alt="Escritório Clonefy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
            <div className="p-4 sm:p-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">CRM Leads</h1>
              <p className="text-white/80 text-sm sm:text-base">Gestão inteligente de contatos com análise detalhada via IA</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SidebarTrigger />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Seus Leads
                  <Badge variant="secondary" className="ml-2">{crm.filteredLeads.length}</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* View toggle */}
                  <div className="flex border rounded-md">
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="h-8 gap-1 rounded-r-none" onClick={() => setViewMode('list')}>
                      <LayoutList className="h-3.5 w-3.5" /> Lista
                    </Button>
                    <Button variant={viewMode === 'kanban' ? 'default' : 'ghost'} size="sm" className="h-8 gap-1 rounded-l-none" onClick={() => setViewMode('kanban')}>
                      <Kanban className="h-3.5 w-3.5" /> Kanban
                    </Button>
                  </div>

                  {viewMode === 'kanban' && (
                    <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setShowPipelineSettings(true)}>
                      <Settings2 className="h-3.5 w-3.5" /> Pipeline
                    </Button>
                  )}

                  <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setCleanupOpen(true)}>
                    <Eraser className="h-3.5 w-3.5" /> Limpar antigos
                  </Button>

                  <Button size="sm" className="h-8 gap-1" onClick={() => setShowNewLeadForm(true)}>
                    <Plus className="h-3.5 w-3.5" /> Novo Lead
                  </Button>
                </div>
              </div>

              {/* Search + filter toggle */}
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, número, interesse ou tópico..."
                    value={crm.filters.search}
                    onChange={e => crm.setFilters({ ...crm.filters, search: e.target.value })}
                    className="pl-9 bg-background/50"
                  />
                </div>
                <Button variant={showFilters ? 'default' : 'outline'} size="sm" className="h-9" onClick={() => setShowFilters(!showFilters)}>
                  Filtros
                </Button>
              </div>

              {showFilters && (
                <LeadFilters
                  filters={crm.filters}
                  onChange={crm.setFilters}
                  onReset={crm.resetFilters}
                  pipelineStages={crm.pipelineStages}
                  allTags={crm.allTags}
                />
              )}

              {viewMode === 'list' && selectedCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border bg-primary/5 px-3 py-2 text-sm">
                  <span>
                    <strong>{selectedCount}</strong> selecionado(s)
                    {callableFilteredLeads.length > 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({callableFilteredLeads.length} com telefone na lista)
                      </span>
                    )}
                  </span>
                  <Button size="sm" className="h-8 gap-1 ml-auto" onClick={handleOpenOutreach}>
                    <MessageCircle className="h-3.5 w-3.5" />
                    Disparar WhatsApp ({selectedCount})
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={clearSelection}>
                    Limpar
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {crm.leadsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground text-sm font-medium animate-pulse">Processando inteligência de leads...</p>
              </div>
            ) : crm.filteredLeads.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 grayscale opacity-50">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Nenhum lead encontrado</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  Os leads aparecerão aqui automaticamente via IA, ou crie um manualmente.
                </p>
                <Button className="mt-4 gap-2" onClick={() => setShowNewLeadForm(true)}>
                  <Plus className="h-4 w-4" /> Criar Lead Manual
                </Button>
              </div>
            ) : viewMode === 'kanban' ? (
              <div className="p-4">
                <LeadKanban
                  leads={crm.filteredLeads}
                  stages={crm.pipelineStages}
                  onMoveLead={(leadId, stage) => crm.moveLeadToPipelineStage.mutate({ leadId, stage })}
                  onLeadClick={handleLeadClick}
                />
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-b text-sm">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={toggleSelectAllFiltered}
                    aria-label="Selecionar todos com telefone"
                  />
                  <span className="text-muted-foreground">
                    Selecionar todos com telefone ({callableFilteredLeads.length})
                  </span>
                </div>
                {crm.filteredLeads.map(lead => {
                  const callable = callableIdSet.has(lead.id);
                  return (
                  <div
                    key={lead.id}
                    className="p-4 hover:bg-muted/30 transition-colors group relative overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4 relative z-10">
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Checkbox
                          checked={selectedIds.has(lead.id)}
                          disabled={!callable}
                          onCheckedChange={checked => toggleLeadSelection(lead.id, !!checked)}
                          aria-label={`Selecionar ${lead.name || 'lead'}`}
                        />
                        <button
                          type="button"
                          className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-sm group-hover:scale-105 transition-transform duration-300"
                          onClick={() => handleLeadClick(lead)}
                        >
                          <span className="text-primary font-bold text-lg">{lead.name ? lead.name[0].toUpperCase() : '#'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        className="flex-1 space-y-1.5 text-left min-w-0"
                        onClick={() => handleLeadClick(lead)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-foreground">
                            {getUrgencyIndicator(lead.urgency_level)} {lead.name || 'Desconhecido'}
                          </h4>
                          {getScoreBadge(lead.lead_score)}
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight px-1.5 py-0">{lead.status}</Badge>
                          {getSourceBadge(lead.source)}
                          {lead.pipeline_stage && lead.pipeline_stage !== 'novo' && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{lead.pipeline_stage}</Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{lead.whatsapp_number}</div>
                          {lead.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{lead.email}</div>}
                          {lead.company && <div className="flex items-center gap-1.5">🏢 {lead.company}</div>}
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(lead.last_interaction).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <div className="space-y-1">
                          {lead.intent_summary && <p className="text-xs text-muted-foreground/80 line-clamp-1 italic max-w-2xl">"{lead.intent_summary}"</p>}
                          {lead.next_action && <p className="text-xs text-green-600 flex items-center gap-1"><ArrowRight className="h-3 w-3" /><span className="line-clamp-1">{lead.next_action}</span></p>}
                        </div>

                        {/* Tags + Topics */}
                        {((lead.tags && lead.tags.length > 0) || (lead.key_topics && lead.key_topics.length > 0)) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lead.tags?.slice(0, 3).map((tag, i) => <Badge key={`t-${i}`} variant="default" className="text-[10px] px-1.5 py-0">{tag}</Badge>)}
                            {lead.key_topics?.slice(0, 3).map((topic, i) => <Badge key={`k-${i}`} variant="secondary" className="text-[10px] px-1.5 py-0">{topic}</Badge>)}
                          </div>
                        )}
                      </button>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!callable && (
                          <Badge variant="outline" className="text-[10px]">Sem WhatsApp</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-2 bg-background/50"
                          onClick={() => handleLeadClick(lead)}
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Ver Detalhes
                        </Button>
                      </div>
                    </div>
                    <div className="absolute left-0 bottom-0 top-0 w-1 bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drawer */}
      <LeadDetailsDrawer
        lead={selectedLead}
        open={isDrawerOpen}
        onOpenChange={open => {
          setIsDrawerOpen(open);
          if (!open) crm.openLeadNotes(null);
        }}
        pipelineStages={crm.pipelineStages}
        allTags={crm.allTags}
        notes={selectedLead ? crm.getNotesForLead(selectedLead.id) : []}
        onUpdateLead={data => { crm.updateLead.mutate(data as any); setSelectedLead(prev => prev ? { ...prev, ...data } : null); }}
        onDeleteLead={id => { crm.deleteLead.mutate(id); setIsDrawerOpen(false); }}
        onAddNote={content => selectedLead && crm.addNote.mutate({ leadId: selectedLead.id, content })}
        onUpdateNote={(id, content) => crm.updateNote.mutate({ id, content })}
        onDeleteNote={id => crm.deleteNote.mutate(id)}
        isUpdating={crm.updateLead.isPending}
      />

      {/* New Lead Form */}
      <LeadForm
        open={showNewLeadForm}
        onOpenChange={setShowNewLeadForm}
        pipelineStages={crm.pipelineStages}
        allTags={crm.allTags}
        isLoading={crm.createLead.isPending}
        onSubmit={data => { crm.createLead.mutate(data); setShowNewLeadForm(false); }}
      />

      {/* Pipeline Settings */}
      <PipelineSettings
        open={showPipelineSettings}
        onOpenChange={setShowPipelineSettings}
        stages={crm.pipelineStages}
        onCreateStage={s => crm.createStage.mutate(s)}
        onUpdateStage={s => crm.updateStage.mutate(s as any)}
        onDeleteStage={id => crm.deleteStage.mutate(id)}
      />

      <ProspectOutreachModal
        open={outreachOpen}
        onOpenChange={open => {
          setOutreachOpen(open);
          if (!open) clearSelection();
        }}
        companies={outreachCompanies}
        showImportToCrmOption={false}
        defaultImportToCrm={false}
        dialogTitle="Disparar WhatsApp — CRM"
        getCampaignStatus={getOutreachCampaignStatus}
        onStart={async params => {
          const result = await startOutreachCampaign({
            companies: outreachCompanies,
            messageTemplate: params.messageTemplate,
            whatsappInstance: params.whatsappInstance,
            delaySeconds: params.delaySeconds,
            importToCrm: false,
            campaignName: 'CRM WhatsApp',
            searchContext: { source: 'crm', count: outreachCompanies.length },
          });
          return result;
        }}
      />
    </main>
  );
};

export default CRMLeads;

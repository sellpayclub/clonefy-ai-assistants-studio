import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Plus, MessageSquare, Phone, Mail, Calendar, Globe, Smartphone, Flame, Thermometer, Snowflake, ArrowRight, LayoutList, Kanban, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LeadDetailsDrawer } from "@/components/crm/LeadDetailsDrawer";
import { LeadForm } from "@/components/crm/LeadForm";
import { LeadFilters } from "@/components/crm/LeadFilters";
import { LeadKanban } from "@/components/crm/LeadKanban";
import { PipelineSettings } from "@/components/crm/PipelineSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useCRMLeads, type Lead } from "@/hooks/useCRMLeads";

const CRMLeads = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const crm = useCRMLeads();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showPipelineSettings, setShowPipelineSettings] = useState(false);

  // Load Converteai SDK only on this page
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js";
    s.async = true;
    s.id = "converteai-sdk";
    if (!document.getElementById("converteai-sdk")) {
      document.head.appendChild(s);
    }
    return () => {
      document.getElementById("converteai-sdk")?.remove();
    };
  }, []);

  // Init default stages if none exist
  useEffect(() => {
    if (!crm.stagesLoading && crm.pipelineStages.length === 0 && user?.id) {
      crm.initDefaultStages.mutate();
    }
  }, [crm.stagesLoading, crm.pipelineStages.length, user?.id]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-red-500 hover:bg-red-600 gap-1 text-xs"><Flame className="h-3 w-3" /> Quente ({score})</Badge>;
    if (score >= 40) return <Badge className="bg-orange-400 hover:bg-orange-500 gap-1 text-xs"><Thermometer className="h-3 w-3" /> Morno ({score})</Badge>;
    return <Badge className="bg-blue-400 hover:bg-blue-500 gap-1 text-xs"><Snowflake className="h-3 w-3" /> Frio ({score})</Badge>;
  };

  const getSourceBadge = (source: string | null) => {
    if (source === 'widget') return <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight px-1.5 py-0 gap-1 border-purple-500/50 text-purple-600"><Globe className="h-2.5 w-2.5" />Site</Badge>;
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

        {/* Video de apresentação do CRM */}
        <div className="rounded-xl overflow-hidden border border-border/50 shadow-md bg-card/50 backdrop-blur-sm mb-2">
          <div className="p-3 sm:p-4 border-b border-border/40">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">🎬 Veja o CRM por dentro</h2>
          </div>
          <div id="ifr_69ab17dc715cadaa9a5a0577_wrapper" style={{ margin: '0 auto', width: '100%' }}>
            <div style={{ position: 'relative', paddingTop: '60.416666666666664%' }} id="ifr_69ab17dc715cadaa9a5a0577_aspect">
              <iframe
                frameBorder={0}
                allowFullScreen
                src="about:blank"
                id="ifr_69ab17dc715cadaa9a5a0577"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                referrerPolicy="origin"
                onLoad={(e) => {
                  const el = e.currentTarget;
                  el.onload = null;
                  el.src = 'https://scripts.converteai.net/ceaefeeb-feef-4b52-8911-9ec9de0d5b6b/players/69ab17dc715cadaa9a5a0577/v4/embed.html'
                    + (location.search || '?')
                    + '&vl=' + encodeURIComponent(location.href);
                }}
              />
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
                {crm.filteredLeads.map(lead => (
                  <div
                    key={lead.id}
                    className="p-4 hover:bg-muted/30 transition-colors group relative overflow-hidden cursor-pointer"
                    onClick={() => handleLeadClick(lead)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleLeadClick(lead)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4 relative z-10">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-sm group-hover:scale-105 transition-transform duration-300">
                        <span className="text-primary font-bold text-lg">{lead.name ? lead.name[0].toUpperCase() : '#'}</span>
                      </div>

                      <div className="flex-1 space-y-1.5">
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
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                        <Button variant="outline" size="sm" className="h-8 gap-2 bg-background/50">
                          <MessageSquare className="h-3.5 w-3.5" /> Ver Detalhes
                        </Button>
                      </div>
                    </div>
                    <div className="absolute left-0 bottom-0 top-0 w-1 bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drawer */}
      <LeadDetailsDrawer
        lead={selectedLead}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        pipelineStages={crm.pipelineStages}
        allTags={crm.allTags}
        notes={selectedLead ? crm.getNotesForLead(selectedLead.id) : []}
        onUpdateLead={data => { crm.updateLead.mutate(data as any); setSelectedLead(prev => prev ? { ...prev, ...data } : null); }}
        onDeleteLead={id => { crm.deleteLead.mutate(id); setIsDrawerOpen(false); }}
        onAddNote={content => selectedLead && crm.addNote.mutate({ leadId: selectedLead.id, content })}
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
    </main>
  );
};

export default CRMLeads;

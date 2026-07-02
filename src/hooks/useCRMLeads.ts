import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Lead {
  id: string;
  name: string | null;
  whatsapp_number: string;
  email: string | null;
  lead_score: number;
  status: string;
  intent_summary: string | null;
  source: 'whatsapp' | 'widget' | 'prospeccao' | null;
  last_interaction: string;
  created_at: string;
  updated_at: string | null;
  tags: string[] | null;
  // AI fields (read-only, filled by edge functions)
  conversation_analysis?: string | null;
  key_topics?: string[] | null;
  customer_questions?: string[] | null;
  objections?: string[] | null;
  products_mentioned?: string[] | null;
  urgency_level?: string | null;
  next_action?: string | null;
  sentiment?: string | null;
  assistant_id?: string | null;
  // New fields (user-editable)
  company?: string | null;
  position?: string | null;
  address?: string | null;
  cpf_cnpj?: string | null;
  pipeline_stage?: string | null;
  custom_fields?: Record<string, any> | null;
}

export interface PipelineStage {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  user_id: string;
  content: string;
  created_by: string;
  created_at: string;
}

export interface LeadFilters {
  search: string;
  pipelineStage: string | null;
  scoreRange: 'all' | 'hot' | 'warm' | 'cold';
  source: string | null;
  tags: string[];
  urgency: string | null;
}

const DEFAULT_FILTERS: LeadFilters = {
  search: '',
  pipelineStage: null,
  scoreRange: 'all',
  source: null,
  tags: [],
  urgency: null,
};

/** Colunas leves para a lista — evita carregar textos enormes de análise IA. */
const LEAD_LIST_SELECT =
  'id,name,whatsapp_number,email,lead_score,status,intent_summary,source,last_interaction,created_at,updated_at,tags,key_topics,urgency_level,next_action,company,pipeline_stage,custom_fields,cpf_cnpj,address';

const MAX_LEADS_FETCH = 2000;

export function useCRMLeads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LeadFilters>(DEFAULT_FILTERS);

  // Fetch leads
  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['crm-leads', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from('crm_leads')
        .select(LEAD_LIST_SELECT)
        .eq('user_id', user.id)
        .order('last_interaction', { ascending: false })
        .limit(MAX_LEADS_FETCH);
      if (error) throw error;
      return (data || []) as Lead[];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Fetch pipeline stages
  const { data: pipelineStages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['crm-pipeline-stages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from('crm_pipeline_stages')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as PipelineStage[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Initialize default stages if none exist
  const initDefaultStages = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');
      const defaults = [
        { name: 'Novo', color: '#6366f1', sort_order: 0 },
        { name: 'Contato Feito', color: '#3b82f6', sort_order: 1 },
        { name: 'Qualificado', color: '#f59e0b', sort_order: 2 },
        { name: 'Proposta', color: '#10b981', sort_order: 3 },
        { name: 'Negociação', color: '#f97316', sort_order: 4 },
        { name: 'Fechado', color: '#22c55e', sort_order: 5 },
        { name: 'Perdido', color: '#ef4444', sort_order: 6 },
      ];
      const { error } = await (supabase as any)
        .from('crm_pipeline_stages')
        .insert(defaults.map(s => ({ ...s, user_id: user.id })));
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-pipeline-stages'] });
    },
  });

  // Create lead
  const createLead = useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      if (!user?.id) throw new Error('No user');
      const { data, error } = await (supabase as any)
        .from('crm_leads')
        .insert({ ...lead, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      toast({ title: 'Lead criado com sucesso!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao criar lead', description: err.message, variant: 'destructive' });
    },
  });

  // Update lead
  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('crm_leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      toast({ title: 'Lead atualizado!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao atualizar lead', description: err.message, variant: 'destructive' });
    },
  });

  // Delete lead
  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('crm_leads')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      toast({ title: 'Lead excluído!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao excluir lead', description: err.message, variant: 'destructive' });
    },
  });

  // Apagar vários leads selecionados de uma vez
  const deleteLeadsBulk = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!ids.length) return 0;
      const { data, error } = await (supabase as any).rpc('delete_crm_leads_bulk', {
        p_ids: ids,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      toast({ title: `${count} lead(s) excluído(s)!` });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao excluir leads', description: err.message, variant: 'destructive' });
    },
  });

  // Limpar leads antigos (mais antigos que X dias)
  const cleanupOldLeads = useMutation({
    mutationFn: async (days: number) => {
      const { data, error } = await (supabase as any).rpc('cleanup_crm_leads_old', {
        p_days: days,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      toast({ title: `${count} lead(s) antigo(s) removido(s)!` });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao limpar leads', description: err.message, variant: 'destructive' });
    },
  });
  const moveLeadToPipelineStage = useMutation({
    mutationFn: async ({ leadId, stage }: { leadId: string; stage: string }) => {
      const { error } = await (supabase as any)
        .from('crm_leads')
        .update({ pipeline_stage: stage, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });

  // Pipeline stage CRUD
  const createStage = useMutation({
    mutationFn: async (stage: Partial<PipelineStage>) => {
      if (!user?.id) throw new Error('No user');
      const { error } = await (supabase as any)
        .from('crm_pipeline_stages')
        .insert({ ...stage, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-pipeline-stages'] }),
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PipelineStage> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('crm_pipeline_stages')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-pipeline-stages'] }),
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('crm_pipeline_stages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-pipeline-stages'] }),
  });

  // Notes — carregadas só quando o drawer abre (via useLeadNotes)
  const [notesLeadId, setNotesLeadId] = useState<string | null>(null);

  const { data: leadNotes = [] } = useQuery({
    queryKey: ['crm-lead-notes', user?.id, notesLeadId],
    queryFn: async () => {
      if (!user?.id || !notesLeadId) return [];
      const { data, error } = await (supabase as any)
        .from('crm_lead_notes')
        .select('id,lead_id,user_id,content,created_by,created_at')
        .eq('user_id', user.id)
        .eq('lead_id', notesLeadId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as LeadNote[];
    },
    enabled: !!user?.id && !!notesLeadId,
    staleTime: 30 * 1000,
  });

  const addNote = useMutation({
    mutationFn: async ({ leadId, content, createdBy = 'user' }: { leadId: string; content: string; createdBy?: string }) => {
      if (!user?.id) throw new Error('No user');
      const { error } = await (supabase as any)
        .from('crm_lead_notes')
        .insert({ lead_id: leadId, user_id: user.id, content, created_by: createdBy });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-lead-notes', user?.id, notesLeadId] });
      toast({ title: 'Nota adicionada!' });
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await (supabase as any)
        .from('crm_lead_notes')
        .update({ content })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-lead-notes', user?.id, notesLeadId] });
      toast({ title: 'Nota atualizada!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao atualizar nota', description: err.message, variant: 'destructive' });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('crm_lead_notes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-lead-notes', user?.id, notesLeadId] });
      toast({ title: 'Nota excluída!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao excluir nota', description: err.message, variant: 'destructive' });
    },
  });

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const match =
          lead.name?.toLowerCase().includes(s) ||
          lead.whatsapp_number?.includes(s) ||
          lead.email?.toLowerCase().includes(s) ||
          lead.company?.toLowerCase().includes(s) ||
          lead.intent_summary?.toLowerCase().includes(s) ||
          lead.key_topics?.some(t => t.toLowerCase().includes(s)) ||
          lead.tags?.some(t => t.toLowerCase().includes(s));
        if (!match) return false;
      }
      // Pipeline stage
      if (filters.pipelineStage && (lead.pipeline_stage || 'novo') !== filters.pipelineStage) return false;
      // Score range
      if (filters.scoreRange === 'hot' && (lead.lead_score || 0) < 80) return false;
      if (filters.scoreRange === 'warm' && ((lead.lead_score || 0) < 40 || (lead.lead_score || 0) >= 80)) return false;
      if (filters.scoreRange === 'cold' && (lead.lead_score || 0) >= 40) return false;
      // Source
      if (filters.source && lead.source !== filters.source) return false;
      // Tags
      if (filters.tags.length > 0 && !filters.tags.some(t => lead.tags?.includes(t))) return false;
      // Urgency
      if (filters.urgency && lead.urgency_level !== filters.urgency) return false;
      return true;
    });
  }, [leads, filters]);

  // All tags across leads
  const allTags = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => l.tags?.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [leads]);

  const getNotesForLead = useCallback((leadId: string) => {
    if (notesLeadId !== leadId) return [];
    return leadNotes;
  }, [notesLeadId, leadNotes]);

  const openLeadNotes = useCallback((leadId: string | null) => {
    setNotesLeadId(leadId);
  }, []);

  return {
    leads,
    filteredLeads,
    leadsLoading,
    filters,
    setFilters,
    resetFilters: () => setFilters(DEFAULT_FILTERS),
    allTags,
    // Pipeline
    pipelineStages,
    stagesLoading,
    initDefaultStages,
    createStage,
    updateStage,
    deleteStage,
    moveLeadToPipelineStage,
    // CRUD
    createLead,
    updateLead,
    deleteLead,
    refetchLeads,
    // Notes
    openLeadNotes,
    getNotesForLead,
    addNote,
    updateNote,
    deleteNote,
  };
}

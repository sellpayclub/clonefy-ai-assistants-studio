import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  buildApiKeyHeaders,
  getStoredApiKeys,
  saveApiKeys,
  type ProspeccaoApiKeys,
} from '@/lib/prospeccao/api-keys';
import {
  DEFAULT_LEAD_LIMIT,
  MAX_LEAD_LIMIT,
} from '@/lib/prospeccao/constants';
import { callOutreachFunction } from '@/lib/outreach/call-outreach';
import type {
  FetchAllPagesResult,
  ImportLeadsResult,
  LastSearchParams,
  OutreachCampaignStatus,
  ProspectCompany,
  ProspectSearchResult,
  SelectionMode,
} from '@/lib/prospeccao/constants';

interface Municipio {
  id: string;
  nome: string;
}

interface Estado {
  sigla: string;
  nome: string;
  id: number;
}

export interface ProspectConfig {
  provider: string | null;
  dataSource: 'cnpj' | null;
  hasGeckoApi: boolean;
  configured: boolean;
}

export interface SearchParams {
  ramo: string;
  uf: string;
  municipioCodigo: string;
  municipioNome: string;
  page?: number;
  limit?: number;
  maxLeads?: number;
  contemCelular?: boolean;
  contemEmail?: boolean;
}

const USE_LOCAL_PROSPECT =
  import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_PROSPECT_API === 'true';

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

async function callProspectFunction<T>(
  body: Record<string, unknown>,
  apiKeys?: ProspeccaoApiKeys,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sessão expirada. Faça login novamente.');

  const keys = apiKeys || getStoredApiKeys();
  const apiKeyHeaders = buildApiKeyHeaders(keys);
  const authHeaders = {
    Authorization: `Bearer ${session.access_token}`,
    ...apiKeyHeaders,
  };

  if (USE_LOCAL_PROSPECT) {
    const response = await fetch('/api/prospect-companies', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro na API local');
    if (data.error) throw new Error(data.error);
    return data as T;
  }

  const response = await supabase.functions.invoke('prospect-companies', {
    body,
    headers: authHeaders,
  });

  if (response.error) {
    // supabase.functions.invoke devolve uma mensagem genérica ("non-2xx status code")
    // quando a função retorna erro. A mensagem real fica no corpo (error.context).
    let message = response.error.message || 'Erro na busca';
    const ctx = (response.error as unknown as { context?: Response }).context;
    if (ctx && typeof ctx.text === 'function') {
      try {
        const raw = await ctx.text();
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.error) message = parsed.error;
          } catch {
            message = raw;
          }
        }
      } catch {
        /* mantém a mensagem padrão */
      }
    }
    throw new Error(message);
  }
  if (response.data?.error) throw new Error(response.data.error);
  return response.data as T;

}

async function importLeadsClient(
  userId: string,
  companies: ProspectCompany[],
  meta: { ramo: string; cidade: string },
): Promise<ImportLeadsResult> {
  const { data: existingLeads } = await (supabase as any)
    .from('crm_leads')
    .select('cpf_cnpj, whatsapp_number')
    .eq('user_id', userId);

  const existingCnpjs = new Set(
    (existingLeads || [])
      .map((l: any) => l.cpf_cnpj?.replace(/\D/g, ''))
      .filter(Boolean),
  );
  const existingPhones = new Set(
    (existingLeads || [])
      .map((l: any) => l.whatsapp_number?.replace(/\D/g, ''))
      .filter(Boolean),
  );

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const company of companies) {
    const cleanCnpj = company.cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      skipped++;
      continue;
    }

    if (existingCnpjs.has(cleanCnpj)) {
      skipped++;
      continue;
    }

    const whatsappNumber = company.telefone
      ? company.telefone.replace(/\D/g, '')
      : `prospeccao_${cleanCnpj}`;

    if (existingPhones.has(whatsappNumber)) {
      skipped++;
      continue;
    }

    const tagSlug = `${meta.ramo}-${meta.cidade}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { error } = await (supabase as any).from('crm_leads').insert({
      user_id: userId,
      name: company.nomeFantasia || company.razaoSocial || 'Empresa',
      company: company.razaoSocial,
      whatsapp_number: whatsappNumber,
      email: company.email,
      cpf_cnpj: formatCnpj(cleanCnpj),
      address: company.endereco,
      source: 'prospeccao',
      pipeline_stage: 'novo',
      lead_score: company.hasPhone ? 30 : 10,
      status: 'aberto',
      intent_summary: company.cnaeDescricao
        ? `Prospecção CNPJ: ${company.cnaeDescricao}`
        : 'Lead prospectado por CNPJ (Receita Federal)',
      tags: ['prospeccao', 'cnpj', tagSlug].filter(Boolean),
      last_interaction: new Date().toISOString(),
      custom_fields: {
        socio_principal: company.socioPrincipal,
        cnae: company.cnae,
        cidade: company.cidade,
        uf: company.uf,
        enriched: company.enriched || false,
        data_source: 'cnpj',
      },
    });

    if (error) {
      if (error.message.includes('duplicate') || error.code === '23505') skipped++;
      else errors.push(`${company.cnpj}: ${error.message}`);
    } else {
      imported++;
      existingCnpjs.add(cleanCnpj);
      existingPhones.add(whatsappNumber);
    }
  }

  return { imported, skipped, errors };
}

export function useProspeccao() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectionMode, setSelectionMode] = useState<SelectionMode>('none');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [companyCache, setCompanyCache] = useState<Map<string, ProspectCompany>>(new Map());
  const [searchContext, setSearchContext] = useState<LastSearchParams | null>(null);
  const [apiKeys, setApiKeysState] = useState<ProspeccaoApiKeys>(() => getStoredApiKeys());

  const saveApiKeysState = useCallback((keys: ProspeccaoApiKeys) => {
    saveApiKeys(keys);
    setApiKeysState(keys);
    queryClient.invalidateQueries({ queryKey: ['prospeccao-config'] });
  }, [queryClient]);

  const resetSelection = useCallback(() => {
    setSelectionMode('none');
    setSelectedIds(new Set());
    setExcludedIds(new Set());
    setCompanyCache(new Map());
    setSearchContext(null);
  }, []);

  const mergeIntoCache = useCallback((companies: ProspectCompany[]) => {
    setCompanyCache(prev => {
      const next = new Map(prev);
      for (const c of companies) next.set(c.cnpj, c);
      return next;
    });
  }, []);

  const updateSearchContext = useCallback((params: SearchParams, result: ProspectSearchResult) => {
    const maxLeads = params.maxLeads ?? DEFAULT_LEAD_LIMIT;
    setSearchContext({
      ramo: params.ramo,
      uf: params.uf,
      municipioCodigo: params.municipioCodigo,
      municipioNome: params.municipioNome,
      contemCelular: params.contemCelular !== false,
      contemEmail: !!params.contemEmail,
      maxLeads,
      total: result.total,
      totalPages: result.totalPages,
      provider: result.provider,
    });
  }, []);

  const configQuery = useQuery({
    queryKey: ['prospeccao-config', USE_LOCAL_PROSPECT, apiKeys],
    queryFn: () => callProspectFunction<ProspectConfig>({ action: 'get_config' }, apiKeys),
    staleTime: 30 * 1000,
  });

  const estadosQuery = useQuery({
    queryKey: ['prospeccao-estados', USE_LOCAL_PROSPECT],
    queryFn: async () => {
      const data = await callProspectFunction<{ estados: Estado[] }>({ action: 'list_estados' }, apiKeys);
      return data.estados;
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  const searchMutation = useMutation({
    mutationFn: (params: SearchParams) =>
      callProspectFunction<ProspectSearchResult>(
        { action: 'search', ...params },
        apiKeys,
      ),
  });

  const fetchAllPagesMutation = useMutation({
    mutationFn: (params: Omit<SearchParams, 'page' | 'limit'> & { excludedCnpjs?: string[]; maxResults?: number }) =>
      callProspectFunction<FetchAllPagesResult>(
        {
          action: 'fetch_all_pages',
          ...params,
          excludedCnpjs: params.excludedCnpjs,
          maxResults: params.maxResults ?? MAX_LEAD_LIMIT,
        },
        apiKeys,
      ),
  });

  const importMutation = useMutation({
    mutationFn: async (params: {
      companies: ProspectCompany[];
      ramo: string;
      cidade: string;
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const result = await importLeadsClient(user.id, params.companies, {
        ramo: params.ramo,
        cidade: params.cidade,
      });
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      return result;
    },
  });

  const enrichMutation = useMutation({
    mutationFn: (cnpj: string) =>
      callProspectFunction<{ enrichment: Partial<ProspectCompany> }>(
        { action: 'enrich_cnpj', cnpj },
        apiKeys,
      ),
  });

  const startOutreachMutation = useMutation({
    mutationFn: (params: {
      companies: ProspectCompany[];
      messageTemplate: string;
      whatsappInstance: string;
      delaySeconds: number;
      importToCrm: boolean;
      campaignName?: string;
      searchContext?: LastSearchParams | null;
    }) =>
      callOutreachFunction<{
        campaignId: string;
        queued: number;
        skipped: number;
        estimatedMinutes: number;
      }>({
        action: 'start_campaign',
        companies: params.companies,
        message_template: params.messageTemplate,
        whatsapp_instance: params.whatsappInstance,
        delay_seconds: params.delaySeconds,
        import_to_crm: params.importToCrm,
        campaign_name: params.campaignName,
        search_context: params.searchContext,
      }),
  });

  const fetchMunicipios = useCallback(async (uf: string): Promise<Municipio[]> => {
    const data = await callProspectFunction<{ municipios: Municipio[] }>(
      { action: 'list_municipios', uf },
      apiKeys,
    );
    return data.municipios;
  }, [apiKeys]);

  const isCompanySelected = useCallback(
    (cnpj: string) => {
      if (selectionMode === 'all') return !excludedIds.has(cnpj);
      if (selectionMode === 'page') return selectedIds.has(cnpj);
      return false;
    },
    [selectionMode, selectedIds, excludedIds],
  );

  const effectiveTotal = useMemo(() => {
    if (!searchContext) return 0;
    return Math.min(searchContext.total, searchContext.maxLeads);
  }, [searchContext]);

  const selectedCount = useMemo(() => {
    if (selectionMode === 'all' && searchContext) {
      return Math.max(0, effectiveTotal - excludedIds.size);
    }
    if (selectionMode === 'page') return selectedIds.size;
    return 0;
  }, [selectionMode, searchContext, effectiveTotal, excludedIds.size, selectedIds.size]);

  const isAllPageSelected = useCallback(
    (companies: ProspectCompany[]) =>
      companies.length > 0 && companies.every(c => isCompanySelected(c.cnpj)),
    [isCompanySelected],
  );

  const showSelectAllBanner = useCallback(
    (companies: ProspectCompany[]) => {
      if (!searchContext || effectiveTotal <= companies.length) return false;
      if (selectionMode === 'all') return false;
      return isAllPageSelected(companies);
    },
    [searchContext, effectiveTotal, selectionMode, isAllPageSelected],
  );

  const toggleSelection = useCallback((company: ProspectCompany) => {
    mergeIntoCache([company]);
    const cnpj = company.cnpj;

    if (selectionMode === 'all') {
      setExcludedIds(prev => {
        const next = new Set(prev);
        if (next.has(cnpj)) next.delete(cnpj);
        else next.add(cnpj);
        return next;
      });
      return;
    }

    setSelectionMode('page');
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(cnpj)) next.delete(cnpj);
      else next.add(cnpj);
      return next;
    });
  }, [selectionMode, mergeIntoCache]);

  const toggleSelectAllPage = useCallback((companies: ProspectCompany[]) => {
    mergeIntoCache(companies);
    const pageCnpjs = companies.map(c => c.cnpj);
    const allSelected = companies.every(c => isCompanySelected(c.cnpj));

    if (selectionMode === 'all') {
      setExcludedIds(prev => {
        const next = new Set(prev);
        if (allSelected) {
          for (const cnpj of pageCnpjs) next.add(cnpj);
        } else {
          for (const cnpj of pageCnpjs) next.delete(cnpj);
        }
        return next;
      });
      return;
    }

    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        for (const cnpj of pageCnpjs) next.delete(cnpj);
        if (next.size === 0) {
          setSelectionMode('none');
        }
        return next;
      });
    } else {
      setSelectionMode('page');
      setSelectedIds(prev => {
        const next = new Set(prev);
        for (const cnpj of pageCnpjs) next.add(cnpj);
        return next;
      });
    }
  }, [selectionMode, mergeIntoCache, isCompanySelected]);

  const selectAllAcrossPages = useCallback(() => {
    setSelectionMode('all');
    setExcludedIds(new Set());
    setSelectedIds(new Set());
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionMode('none');
    setSelectedIds(new Set());
    setExcludedIds(new Set());
  }, []);

  const resolveSelectedCompanies = useCallback(async (): Promise<{
    companies: ProspectCompany[];
    truncated: boolean;
  }> => {
    if (selectionMode === 'none' || selectedCount === 0) {
      return { companies: [], truncated: false };
    }

    if (selectionMode === 'all') {
      if (!searchContext) throw new Error('Contexto de busca não encontrado');
      const result = await fetchAllPagesMutation.mutateAsync({
        ramo: searchContext.ramo,
        uf: searchContext.uf,
        municipioCodigo: searchContext.municipioCodigo,
        municipioNome: searchContext.municipioNome,
        contemCelular: searchContext.contemCelular,
        contemEmail: searchContext.contemEmail,
        maxResults: searchContext.maxLeads,
        excludedCnpjs: Array.from(excludedIds),
      });
      return { companies: result.companies, truncated: result.truncated };
    }

    const companies = Array.from(selectedIds)
      .map(cnpj => companyCache.get(cnpj))
      .filter((c): c is ProspectCompany => !!c);
    return { companies, truncated: false };
  }, [
    selectionMode,
    selectedCount,
    searchContext,
    excludedIds,
    selectedIds,
    companyCache,
    fetchAllPagesMutation,
  ]);

  const getCampaignStatus = useCallback(
    (campaignId: string) =>
      callOutreachFunction<OutreachCampaignStatus>({
        action: 'get_campaign_status',
        campaign_id: campaignId,
      }),
    [],
  );

  const processQueueDev = useCallback(
    () => callOutreachFunction<{ processed: number }>({ action: 'process_queue' }),
    [],
  );

  return {
    config: configQuery.data,
    configLoading: configQuery.isLoading,
    isLocalMode: USE_LOCAL_PROSPECT,
    apiKeys,
    saveApiKeys: saveApiKeysState,
    estados: estadosQuery.data || [],
    estadosLoading: estadosQuery.isLoading,
    search: searchMutation,
    fetchAllPages: fetchAllPagesMutation,
    importLeads: importMutation,
    enrich: enrichMutation,
    startOutreach: startOutreachMutation,
    fetchMunicipios,
    selectionMode,
    selectedIds,
    excludedIds,
    searchContext,
    effectiveTotal,
    selectedCount,
    resetSelection,
    mergeIntoCache,
    updateSearchContext,
    isCompanySelected,
    isAllPageSelected,
    showSelectAllBanner,
    toggleSelection,
    toggleSelectAllPage,
    selectAllAcrossPages,
    clearSelection,
    resolveSelectedCompanies,
    getCampaignStatus,
    processQueueDev,
    resolvingSelection: fetchAllPagesMutation.isPending,
  };
}

export function exportCompaniesToCsv(companies: ProspectCompany[], filename = 'prospeccao-cnpj.csv') {
  const headers = [
    'CNPJ',
    'Razão Social',
    'Nome Fantasia',
    'Telefone',
    'E-mail',
    'Sócio',
    'Endereço',
    'Cidade',
    'UF',
    'CNAE',
    'Situação',
  ];

  const rows = companies.map(c => [
    c.cnpj,
    c.razaoSocial,
    c.nomeFantasia,
    c.telefone || '',
    c.email || '',
    c.socioPrincipal || '',
    c.endereco,
    c.cidade,
    c.uf,
    c.cnaeDescricao || c.cnae || '',
    c.situacao,
  ]);

  const escape = (val: string) => `"${String(val).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

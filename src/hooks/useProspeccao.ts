import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  ImportLeadsResult,
  ProspectCompany,
  ProspectSearchResult,
  RamoNegocio,
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

interface ProspectConfig {
  provider: string | null;
  hasGeckoApi: boolean;
  configured: boolean;
}

const USE_LOCAL_PROSPECT =
  import.meta.env.DEV && import.meta.env.VITE_USE_LOCAL_PROSPECT_API === 'true';

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

async function callProspectFunction<T>(body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sessão expirada. Faça login novamente.');

  if (USE_LOCAL_PROSPECT) {
    const response = await fetch('/api/prospect-companies', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro na API local');
    if (data.error) throw new Error(data.error);
    return data as T;
  }

  const response = await supabase.functions.invoke('prospect-companies', {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (response.error) throw new Error(response.error.message);
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
    const isGooglePlace = company.cnpj.startsWith('gplace_');
    const cleanCnpj = isGooglePlace ? '' : company.cnpj.replace(/\D/g, '');

    if (cleanCnpj && existingCnpjs.has(cleanCnpj)) {
      skipped++;
      continue;
    }

    const whatsappNumber = company.telefone
      ? company.telefone.replace(/\D/g, '')
      : isGooglePlace
        ? company.cnpj
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
      cpf_cnpj: cleanCnpj.length === 14 ? formatCnpj(cleanCnpj) : null,
      address: company.endereco,
      source: 'prospeccao',
      pipeline_stage: 'novo',
      lead_score: company.hasPhone ? 30 : 10,
      status: 'aberto',
      intent_summary: company.cnaeDescricao
        ? `Prospecção: ${company.cnaeDescricao}`
        : isGooglePlace
          ? 'Lead prospectado via Google Maps'
          : 'Lead prospectado por CNPJ',
      tags: ['prospeccao', tagSlug].filter(Boolean),
      last_interaction: new Date().toISOString(),
      custom_fields: {
        socio_principal: company.socioPrincipal,
        cnae: company.cnae,
        cidade: company.cidade,
        uf: company.uf,
        enriched: company.enriched || false,
        google_place_id: isGooglePlace ? company.cnpj.replace('gplace_', '') : null,
      },
    });

    if (error) {
      if (error.message.includes('duplicate') || error.code === '23505') skipped++;
      else errors.push(`${company.cnpj}: ${error.message}`);
    } else {
      imported++;
      if (cleanCnpj) existingCnpjs.add(cleanCnpj);
      existingPhones.add(whatsappNumber);
    }
  }

  return { imported, skipped, errors };
}

export function useProspeccao() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const configQuery = useQuery({
    queryKey: ['prospeccao-config', USE_LOCAL_PROSPECT],
    queryFn: () => callProspectFunction<ProspectConfig>({ action: 'get_config' }),
    staleTime: 5 * 60 * 1000,
  });

  const estadosQuery = useQuery({
    queryKey: ['prospeccao-estados', USE_LOCAL_PROSPECT],
    queryFn: async () => {
      const data = await callProspectFunction<{ estados: Estado[] }>({ action: 'list_estados' });
      return data.estados;
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  const searchMutation = useMutation({
    mutationFn: (params: {
      ramo: RamoNegocio;
      uf: string;
      municipioCodigo: string;
      municipioNome: string;
      page?: number;
      limit?: number;
      contemCelular?: boolean;
      contemEmail?: boolean;
    }) =>
      callProspectFunction<ProspectSearchResult>({
        action: 'search',
        ...params,
      }),
    onSuccess: () => setSelectedIds(new Set()),
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
      callProspectFunction<{ enrichment: Partial<ProspectCompany> }>({
        action: 'enrich_cnpj',
        cnpj,
      }),
  });

  const fetchMunicipios = useCallback(async (uf: string): Promise<Municipio[]> => {
    const data = await callProspectFunction<{ municipios: Municipio[] }>({
      action: 'list_municipios',
      uf,
    });
    return data.municipios;
  }, []);

  const toggleSelection = useCallback((cnpj: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(cnpj)) next.delete(cnpj);
      else next.add(cnpj);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((companies: ProspectCompany[]) => {
    setSelectedIds(prev => {
      if (prev.size === companies.length) return new Set();
      return new Set(companies.map(c => c.cnpj));
    });
  }, []);

  const getSelectedCompanies = useCallback(
    (companies: ProspectCompany[]) =>
      companies.filter(c => selectedIds.has(c.cnpj)),
    [selectedIds],
  );

  return {
    config: configQuery.data,
    configLoading: configQuery.isLoading,
    isLocalMode: USE_LOCAL_PROSPECT,
    estados: estadosQuery.data || [],
    estadosLoading: estadosQuery.isLoading,
    search: searchMutation,
    importLeads: importMutation,
    enrich: enrichMutation,
    fetchMunicipios,
    selectedIds,
    setSelectedIds,
    toggleSelection,
    toggleSelectAll,
    getSelectedCompanies,
  };
}

export function exportCompaniesToCsv(companies: ProspectCompany[], filename = 'prospeccao.csv') {
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
    c.cnpj.startsWith('gplace_') ? 'Google Maps' : c.cnpj,
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

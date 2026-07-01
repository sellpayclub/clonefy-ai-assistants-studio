import { useCallback, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

async function callProspectFunction<T>(body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sessão expirada. Faça login novamente.');

  const response = await supabase.functions.invoke('prospect-companies', {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (response.error) throw new Error(response.error.message);
  if (response.data?.error) throw new Error(response.data.error);
  return response.data as T;
}

export function useProspeccao() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const configQuery = useQuery({
    queryKey: ['prospeccao-config'],
    queryFn: () => callProspectFunction<ProspectConfig>({ action: 'get_config' }),
    staleTime: 5 * 60 * 1000,
  });

  const estadosQuery = useQuery({
    queryKey: ['prospeccao-estados'],
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
    mutationFn: (params: {
      companies: ProspectCompany[];
      ramo: string;
      cidade: string;
    }) => callProspectFunction<ImportLeadsResult>({ action: 'import_leads', ...params }),
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

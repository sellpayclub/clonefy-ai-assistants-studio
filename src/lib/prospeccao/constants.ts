export type { RamoNegocio, LeadLimit } from './categories';
export {
  PROSPECT_CATEGORY_GROUPS,
  PROSPECT_CATEGORIES,
  RAMO_OPTIONS,
  RAMO_CNAE_MAP,
  LEAD_LIMIT_OPTIONS,
  DEFAULT_LEAD_LIMIT,
  MAX_LEAD_LIMIT,
  getCategoryByValue,
  getCnaesForCategory,
  isValidCategory,
} from './categories';

export const BRAZILIAN_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export interface ProspectCompany {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  telefone: string | null;
  email: string | null;
  endereco: string;
  cidade: string;
  uf: string;
  socioPrincipal: string | null;
  cnae: string | null;
  cnaeDescricao: string | null;
  situacao: string;
  hasPhone: boolean;
  enriched?: boolean;
  dataSource?: 'cnpj' | 'google_maps';
}

export interface ProspectSearchResult {
  companies: ProspectCompany[];
  page: number;
  total: number;
  totalPages: number;
  provider: string;
  dataSource?: 'cnpj';
}

export interface ImportLeadsResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export type SelectionMode = 'none' | 'page' | 'all';

export interface LastSearchParams {
  ramo: string;
  uf: string;
  municipioCodigo: string;
  municipioNome: string;
  contemCelular: boolean;
  contemEmail: boolean;
  maxLeads: number;
  total: number;
  totalPages: number;
  provider: string;
}

export interface FetchAllPagesResult {
  companies: ProspectCompany[];
  total: number;
  fetched: number;
  truncated: boolean;
  provider: string;
}

export interface OutreachCampaignStatus {
  id: string;
  status: string;
  total_leads: number;
  sent_count: number;
  failed_count: number;
  pending_count: number;
  skipped_count: number;
}

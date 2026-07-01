export type RamoNegocio =
  | 'estetica'
  | 'salao'
  | 'estetica_medica'
  | 'beleza_completo';

export const RAMO_OPTIONS: { value: RamoNegocio; label: string; description: string }[] = [
  {
    value: 'estetica',
    label: 'Clínica de estética',
    description: 'Institutos de beleza, estética facial/corporal',
  },
  {
    value: 'salao',
    label: 'Salão de beleza',
    description: 'Cabeleireiros, manicure, barbearia',
  },
  {
    value: 'estetica_medica',
    label: 'Estética médica',
    description: 'Procedimentos médicos (botox, preenchimento)',
  },
  {
    value: 'beleza_completo',
    label: 'Beleza completo',
    description: 'Estética + salão de beleza',
  },
];

export const RAMO_CNAE_MAP: Record<RamoNegocio, string[]> = {
  estetica: ['9602502'],
  salao: ['9602501'],
  estetica_medica: ['8630503'],
  beleza_completo: ['9602501', '9602502'],
};

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
}

export interface ProspectSearchResult {
  companies: ProspectCompany[];
  page: number;
  total: number;
  totalPages: number;
  provider: string;
}

export interface ImportLeadsResult {
  imported: number;
  skipped: number;
  errors: string[];
}

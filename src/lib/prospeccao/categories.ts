import categoriesData from '../../../supabase/functions/_shared/prospect-categories.json';

export interface ProspectCategory {
  value: string;
  label: string;
  description: string;
  cnaes: string[];
}

export interface ProspectCategoryGroup {
  id: string;
  label: string;
  categories: ProspectCategory[];
}

export type RamoNegocio = string;

export const PROSPECT_CATEGORY_GROUPS: ProspectCategoryGroup[] = categoriesData.groups;

export const PROSPECT_CATEGORIES: ProspectCategory[] = PROSPECT_CATEGORY_GROUPS.flatMap(
  g => g.categories,
);

export const RAMO_OPTIONS = PROSPECT_CATEGORIES.map(c => ({
  value: c.value as RamoNegocio,
  label: c.label,
  description: c.description,
}));

export const RAMO_CNAE_MAP: Record<string, string[]> = Object.fromEntries(
  PROSPECT_CATEGORIES.map(c => [c.value, c.cnaes]),
);

export const LEAD_LIMIT_OPTIONS = [10, 25, 50, 100, 200] as const;
export type LeadLimit = (typeof LEAD_LIMIT_OPTIONS)[number];

export const DEFAULT_LEAD_LIMIT: LeadLimit = 50;
export const MAX_LEAD_LIMIT = 200;

export function getCategoryByValue(value: string): ProspectCategory | undefined {
  return PROSPECT_CATEGORIES.find(c => c.value === value);
}

export function getCnaesForCategory(value: string): string[] | null {
  return RAMO_CNAE_MAP[value] ?? null;
}

export function isValidCategory(value: string): boolean {
  return value in RAMO_CNAE_MAP;
}

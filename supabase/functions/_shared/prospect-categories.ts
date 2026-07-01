import categoriesData from "./prospect-categories.json" with { type: "json" };

export interface ProspectCategory {
  value: string;
  label: string;
  description: string;
  cnaes: string[];
}

export const PROSPECT_CATEGORIES: ProspectCategory[] = categoriesData.groups.flatMap(
  (g: { categories: ProspectCategory[] }) => g.categories,
);

export const RAMO_CNAE_MAP: Record<string, string[]> = Object.fromEntries(
  PROSPECT_CATEGORIES.map((c) => [c.value, c.cnaes]),
);

export function getCnaesForCategory(value: string): string[] | null {
  return RAMO_CNAE_MAP[value] ?? null;
}

export function isValidCategory(value: string): boolean {
  return value in RAMO_CNAE_MAP;
}

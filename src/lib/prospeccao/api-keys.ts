const STORAGE_KEY = 'prospeccao_cnpj_api_keys';

export interface ProspeccaoApiKeys {
  casaDosDados?: string;
  buscaLead?: string;
}

export function getStoredApiKeys(): ProspeccaoApiKeys {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveApiKeys(keys: ProspeccaoApiKeys) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function buildApiKeyHeaders(keys: ProspeccaoApiKeys): Record<string, string> {
  const headers: Record<string, string> = {};
  if (keys.casaDosDados?.trim()) {
    headers['x-casa-dos-dados-api-key'] = keys.casaDosDados.trim();
  }
  if (keys.buscaLead?.trim()) {
    headers['x-buscalead-api-key'] = keys.buscaLead.trim();
  }
  return headers;
}

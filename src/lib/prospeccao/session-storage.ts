import type { ProspectCompany } from '@/lib/prospeccao/constants';

const TTL_MS = 24 * 60 * 60 * 1000;

export interface ProspeccaoSession {
  savedAt: string;
  ramo: string;
  uf: string;
  municipioCodigo: string;
  municipioNome: string;
  maxLeads: number;
  contemCelular: boolean;
  contemEmail: boolean;
  companies: ProspectCompany[];
  searchMeta: { total: number; totalPages: number; provider: string };
  page: number;
}

function storageKey(userId: string) {
  return `prospeccao_session_${userId}`;
}

export function saveProspeccaoSession(userId: string, session: ProspeccaoSession) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(session));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function loadProspeccaoSession(userId: string): ProspeccaoSession | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const session = JSON.parse(raw) as ProspeccaoSession;
    const age = Date.now() - new Date(session.savedAt).getTime();
    if (age > TTL_MS) {
      localStorage.removeItem(storageKey(userId));
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearProspeccaoSession(userId: string) {
  localStorage.removeItem(storageKey(userId));
}

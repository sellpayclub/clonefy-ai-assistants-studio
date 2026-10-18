import { describe, expect, it, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { knowledgeStorageKey, knowledgeStoragePath } from './knowledge-files';

describe('Knowledge storage filenames', () => {
  it('accepts the reported YouTube subtitle filename without invalid storage characters', () => {
    const key = knowledgeStorageKey('139b35c6-af34-4b26-8c58-6020d520c266', '4321c5fb-da33-410c-93f6-0d7a186a21d6', 'COMECE AQUI [Portuguese (auto-generated)] [DownloadYoutubeSubtitles.com].txt');
    expect(key).toMatch(/^[a-zA-Z0-9/._-]+$/);
    expect(key.endsWith('.txt')).toBe(true);
    expect(key.startsWith('139b35c6-af34-4b26-8c58-6020d520c266/4321c5fb-da33-410c-93f6-0d7a186a21d6/')).toBe(true);
  });
  it('preserves extensions while normalizing accents and ensuring unique uploads', () => {
    const key = knowledgeStorageKey('user', 'agent', 'Informações / preços.pdf');
    expect(key).toMatch(/Informacoes-precos.pdf$/);
    expect(key).not.toEqual(knowledgeStorageKey('user', 'agent', 'Informações / preços.pdf'));
  });
  it('deletes the actual timestamped object instead of reconstructing its name', () => {
    expect(knowledgeStoragePath('https://example.com/storage/v1/object/public/assistant-knowledge/u/a/123-file.txt')).toBe('u/a/123-file.txt');
  });
});
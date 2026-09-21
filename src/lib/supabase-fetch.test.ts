import { afterEach, expect, it, vi } from 'vitest';
import { supabaseFetch } from './supabase-fetch';
import { authErrorMessage } from './auth-errors';
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
it('cancels a stalled auth request after 20 seconds', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(options.signal.reason));
  })));
  const request = supabaseFetch('https://example.com/auth/v1/token');
  const assertion = expect(request).rejects.toMatchObject({ name: 'TimeoutError' });
  await vi.advanceTimersByTimeAsync(20_000);
  await assertion;
});
it('preserves the caller cancellation for database reads', async () => {
  const original = new AbortController();
  const mock = vi.fn(async (_url, options) => { expect(options.signal.aborted).toBe(true); return new Response(); });
  vi.stubGlobal('fetch', mock);
  original.abort();
  await supabaseFetch('https://example.com/rest/v1/assistants', { signal: original.signal });
});
it('does not impose the short auth deadline on AI functions', async () => {
  const mock = vi.fn().mockResolvedValue(new Response());
  vi.stubGlobal('fetch', mock);
  await supabaseFetch('https://example.com/functions/v1/chat-proxy');
  expect(mock).toHaveBeenCalledWith('https://example.com/functions/v1/chat-proxy', undefined);
});
it('distinguishes service failures from incorrect credentials', () => {
  expect(authErrorMessage({ status: 504 })).toContain('temporariamente indisponível');
  expect(authErrorMessage({ status: 400, message: 'Invalid login credentials' })).toBe('Invalid login credentials');
});

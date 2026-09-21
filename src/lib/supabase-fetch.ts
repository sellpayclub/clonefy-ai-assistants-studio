// Bound database/auth requests while preserving cancellation from React Query.
// Uploads and AI functions have their own longer execution windows.
export async function supabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (!/^\/(rest|auth)\/v1\//.test(url.pathname)) return fetch(input, init);
  const controller = new AbortController();
  const original = init?.signal ?? (input instanceof Request ? input.signal : undefined);
  const abort = () => controller.abort(original?.reason);
  if (original?.aborted) abort();
  else original?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), 20_000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    original?.removeEventListener('abort', abort);
  }
}

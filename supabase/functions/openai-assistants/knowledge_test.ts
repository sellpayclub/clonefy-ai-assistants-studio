import { assertEquals, assertRejects } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { syncIndexedFiles } from '../_shared/knowledge-index.ts';

Deno.test('waits for all three documents to be indexed before success', async () => {
  let polls = 0;
  const result = await syncIndexedFiles('test', 'vs_test', ['file_a', 'file_b', 'file_c'], {
    wait: async () => {},
    fetcher: (async (_url, init) => {
      if (init?.method === 'POST') return Response.json({ status: 'in_progress' });
      if (String(_url).includes('?limit')) return Response.json({ data: [], has_more: false });
      polls++;
      return Response.json({ status: 'completed' });
    }) as typeof fetch,
  });
  assertEquals(result.added, 3);
  assertEquals(polls, 3);
});
Deno.test('does not report success when OpenAI rejects attachment', async () => {
  await assertRejects(() => syncIndexedFiles('test', 'vs_test', ['file_a'], {
    fetcher: (async (_url, init) => init?.method === 'POST'
      ? Response.json({ error: { message: 'Unsupported file' } }, { status: 400 })
      : Response.json({ data: [], has_more: false })) as typeof fetch,
  }), Error, 'Unsupported file');
});
Deno.test('clears every file including paginated entries when knowledge is empty', async () => {
  const deleted: string[] = [];
  await syncIndexedFiles('test', 'vs_test', [], {
    fetcher: (async (url, init) => {
      if (init?.method === 'DELETE') { deleted.push(String(url).split('/').pop() || ''); return Response.json({ deleted: true }); }
      return String(url).includes('after=')
        ? Response.json({ data: [{ id: 'file_b' }], has_more: false })
        : Response.json({ data: [{ id: 'file_a' }], has_more: true, last_id: 'file_a' });
    }) as typeof fetch,
  });
  assertEquals(deleted, ['file_a', 'file_b']);
});
Deno.test('does not report readiness for incomplete indexing', async () => {
  await assertRejects(() => syncIndexedFiles('test', 'vs_test', ['file_a'], {
    attempts: 1, wait: async () => {},
    fetcher: (async (url) => String(url).includes('?limit')
      ? Response.json({ data: [], has_more: false }) : Response.json({ status: 'in_progress' })) as typeof fetch,
  }), Error, 'ainda em processamento');
});
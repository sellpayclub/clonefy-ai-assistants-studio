export async function syncIndexedFiles(apiKey: string, vectorStoreId: string, fileIds: string[], options: {
  fetcher?: typeof fetch; wait?: () => Promise<void>; attempts?: number;
} = {}): Promise<{ added: number; removed: number }> {
  const fetcher = options.fetcher || fetch;
  const base = `https://api.openai.com/v1/vector_stores/${encodeURIComponent(vectorStoreId)}/files`;
  const request = async (url: string, method = 'GET', body?: unknown) => {
    const response = await fetcher(url, { method, headers: {
      Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `Falha na base de conhecimento: HTTP ${response.status}`);
    return data;
  };
  const existing = new Map<string, Record<string, any>>();
  let after = '';
  do {
    const page = await request(`${base}?limit=100${after ? `&after=${encodeURIComponent(after)}` : ''}`);
    for (const file of page.data || []) existing.set(file.id, file);
    if (!page.has_more) break;
    const next = page.last_id;
    if (typeof next !== 'string' || !next || next === after) throw new Error('Falha ao listar todos os documentos.');
    after = next;
  } while (true);

  let added = 0;
  let removed = 0;
  for (const id of existing.keys()) {
    if (!fileIds.includes(id)) {
      await request(`${base}/${encodeURIComponent(id)}`, 'DELETE');
      removed++;
    }
  }
  for (const id of fileIds) {
    let indexed = existing.get(id);
    if (indexed?.status === 'failed' || indexed?.status === 'cancelled') {
      await request(`${base}/${encodeURIComponent(id)}`, 'DELETE');
      indexed = undefined;
    }
    if (!indexed) {
      indexed = await request(base, 'POST', { file_id: id });
      added++;
    }
    for (let attempt = 0; attempt < (options.attempts ?? 30); attempt++) {
      if (indexed?.status === 'completed') break;
      if (indexed?.status === 'failed' || indexed?.status === 'cancelled') {
        throw new Error(`Não foi possível indexar ${id}: ${indexed.last_error?.message || indexed.status}`);
      }
      await (options.wait ? options.wait() : new Promise(resolve => setTimeout(resolve, 1000)));
      indexed = await request(`${base}/${encodeURIComponent(id)}`);
    }
    if (indexed?.status !== 'completed') throw new Error('Documento enviado, mas ainda em processamento. Use Reprocessar base de conhecimento para concluir.');
  }
  return { added, removed };
}
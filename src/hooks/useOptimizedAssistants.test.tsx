import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { useOptimizedAssistants } from './useOptimizedAssistants';

const db = vi.hoisted(() => ({ read: vi.fn(), filters: [] as unknown[][] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => {
    const query = {
      select: () => query,
      eq: (...args: unknown[]) => { db.filters.push(args); return query; },
      order: () => query,
      abortSignal: () => db.read(),
    };
    return query;
  },
} }));
const session = (id: string) => ({ user: { id }, access_token: 'test' }) as Session;
const agent = { id: 'agent-a', user_id: 'a', name: 'Saved agent' };
function setup(initialSession: Session | null) {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 1, gcTime: 0 } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(({ value }) => useOptimizedAssistants(value), { wrapper, initialProps: { value: initialSession } });
}
afterEach(() => { cleanup(); db.filters = []; });
describe('saved assistants', () => {
  it('loads only active agents of the signed-in customer without an AI function', async () => {
    db.read.mockResolvedValue({ data: [agent], error: null });
    const { result } = setup(session('a'));
    await waitFor(() => expect(result.current.assistants).toEqual([agent]));
    expect(db.filters).toContainEqual(['user_id', 'a']);
    expect(db.filters).toContainEqual(['is_active', true]);
  });
  it('reports an outage instead of presenting a successful empty list', async () => {
    db.read.mockResolvedValue({ data: null, error: { code: 'PGRST002' } });
    const { result } = setup(session('a'));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.loading).toBe(false);
  });
  it('keeps saved data during a failed refresh and recovers on retry', async () => {
    db.read.mockResolvedValue({ data: [agent], error: null });
    const { result } = setup(session('a'));
    await waitFor(() => expect(result.current.assistants).toEqual([agent]));
    db.read.mockResolvedValue({ data: null, error: { code: 'PGRST002' } });
    await act(() => result.current.reloadAssistants());
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.assistants).toEqual([agent]);
    db.read.mockResolvedValue({ data: [{ ...agent, name: 'Updated' }], error: null });
    await act(() => result.current.reloadAssistants());
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(result.current.assistants[0].name).toBe('Updated');
  });
  it('never shows the previous customer agents while another account loads', async () => {
    db.read.mockResolvedValueOnce({ data: [agent], error: null });
    const { result, rerender } = setup(session('a'));
    await waitFor(() => expect(result.current.assistants).toEqual([agent]));
    let resolve!: (value: unknown) => void;
    db.read.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    rerender({ value: session('b') });
    expect(result.current.assistants).toEqual([]);
    await act(async () => resolve({ data: [], error: null }));
    rerender({ value: null });
    expect(result.current.assistants).toEqual([]);
  });
});

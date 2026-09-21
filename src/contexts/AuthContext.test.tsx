import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { AuthProvider, useAuth } from './AuthContext';
const auth = vi.hoisted(() => ({ getSession: vi.fn(), unsubscribe: vi.fn(), listener: null as null | ((event: string, session: Session | null) => void), clear: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: {
  getSession: auth.getSession,
  onAuthStateChange: (callback: typeof auth.listener) => {
    auth.listener = callback;
    return { data: { subscription: { unsubscribe: auth.unsubscribe } } };
  },
} } }));
vi.mock('@/utils/performance', () => ({ performanceCache: { clear: auth.clear } }));
afterEach(cleanup);
it('does not overwrite a fresh login with a late session restoration', async () => {
  let resolve!: (value: unknown) => void;
  auth.getSession.mockImplementation(() => new Promise(r => { resolve = r; }));
  const client = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}><AuthProvider>{children}</AuthProvider></QueryClientProvider>;
  const { result, unmount } = renderHook(useAuth, { wrapper });
  const session = { user: { id: 'customer' } } as Session;
  act(() => auth.listener!('SIGNED_IN', session));
  await act(async () => resolve({ data: { session: null } }));
  expect(result.current.user?.id).toBe('customer');
  client.setQueryData(['private'], ['saved data']);
  act(() => auth.listener!('SIGNED_OUT', null));
  expect(result.current.user).toBeNull();
  expect(client.getQueryData(['private'])).toBeUndefined();
  expect(auth.clear).toHaveBeenCalled();
  unmount();
  expect(auth.unsubscribe).toHaveBeenCalled();
});
it('releases the initial loader when session restoration fails', async () => {
  auth.getSession.mockRejectedValue(new Error('Network unavailable'));
  const client = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}><AuthProvider>{children}</AuthProvider></QueryClientProvider>;
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
});

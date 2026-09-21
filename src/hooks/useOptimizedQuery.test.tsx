import React from 'react';
import { expect, it, vi } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOptimizedQuery } from './useOptimizedQuery';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
it('uses the new query function when customer filters change', async () => {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result, rerender } = renderHook(({ customer }) => useOptimizedQuery({
    queryKey: ['records', customer], queryFn: async () => customer,
  }), { wrapper, initialProps: { customer: 'a' } });
  await waitFor(() => expect(result.current.data).toBe('a'));
  rerender({ customer: 'b' });
  await waitFor(() => expect(result.current.data).toBe('b'));
  cleanup();
  client.clear();
});

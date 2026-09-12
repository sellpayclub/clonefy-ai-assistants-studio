/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SalesMediaUploadType, validateSalesFile } from '@/lib/sales-media';

export type SalesMediaType = SalesMediaUploadType;
export type SalesStepType = SalesMediaType | 'wait' | 'wait_for_reply';

export interface SalesLibrary {
  id: string;
  owner_id: string;
  name: string;
  share_code: string;
  role: 'owner' | 'editor' | 'seller';
}

export interface SalesAsset {
  id: string;
  library_id: string;
  name: string;
  folder: string;
  media_type: SalesMediaType;
  content: string | null;
  storage_path: string | null;
  mime_type: string | null;
  file_name: string | null;
  file_size: number | null;
  caption: string | null;
  is_active: boolean;
}

export interface SalesFunnelStep {
  id: string;
  funnel_id: string;
  position: number;
  step_type: SalesStepType;
  asset_id: string | null;
  content: string | null;
  delay_seconds: number;
}

export interface SalesFunnel {
  id: string;
  library_id: string;
  name: string;
  description: string | null;
  flow_kind: 'automation' | 'quick_reply';
  is_active: boolean;
  sales_funnel_steps: SalesFunnelStep[];
}

const db = supabase as any;

const describeError = (caught: unknown) => {
  const message = caught instanceof Error ? caught.message : String(caught);
  if (/sales_library_members|schema cache|could not find|does not exist/i.test(message)) {
    return 'A estrutura dos funis ainda não foi instalada no Supabase. Aplique a migration 20260912000000_sales_funnels.sql.';
  }
  return message || 'Não foi possível carregar a biblioteca.';
};

export function useSalesLibrary() {
  const { user } = useAuth();
  const [libraries, setLibraries] = useState<SalesLibrary[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [assets, setAssets] = useState<SalesAsset[]>([]);
  const [funnels, setFunnels] = useState<SalesFunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLibraries = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await db
        .from('sales_library_members')
        .select('role, sales_libraries(id, owner_id, name, share_code)')
        .eq('user_id', user.id);

      if (queryError) throw queryError;
      let mapped = (data || []).map((row: any) => ({ ...row.sales_libraries, role: row.role })) as SalesLibrary[];

      if (mapped.length === 0) {
        const { data: created, error: createError } = await db
          .from('sales_libraries')
          .insert({ owner_id: user.id, name: 'Biblioteca comercial' })
          .select('id, owner_id, name, share_code')
          .single();
        if (createError) throw createError;
        mapped = [{ ...created, role: 'owner' }];
      }

      setLibraries(mapped);
      setSelectedLibraryId((current) => current && mapped.some((item) => item.id === current) ? current : mapped[0].id);
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (!selectedLibraryId) return;
    const [assetsResult, funnelsResult] = await Promise.all([
      db.from('sales_media_assets').select('*').eq('library_id', selectedLibraryId).order('folder').order('name'),
      db.from('sales_funnels')
        .select('*, sales_funnel_steps(*)')
        .eq('library_id', selectedLibraryId)
        .order('created_at', { ascending: false }),
    ]);
    if (assetsResult.error) throw assetsResult.error;
    if (funnelsResult.error) throw funnelsResult.error;
    setAssets((assetsResult.data || []) as SalesAsset[]);
    setFunnels((funnelsResult.data || []).map((funnel: any) => ({
      ...funnel,
      sales_funnel_steps: [...(funnel.sales_funnel_steps || [])].sort((a, b) => a.position - b.position),
    })) as SalesFunnel[]);
  }, [selectedLibraryId]);

  useEffect(() => { void loadLibraries(); }, [loadLibraries]);
  useEffect(() => { refresh().catch((caught) => setError(describeError(caught))); }, [refresh]);

  const joinLibrary = async (shareCode: string) => {
    const { error } = await db.rpc('join_sales_library', { _share_code: shareCode });
    if (error) throw error;
    await loadLibraries();
  };

  const createAsset = async (input: {
    name: string;
    folder: string;
    mediaType: SalesMediaType;
    content?: string;
    caption?: string;
    file?: File | null;
  }) => {
    if (!user?.id || !selectedLibraryId) throw new Error('Biblioteca não selecionada');
    let storagePath: string | null = null;
    if (input.mediaType !== 'text') {
      if (!input.file) throw new Error('Selecione um arquivo');
      const validationError = validateSalesFile(input.file, input.mediaType);
      if (validationError) throw new Error(validationError);
      const extension = input.file.name.includes('.') ? input.file.name.split('.').pop() : 'bin';
      storagePath = `${selectedLibraryId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('sales-assets').upload(storagePath, input.file, {
        contentType: input.file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;
    }

    const { error } = await db.from('sales_media_assets').insert({
      library_id: selectedLibraryId,
      created_by: user.id,
      name: input.name,
      folder: input.folder || 'Geral',
      media_type: input.mediaType,
      content: input.mediaType === 'text' ? input.content : null,
      caption: input.caption?.trim() ? input.caption : null,
      storage_path: storagePath,
      mime_type: input.file?.type || null,
      file_name: input.file?.name || null,
      file_size: input.file?.size || null,
    });
    if (error) {
      if (storagePath) await supabase.storage.from('sales-assets').remove([storagePath]);
      throw error;
    }
    await refresh();
  };

  const deleteAsset = async (asset: SalesAsset) => {
    const { error } = await db.from('sales_media_assets').delete().eq('id', asset.id);
    if (error) throw error;
    if (asset.storage_path) await supabase.storage.from('sales-assets').remove([asset.storage_path]);
    await refresh();
  };

  const createFunnel = async (name: string, flowKind: SalesFunnel['flow_kind']) => {
    if (!user?.id || !selectedLibraryId) throw new Error('Biblioteca não selecionada');
    const { data, error } = await db.from('sales_funnels').insert({
      library_id: selectedLibraryId,
      created_by: user.id,
      name,
      flow_kind: flowKind,
    }).select('*').single();
    if (error) throw error;
    await refresh();
    return data.id as string;
  };

  const updateFunnel = async (id: string, values: Partial<Pick<SalesFunnel, 'name' | 'description' | 'flow_kind' | 'is_active'>>) => {
    const { error } = await db.from('sales_funnels').update(values).eq('id', id);
    if (error) throw error;
    await refresh();
  };

  const deleteFunnel = async (id: string) => {
    const { error } = await db.from('sales_funnels').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  };

  const addStep = async (funnel: SalesFunnel, input: Omit<SalesFunnelStep, 'id' | 'funnel_id' | 'position'>) => {
    const { error } = await db.from('sales_funnel_steps').insert({
      funnel_id: funnel.id,
      position: funnel.sales_funnel_steps.length + 1,
      ...input,
    });
    if (error) throw error;
    await refresh();
  };

  const deleteStep = async (funnel: SalesFunnel, step: SalesFunnelStep) => {
    const { error } = await db.from('sales_funnel_steps').delete().eq('id', step.id);
    if (error) throw error;
    const remaining = funnel.sales_funnel_steps.filter((item) => item.id !== step.id);
    for (let index = 0; index < remaining.length; index += 1) {
      await db.from('sales_funnel_steps').update({ position: index + 1 }).eq('id', remaining[index].id);
    }
    await refresh();
  };

  return {
    libraries,
    selectedLibraryId,
    setSelectedLibraryId,
    selectedLibrary: libraries.find((item) => item.id === selectedLibraryId) || null,
    assets,
    funnels,
    loading,
    error,
    retry: loadLibraries,
    refresh,
    joinLibrary,
    createAsset,
    deleteAsset,
    createFunnel,
    updateFunnel,
    deleteFunnel,
    addStep,
    deleteStep,
  };
}

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ApiWalletState {
  balance: number;
  isLow: boolean;
  isEmpty: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

// Limite a partir do qual avisamos que o saldo está acabando (BRL)
export const LOW_BALANCE_THRESHOLD = 10;

export const useApiWallet = (): ApiWalletState => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("api_wallets")
      .select("balance_brl")
      .eq("user_id", user.id)
      .maybeSingle();

    setBalance(Number(data?.balance_brl ?? 0));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Realtime: atualizar saldo ao vivo (ex.: quando o PIX é confirmado)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`api_wallet_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "api_wallets",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newBalance = (payload.new as { balance_brl?: number })?.balance_brl;
          if (newBalance !== undefined) setBalance(Number(newBalance));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    balance,
    isLow: balance <= LOW_BALANCE_THRESHOLD,
    isEmpty: balance <= 0,
    loading,
    refetch: fetchBalance,
  };
};

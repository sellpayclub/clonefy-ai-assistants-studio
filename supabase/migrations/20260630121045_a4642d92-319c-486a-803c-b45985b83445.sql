-- ============================================================
-- Saldo de API (carteira por usuário) + transações OpenPix/PIX
-- ============================================================

-- Tabela de carteiras
CREATE TABLE public.api_wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  balance_brl numeric NOT NULL DEFAULT 0,
  low_balance_notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.api_wallets TO authenticated;
GRANT ALL ON public.api_wallets TO service_role;

ALTER TABLE public.api_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
  ON public.api_wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_api_wallets_updated_at
  BEFORE UPDATE ON public.api_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de transações
CREATE TABLE public.api_wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'recharge',
  amount_brl numeric NOT NULL DEFAULT 0,
  description text,
  openpix_correlation_id text,
  openpix_charge_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.api_wallet_transactions TO authenticated;
GRANT ALL ON public.api_wallet_transactions TO service_role;

ALTER TABLE public.api_wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.api_wallet_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_api_wallet_tx_user ON public.api_wallet_transactions(user_id);
CREATE INDEX idx_api_wallet_tx_correlation ON public.api_wallet_transactions(openpix_correlation_id);

-- ============================================================
-- Funções (SECURITY DEFINER)
-- ============================================================

-- Crédito (recarga confirmada): soma ao saldo e limpa flag de aviso
CREATE OR REPLACE FUNCTION public.credit_api_wallet(_user_id uuid, _amount numeric, _correlation_id text DEFAULT NULL)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance numeric;
BEGIN
  INSERT INTO public.api_wallets (user_id, balance_brl, low_balance_notified)
  VALUES (_user_id, _amount, false)
  ON CONFLICT (user_id) DO UPDATE
    SET balance_brl = public.api_wallets.balance_brl + EXCLUDED.balance_brl,
        low_balance_notified = false,
        updated_at = now()
  RETURNING balance_brl INTO new_balance;

  RETURN new_balance;
END;
$$;

-- Débito por mensagem: subtrai, NUNCA bloqueia (apenas informativo). Não vai abaixo de 0.
CREATE OR REPLACE FUNCTION public.debit_api_wallet(_user_id uuid, _amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance numeric;
BEGIN
  INSERT INTO public.api_wallets (user_id, balance_brl)
  VALUES (_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.api_wallets
    SET balance_brl = GREATEST(balance_brl - _amount, 0),
        updated_at = now()
    WHERE user_id = _user_id
  RETURNING balance_brl INTO new_balance;

  RETURN new_balance;
END;
$$;

-- Status do saldo (saldo + flags informativas)
CREATE OR REPLACE FUNCTION public.get_wallet_status(_user_id uuid)
RETURNS TABLE(balance numeric, is_low boolean, is_empty boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(w.balance_brl, 0) AS balance,
    COALESCE(w.balance_brl, 0) <= 10 AS is_low,
    COALESCE(w.balance_brl, 0) <= 0 AS is_empty
  FROM (SELECT 1) dummy
  LEFT JOIN public.api_wallets w ON w.user_id = _user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_wallet_status(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.credit_api_wallet(uuid, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.debit_api_wallet(uuid, numeric) TO service_role;

-- ============================================================
-- Realtime
-- ============================================================
ALTER TABLE public.api_wallets REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.api_wallets;

-- ============================================================
-- Seed: cortesia para usuários ativos com conexão WhatsApp
-- ============================================================
INSERT INTO public.api_wallets (user_id, balance_brl)
SELECT DISTINCT user_id, 55
FROM public.whatsapp_connections
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.api_wallets (user_id, balance_brl)
SELECT DISTINCT user_id, 55
FROM public.assistants
WHERE user_id IS NOT NULL AND is_active = true
ON CONFLICT (user_id) DO NOTHING;
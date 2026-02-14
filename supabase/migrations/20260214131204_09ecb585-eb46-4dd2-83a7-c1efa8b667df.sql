
-- Financial Accounts
CREATE TABLE public.financial_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    whatsapp_instance_name TEXT,
    whatsapp_connected BOOLEAN DEFAULT false,
    currency TEXT DEFAULT 'BRL',
    monthly_income NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own financial account" ON public.financial_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Financial Categories
CREATE TABLE public.financial_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT DEFAULT '📦',
    color TEXT DEFAULT '#6366f1',
    budget_limit NUMERIC(12,2),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own categories" ON public.financial_categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Financial Transactions
CREATE TABLE public.financial_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12,2) NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Outros',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT,
    notes TEXT,
    source TEXT DEFAULT 'manual' CHECK (source IN ('whatsapp', 'manual')),
    ai_categorized BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transactions" ON public.financial_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Financial Budgets
CREATE TABLE public.financial_budgets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    month TEXT NOT NULL,
    limit_amount NUMERIC(12,2) NOT NULL,
    spent_amount NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, category, month)
);
ALTER TABLE public.financial_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own budgets" ON public.financial_budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_financial_accounts_updated_at BEFORE UPDATE ON public.financial_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financial_budgets_updated_at BEFORE UPDATE ON public.financial_budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create default categories when a financial account is created
CREATE OR REPLACE FUNCTION public.create_default_financial_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.financial_categories (user_id, name, type, icon, color, is_default) VALUES
    (NEW.user_id, 'Alimentação', 'expense', '🍔', '#ef4444', true),
    (NEW.user_id, 'Transporte', 'expense', '🚗', '#f97316', true),
    (NEW.user_id, 'Moradia', 'expense', '🏠', '#8b5cf6', true),
    (NEW.user_id, 'Saúde', 'expense', '💊', '#ec4899', true),
    (NEW.user_id, 'Educação', 'expense', '📚', '#3b82f6', true),
    (NEW.user_id, 'Lazer', 'expense', '🎮', '#10b981', true),
    (NEW.user_id, 'Contas', 'expense', '💡', '#f59e0b', true),
    (NEW.user_id, 'Outros', 'expense', '📦', '#6b7280', true),
    (NEW.user_id, 'Salário', 'income', '💰', '#22c55e', true),
    (NEW.user_id, 'Freelance', 'income', '💻', '#06b6d4', true),
    (NEW.user_id, 'Investimentos', 'income', '📈', '#8b5cf6', true),
    (NEW.user_id, 'Vendas', 'income', '🛒', '#f97316', true),
    (NEW.user_id, 'Outros', 'income', '📦', '#6b7280', true);
    RETURN NEW;
END;
$$;

CREATE TRIGGER create_default_categories_on_financial_account
AFTER INSERT ON public.financial_accounts
FOR EACH ROW
EXECUTE FUNCTION public.create_default_financial_categories();

-- Indexes for performance
CREATE INDEX idx_financial_transactions_user_date ON public.financial_transactions(user_id, date DESC);
CREATE INDEX idx_financial_transactions_user_category ON public.financial_transactions(user_id, category);
CREATE INDEX idx_financial_transactions_user_type ON public.financial_transactions(user_id, type);
CREATE INDEX idx_financial_budgets_user_month ON public.financial_budgets(user_id, month);

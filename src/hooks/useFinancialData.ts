import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FinancialTransaction {
  id: string;
  user_id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string;
  payment_method: string | null;
  notes: string | null;
  source: string;
  ai_categorized: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialAccount {
  id: string;
  user_id: string;
  whatsapp_instance_name: string | null;
  whatsapp_connected: boolean;
  currency: string;
  monthly_income: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialCategory {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  budget_limit: number | null;
  is_default: boolean;
  created_at: string;
}

export interface FinancialBudget {
  id: string;
  user_id: string;
  category: string;
  month: string;
  limit_amount: number;
  spent_amount: number;
  created_at: string;
  updated_at: string;
}

export function useFinancialAccount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["financial-account", user?.id],
    queryFn: async () => {
      if (!user) return null;
      // @ts-ignore - table exists after migration
      const { data, error } = await (supabase as any)
        .from("financial_accounts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as FinancialAccount | null;
    },
    enabled: !!user,
  });
}

export function useCreateFinancialAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      // @ts-ignore
      const { data, error } = await (supabase as any)
        .from("financial_accounts")
        .insert({ user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as FinancialAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-account"] });
      queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
    },
  });
}

export function useFinancialTransactions(filters?: {
  period?: string;
  type?: string;
  category?: string;
  search?: string;
}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["financial-transactions", user?.id, filters],
    queryFn: async () => {
      if (!user) return [];
      // @ts-ignore
      let query = (supabase as any)
        .from("financial_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type);
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.search) {
        query = query.ilike("description", `%${filters.search}%`);
      }
      if (filters?.period) {
        const now = new Date();
        let startDate: string;
        switch (filters.period) {
          case "7d": {
            const d = new Date(now);
            d.setDate(d.getDate() - 7);
            startDate = d.toISOString().split("T")[0];
            break;
          }
          case "30d": {
            startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
            break;
          }
          case "90d": {
            const d = new Date(now);
            d.setDate(d.getDate() - 90);
            startDate = d.toISOString().split("T")[0];
            break;
          }
          case "year": {
            startDate = `${now.getFullYear()}-01-01`;
            break;
          }
          default:
            startDate = "2000-01-01";
        }
        query = query.gte("date", startDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FinancialTransaction[];
    },
    enabled: !!user,
  });
}

export function useAddTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tx: Omit<FinancialTransaction, "id" | "user_id" | "created_at" | "updated_at" | "ai_categorized">) => {
      if (!user) throw new Error("Not authenticated");
      // @ts-ignore
      const { data, error } = await (supabase as any)
        .from("financial_transactions")
        .insert({ ...tx, user_id: user.id, source: "manual" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialTransaction> & { id: string }) => {
      // @ts-ignore
      const { error } = await (supabase as any)
        .from("financial_transactions")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // @ts-ignore
      const { error } = await (supabase as any)
        .from("financial_transactions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
    },
  });
}

export function useFinancialCategories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["financial-categories", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // @ts-ignore
      const { data, error } = await (supabase as any)
        .from("financial_categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
      if (error) throw error;
      return (data || []) as FinancialCategory[];
    },
    enabled: !!user,
  });
}

export function useFinancialBudgets(month?: string) {
  const { user } = useAuth();
  const currentMonth = month || new Date().toISOString().substring(0, 7);
  return useQuery({
    queryKey: ["financial-budgets", user?.id, currentMonth],
    queryFn: async () => {
      if (!user) return [];
      // @ts-ignore
      const { data, error } = await (supabase as any)
        .from("financial_budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", currentMonth);
      if (error) throw error;
      return (data || []) as FinancialBudget[];
    },
    enabled: !!user,
  });
}

export function useUpdateFinancialAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialAccount> & { id: string }) => {
      // @ts-ignore
      const { error } = await (supabase as any)
        .from("financial_accounts")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-account"] });
    },
  });
}

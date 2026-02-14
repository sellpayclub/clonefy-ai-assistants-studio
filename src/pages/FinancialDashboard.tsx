import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowRight,
  Smartphone, List, Loader2,
} from "lucide-react";
import {
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  useFinancialAccount,
  useCreateFinancialAccount,
  useFinancialTransactions,
  useFinancialBudgets,
} from "@/hooks/useFinancialData";
import { useToast } from "@/hooks/use-toast";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#6366f1", "#f59e0b", "#ec4899", "#14b8a6", "#8b5cf6",
];

export default function FinancialDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [period, setPeriod] = useState("30d");

  const { data: account, isLoading: loadingAccount } = useFinancialAccount();
  const createAccount = useCreateFinancialAccount();
  const { data: transactions = [], isLoading: loadingTx } = useFinancialTransactions({ period });
  const { data: budgets = [] } = useFinancialBudgets();

  const stats = useMemo(() => {
    let income = 0, expense = 0;
    const byCategory: Record<string, number> = {};
    const byDate: Record<string, { income: number; expense: number }> = {};

    for (const tx of transactions) {
      const amt = Number(tx.amount);
      if (tx.type === "income") income += amt;
      else {
        expense += amt;
        byCategory[tx.category] = (byCategory[tx.category] || 0) + amt;
      }

      const d = tx.date;
      if (!byDate[d]) byDate[d] = { income: 0, expense: 0 };
      if (tx.type === "income") byDate[d].income += amt;
      else byDate[d].expense += amt;
    }

    const balance = income - expense;
    const savingsRate = income > 0 ? ((balance / income) * 100) : 0;

    const pieData = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

    const lineData = Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, vals]) => ({
        date: date.substring(5),
        Receitas: Math.round(vals.income * 100) / 100,
        Gastos: Math.round(vals.expense * 100) / 100,
      }));

    return { income, expense, balance, savingsRate, pieData, lineData };
  }, [transactions]);

  // Budget progress
  const budgetProgress = useMemo(() => {
    const categorySpent: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type === "expense") {
        categorySpent[tx.category] = (categorySpent[tx.category] || 0) + Number(tx.amount);
      }
    }
    return budgets.map((b) => ({
      ...b,
      spent: categorySpent[b.category] || 0,
      percentage: b.limit_amount > 0
        ? Math.min(100, ((categorySpent[b.category] || 0) / b.limit_amount) * 100)
        : 0,
    }));
  }, [transactions, budgets]);

  const handleActivate = async () => {
    try {
      await createAccount.mutateAsync();
      toast({ title: "Agente Financeiro ativado!", description: "Agora conecte seu WhatsApp." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  if (loadingAccount) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  // Setup wizard
  if (!account) {
    return (
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border p-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Financeiro IA</h1>
              <p className="text-muted-foreground">Seu consultor financeiro pessoal no WhatsApp</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-lg w-full bg-card border-border">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl text-foreground">Ative seu Agente Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                Controle suas finanças pelo WhatsApp! Registre gastos e ganhos por mensagem de texto e acompanhe tudo pelo dashboard.
              </p>
              <div className="grid grid-cols-1 gap-3 text-left">
                {[
                  "📱 Registre gastos e receitas pelo WhatsApp",
                  "🤖 IA categoriza tudo automaticamente",
                  "📊 Dashboard completo com gráficos",
                  "💡 Dicas personalizadas de economia",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleActivate}
                disabled={createAccount.isPending}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {createAccount.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Ativando...</>
                ) : (
                  <><Wallet className="w-4 h-4 mr-2" />Ativar Agente Financeiro</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Financeiro IA</h1>
              <p className="text-muted-foreground">
                {account.whatsapp_connected
                  ? "✅ WhatsApp conectado"
                  : "⚠️ WhatsApp não conectado"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
              </SelectContent>
            </Select>
            {!account.whatsapp_connected && (
              <Button onClick={() => navigate("/financeiro/conectar")} className="bg-primary hover:bg-primary/90">
                <Smartphone className="w-4 h-4 mr-2" />Conectar WhatsApp
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/financeiro/transacoes")}>
              <List className="w-4 h-4 mr-2" />Transações
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Saldo</p>
                  <p className={`text-2xl font-bold ${stats.balance >= 0 ? "text-primary" : "text-destructive"}`}>
                    R$ {stats.balance.toFixed(2)}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.balance >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
                  <Wallet className={`w-5 h-5 ${stats.balance >= 0 ? "text-primary" : "text-destructive"}`} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Receitas</p>
                  <p className="text-2xl font-bold text-primary">R$ {stats.income.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Gastos</p>
                  <p className="text-2xl font-bold text-destructive">R$ {stats.expense.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Economia</p>
                  <p className="text-2xl font-bold text-foreground">{stats.savingsRate.toFixed(1)}%</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">Receitas vs Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={stats.lineData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-muted-foreground" fontSize={12} />
                    <YAxis className="text-muted-foreground" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Receitas" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="Gastos" stroke="hsl(var(--destructive))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  Nenhuma transação no período
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  Nenhum gasto no período
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress */}
        {budgetProgress.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">Orçamento Mensal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetProgress.map((b) => (
                <div key={b.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{b.category}</span>
                    <span className={`text-sm ${b.percentage > 90 ? "text-destructive" : "text-muted-foreground"}`}>
                      R$ {b.spent.toFixed(2)} / R$ {Number(b.limit_amount).toFixed(2)}
                    </span>
                  </div>
                  <Progress
                    value={b.percentage}
                    className={`h-2 ${b.percentage > 90 ? "[&>div]:bg-destructive" : ""}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Empty state hint */}
        {transactions.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma transação ainda</h3>
              <p className="text-muted-foreground mb-4">
                {account.whatsapp_connected
                  ? 'Envie uma mensagem no WhatsApp como "Gastei 50 no mercado" para começar!'
                  : "Conecte seu WhatsApp ou adicione transações manualmente."}
              </p>
              <div className="flex gap-3 justify-center">
                {!account.whatsapp_connected && (
                  <Button onClick={() => navigate("/financeiro/conectar")} className="bg-primary hover:bg-primary/90">
                    <Smartphone className="w-4 h-4 mr-2" />Conectar WhatsApp
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate("/financeiro/transacoes")}>
                  <ArrowRight className="w-4 h-4 mr-2" />Adicionar Manualmente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

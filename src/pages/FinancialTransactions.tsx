import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, Download, Search, Trash2, Pencil, Loader2, Wallet,
} from "lucide-react";
import {
  useFinancialTransactions,
  useAddTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
  useFinancialCategories,
  type FinancialTransaction,
} from "@/hooks/useFinancialData";
import { useToast } from "@/hooks/use-toast";

export default function FinancialTransactions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [period, setPeriod] = useState("30d");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTx, setEditTx] = useState<FinancialTransaction | null>(null);

  // Form state
  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [formAmount, setFormAmount] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("Outros");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formPayment, setFormPayment] = useState("");

  const { data: transactions = [], isLoading } = useFinancialTransactions({
    period,
    type: typeFilter,
    category: categoryFilter || undefined,
    search: search || undefined,
  });
  const { data: categories = [] } = useFinancialCategories();
  const addTx = useAddTransaction();
  const deleteTx = useDeleteTransaction();
  const updateTx = useUpdateTransaction();

  const expenseCategories = categories.filter((c) => c.type === "expense").map((c) => c.name);
  const incomeCategories = categories.filter((c) => c.type === "income").map((c) => c.name);
  const currentCategories = formType === "expense" ? expenseCategories : incomeCategories;

  const resetForm = () => {
    setFormType("expense");
    setFormAmount("");
    setFormDesc("");
    setFormCategory("Outros");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormPayment("");
  };

  const handleAdd = async () => {
    if (!formAmount || !formDesc) return;
    try {
      await addTx.mutateAsync({
        type: formType,
        amount: parseFloat(formAmount),
        description: formDesc,
        category: formCategory,
        date: formDate,
        payment_method: formPayment || null,
        notes: null,
        source: "manual",
      });
      toast({ title: "Transação adicionada!" });
      setAddOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!editTx) return;
    try {
      await updateTx.mutateAsync({
        id: editTx.id,
        type: formType,
        amount: parseFloat(formAmount),
        description: formDesc,
        category: formCategory,
        date: formDate,
        payment_method: formPayment || null,
      });
      toast({ title: "Transação atualizada!" });
      setEditTx(null);
      resetForm();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTx.mutateAsync(id);
      toast({ title: "Transação removida" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const openEdit = (tx: FinancialTransaction) => {
    setFormType(tx.type as "income" | "expense");
    setFormAmount(String(tx.amount));
    setFormDesc(tx.description);
    setFormCategory(tx.category);
    setFormDate(tx.date);
    setFormPayment(tx.payment_method || "");
    setEditTx(tx);
  };

  const exportCSV = () => {
    const headers = "Data,Tipo,Descrição,Categoria,Valor,Método,Fonte\n";
    const rows = transactions
      .map((t) =>
        `${t.date},${t.type === "income" ? "Receita" : "Gasto"},"${t.description}",${t.category},${t.amount},${t.payment_method || ""},${t.source}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const TransactionForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select value={formType} onValueChange={(v) => { setFormType(v as any); setFormCategory("Outros"); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Gasto</SelectItem>
              <SelectItem value="income">Receita</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Valor (R$)</Label>
          <Input type="number" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" />
        </div>
      </div>
      <div>
        <Label>Descrição</Label>
        <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Ex: Mercado, Salário..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Categoria</Label>
          <Select value={formCategory} onValueChange={setFormCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(currentCategories.length > 0 ? currentCategories : ["Outros"]).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Data</Label>
          <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Método de Pagamento</Label>
        <Select value={formPayment} onValueChange={setFormPayment}>
          <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="dinheiro">Dinheiro</SelectItem>
            <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
            <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
            <SelectItem value="transferencia">Transferência</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onSubmit} className="w-full bg-primary hover:bg-primary/90" disabled={!formAmount || !formDesc}>
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Button variant="ghost" onClick={() => navigate("/financeiro")} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />Voltar
            </Button>
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Transações</h1>
              <p className="text-muted-foreground">{transactions.length} transações</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />CSV
            </Button>
            <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
                <TransactionForm onSubmit={handleAdd} submitLabel="Adicionar" />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-border flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
            <SelectItem value="90d">90 dias</SelectItem>
            <SelectItem value="year">Ano</SelectItem>
            <SelectItem value="all">Tudo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="expense">Gastos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter || "all"} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {[...new Set(transactions.map((t) => t.category))].map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p>Nenhuma transação encontrada</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-foreground">{tx.date}</TableCell>
                  <TableCell>
                    <Badge variant={tx.type === "income" ? "default" : "destructive"} className="text-xs">
                      {tx.type === "income" ? "Receita" : "Gasto"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground font-medium">{tx.description}</TableCell>
                  <TableCell className="text-muted-foreground">{tx.category}</TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${tx.type === "income" ? "text-primary" : "text-destructive"}`}>
                    {tx.type === "income" ? "+" : "-"}R$ {Number(tx.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{tx.payment_method || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {tx.source === "whatsapp" ? "📱 WhatsApp" : "✍️ Manual"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(tx)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(tx.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTx} onOpenChange={(o) => { if (!o) { setEditTx(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Transação</DialogTitle></DialogHeader>
          <TransactionForm onSubmit={handleEdit} submitLabel="Salvar" />
        </DialogContent>
      </Dialog>
    </main>
  );
}

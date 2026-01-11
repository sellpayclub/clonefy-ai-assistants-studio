import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, ArrowRight, TrendingUp, DollarSign, Users, Target, BarChart3, Calculator, Percent, Bot } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import LazyImage from "@/components/LazyImage";
import { Link as RouterLink } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ClonefyPromoBanner from "@/components/ClonefyPromoBanner";

const WhatsAppROICalculator = () => {
    const { setTheme } = useTheme();

    // States for inputs
    const [investment, setInvestment] = useState<number>(1000);
    const [leads, setLeads] = useState<number>(100);
    const [closingRate, setClosingRate] = useState<number>(10);
    const [avgTicket, setAvgTicket] = useState<number>(200);

    // Derived calculations
    const [closedDeals, setClosedDeals] = useState(0);
    const [revenue, setRevenue] = useState(0);
    const [profit, setProfit] = useState(0);
    const [roi, setRoi] = useState(0);
    const [cpl, setCpl] = useState(0);

    useEffect(() => {
        setTheme("light");
    }, [setTheme]);

    useEffect(() => {
        const deals = (leads * closingRate) / 100;
        const totalRevenue = deals * avgTicket;
        const netProfit = totalRevenue - investment;
        const calculatedRoi = investment > 0 ? (netProfit / investment) * 100 : 0;
        const calculatedCpl = leads > 0 ? investment / leads : 0;

        setClosedDeals(Math.round(deals));
        setRevenue(totalRevenue);
        setProfit(netProfit);
        setRoi(calculatedRoi);
        setCpl(calculatedCpl);
    }, [investment, leads, closingRate, avgTicket]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/50">
            <Helmet>
                <title>Calculadora de ROI para WhatsApp - Ferramenta de Conversão Clonefy</title>
                <meta name="description" content="Calcule o retorno de investimento das suas campanhas de WhatsApp. Descubra seu custo por lead e otimize suas conversões de vendas." />
                <meta name="keywords" content="calculadora roi whatsapp, custo por lead whatsapp, planilha conversão whatsapp, marketing digital, clonefy" />
            </Helmet>

            {/* Header */}
            <header className="container mx-auto px-4 py-4 lg:py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <RouterLink to="/">
                            <LazyImage
                                src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png"
                                alt="CLONEFY Logo"
                                className="h-10 w-auto"
                                loading="eager"
                            />
                        </RouterLink>
                        <div className="h-6 w-px bg-slate-300 mx-1"></div>
                        <span className="text-lg font-bold text-slate-700">Tools</span>
                    </div>
                    <div className="hidden sm:flex gap-4">
                        <RouterLink to="/ferramentas/clickgo" className="text-sm text-slate-500 hover:text-emerald-600 font-medium">ClickGo</RouterLink>
                        <RouterLink to="/ferramentas/gerador-link-whatsapp" className="text-sm text-slate-500 hover:text-emerald-600 font-medium">Link Direct</RouterLink>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 lg:py-16">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold mb-4">
                            <Calculator className="h-3 w-3" />
                            ROI E PERFORMANCE
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
                            Calculadora de <span className="text-emerald-600">ROI para WhatsApp</span>
                        </h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Saiba exatamente quanto lucro suas campanhas de WhatsApp estão gerando.
                            Ajuste seus números e veja o potencial de escala do seu negócio.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Input Side */}
                        <div className="lg:col-span-5 bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-emerald-600" />
                                Dados da Campanha
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-emerald-500" />
                                        Valor Investido (Anúncios)
                                    </label>
                                    <Input
                                        type="number"
                                        value={investment}
                                        onChange={(e) => setInvestment(Number(e.target.value))}
                                        className="rounded-xl h-12 border-slate-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <Users className="h-4 w-4 text-blue-500" />
                                        Número de Leads Gerados
                                    </label>
                                    <Input
                                        type="number"
                                        value={leads}
                                        onChange={(e) => setLeads(Number(e.target.value))}
                                        className="rounded-xl h-12 border-slate-200"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                            <Target className="h-4 w-4 text-orange-500" />
                                            Taxa de Fechamento (%)
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={closingRate}
                                                onChange={(e) => setClosingRate(Number(e.target.value))}
                                                className="rounded-xl h-12 border-slate-200 pr-10"
                                            />
                                            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                            Ticket Médio (Venda)
                                        </label>
                                        <Input
                                            type="number"
                                            value={avgTicket}
                                            onChange={(e) => setAvgTicket(Number(e.target.value))}
                                            className="rounded-xl h-12 border-slate-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <p className="text-xs text-emerald-800 leading-relaxed italic">
                                    "Dica: Melhore sua taxa de fechamento usando funcionários de IA da Clonefy para responder instantaneamente e nunca deixar um lead esfriar."
                                </p>
                            </div>
                        </div>

                        {/* Results Side */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Main ROI Card */}
                                <div className="sm:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-2">Retorno sobre Investimento (ROI)</p>
                                        <h2 className={`text-6xl font-black mb-4 ${roi >= 0 ? 'text-white' : 'text-red-400'}`}>
                                            {roi.toFixed(0)}%
                                        </h2>
                                        <div className="flex gap-4">
                                            <div className="bg-white/10 px-4 py-2 rounded-full text-sm">
                                                Lucro: <span className="font-bold text-emerald-400">{formatCurrency(profit)}</span>
                                            </div>
                                            <div className="bg-white/10 px-4 py-2 rounded-full text-sm">
                                                CPL: <span className="font-bold">{formatCurrency(cpl)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Stat Cards */}
                                <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                                    <p className="text-slate-500 text-xs font-bold uppercase mb-1">Vendas Realizadas</p>
                                    <p className="text-3xl font-black text-slate-900">{closedDeals}</p>
                                    <p className="text-slate-400 text-[10px] mt-1">Estimativa baseada na taxa</p>
                                </div>

                                <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                                    <p className="text-slate-500 text-xs font-bold uppercase mb-1">Faturamento Bruto</p>
                                    <p className="text-3xl font-black text-emerald-600">{formatCurrency(revenue)}</p>
                                    <p className="text-slate-400 text-[10px] mt-1">Valor total de vendas</p>
                                </div>
                            </div>

                            {/* Interpretation Section */}
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-emerald-100">
                                <h4 className="font-bold text-slate-900 mb-4">Análise de Performance:</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${roi > 300 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {roi > 300 ? <Zap className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">
                                                {roi > 500 ? "Excelente Escala!" : roi > 200 ? "Campanha Saudável" : roi > 0 ? "Empate Técnico / Baixo Lucro" : "Atenção: Operação no Prejuízo"}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {roi > 0
                                                    ? `Para cada R$ 1,00 investido, você está recebendo ${(revenue / investment).toFixed(2)} de volta.`
                                                    : "Verifique sua taxa de fechamento ou o custo dos seus leads urgentemente."}
                                            </p>
                                        </div>
                                    </div>

                                    <RouterLink to="/" className="block mt-6 group">
                                        <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-between group-hover:bg-slate-800 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Bot className="h-8 w-8 text-emerald-400" />
                                                <div className="text-left">
                                                    <p className="text-white text-xs font-bold">Dobre seu ROI com</p>
                                                    <p className="text-emerald-400 text-sm font-black">Funcionários de IA Clonefy</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </RouterLink>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <ClonefyPromoBanner />

            {/* Footer */}
            <footer className="border-t bg-white py-12">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex justify-center gap-6 mb-8 text-sm font-medium text-slate-500">
                        <RouterLink to="/ferramentas/clickgo" className="hover:text-emerald-600">ClickGo</RouterLink>
                        <RouterLink to="/ferramentas/gerador-link-whatsapp" className="hover:text-emerald-600">Link Generator</RouterLink>
                        <RouterLink to="/ferramentas/gerador-widget-whatsapp" className="hover:text-emerald-600">Widget Creator</RouterLink>
                    </div>
                    <p className="text-xs text-slate-400">Calculadora de ROI focada em conversão para WhatsApp. Uma cortesia da Clonefy.</p>
                </div>
            </footer>
        </div>
    );
};

export default WhatsAppROICalculator;

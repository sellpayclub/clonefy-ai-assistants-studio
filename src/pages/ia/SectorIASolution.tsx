import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Bot, Mic, Calendar, Check, X, ArrowRight, Zap, ChevronDown, ChevronUp, MessageCircle, Clock, DollarSign, Sparkles, Calculator } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import LazyImage from "@/components/LazyImage";
import ChatWidget from "@/components/ChatWidget";
import aiNichesData from "@/data/ai-niches.json";

interface SectorData {
    slug: string;
    sector: string;
    headline: string;
    intro: string;
    use_case_audio: string;
    use_case_agenda: string;
    content_section: string;
    comparison: {
        human_cost: string;
        human_hours: string;
        human_response: string;
        ai_cost: string;
        ai_hours: string;
        ai_response: string;
    };
    roi_calculation: string;
    cta_text: string;
    widget_greeting: string;
    meta_title: string;
    meta_description: string;
    faq: { question: string; answer: string }[];
}

const SectorIASolution = () => {
    const { slug } = useParams<{ slug: string }>();
    const { setTheme } = useTheme();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [showWidget, setShowWidget] = useState(false);
    const [chatLoaded, setChatLoaded] = useState(false);

    const CHAT_ASSISTANT_ID = "aeb677ad-3f58-4ecd-b414-79c1aa534d13";

    const sector = useMemo(() => {
        return (aiNichesData as SectorData[]).find((s) => s.slug === slug);
    }, [slug]);

    useEffect(() => {
        setTheme("light");
        // Show widget after 3 seconds
        const timer = setTimeout(() => setShowWidget(true), 3000);
        return () => clearTimeout(timer);
    }, [setTheme]);

    if (!sector) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">Setor não encontrado</h1>
                    <Link to="/">
                        <Button>Voltar para Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // JSON-LD Schema for FAQ
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": sector.faq.map((item) => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer,
            },
        })),
    };

    // JSON-LD Schema for Product/Service
    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": `IA para Atendimento de ${sector.sector}`,
        "description": sector.meta_description,
        "brand": {
            "@type": "Brand",
            "name": "Clonefy"
        },
        "offers": {
            "@type": "Offer",
            "price": "297",
            "priceCurrency": "BRL",
            "availability": "https://schema.org/InStock"
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/50 font-sans">
            <Helmet>
                <title>{sector.meta_title}</title>
                <meta name="description" content={sector.meta_description} />
                <meta name="keywords" content={`ia para ${sector.sector.toLowerCase()}, atendimento automatizado ${sector.sector.toLowerCase()}, chatbot whatsapp ${sector.sector.toLowerCase()}, clonefy`} />
                <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
                <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
            </Helmet>

            {/* Header */}
            <header className="container mx-auto px-4 py-4 lg:py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link to="/">
                            <LazyImage
                                src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png"
                                alt="CLONEFY Logo"
                                className="h-14 w-auto sm:h-16 lg:h-20"
                                loading="eager"
                            />
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/auth">
                            <Button variant="outline" size="sm" className="text-xs sm:text-sm border-emerald-200 hover:bg-emerald-50 px-2 sm:px-3">
                                Entrar
                            </Button>
                        </Link>
                        <a href="https://www.agendamento-agendify.com/b/ia-clonefy" target="_blank" rel="noopener noreferrer">
                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-xs sm:text-sm px-2 sm:px-4"
                            >
                                Agendar Demo
                            </Button>
                        </a>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="container mx-auto px-4 py-8 sm:py-10 lg:py-14 text-center">
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-5 animate-in fade-in slide-in-from-top-4 duration-700">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
                                <Bot className="h-4 w-4" />
                                IA Especializada para {sector.sector}
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight text-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {sector.headline.split('IA').map((part, i, arr) => (
                                <span key={i}>
                                    {part}
                                    {i < arr.length - 1 && (
                                        <span className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                                            IA
                                        </span>
                                    )}
                                </span>
                            ))}
                        </h1>

                        <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed animate-in fade-in delay-200 duration-700">
                            {sector.intro}
                        </p>

                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-5 sm:p-6 mb-8 max-w-3xl mx-auto shadow-xl animate-in zoom-in-95 duration-500 delay-300">
                            <p className="text-white text-lg sm:text-xl font-semibold leading-relaxed">
                                Responda clientes de <span className="underline decoration-2 underline-offset-4">{sector.sector}</span> 24h por dia e converta mais com ajuda da Julia.
                            </p>
                        </div>

                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
                            <a href="https://www.agendamento-agendify.com/b/ia-clonefy" target="_blank" rel="noopener noreferrer">
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-7 text-lg font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all group"
                                >
                                    {sector.cta_text}
                                    <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </a>
                        </div>
                    </div>
                </section>

                {/* Capabilities Grid */}
                <section className="py-14 sm:py-20 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="max-w-5xl mx-auto">
                            <div className="text-center mb-12">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                                    <Sparkles className="h-4 w-4" />
                                    Superpoderes da Julia
                                </span>
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                                    Tudo que um humano faz, <span className="text-emerald-600">ela faz melhor!</span>
                                </h2>
                                <p className="text-slate-600 text-lg">Uma IA treinada para o setor de {sector.sector}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                {/* Audio Use Case */}
                                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-3xl p-8 relative overflow-hidden group hover:shadow-lg transition-all">
                                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                        <Mic className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Escuta e Entende Áudios</h3>
                                    <p className="text-slate-600 leading-relaxed italic text-lg opacity-90">
                                        "{sector.use_case_audio}"
                                    </p>
                                    <div className="mt-6 flex items-center gap-2 text-orange-700 font-semibold bg-white/60 w-fit px-4 py-2 rounded-full border border-orange-200">
                                        <Check className="w-5 h-5" />
                                        <span>Triagem Automática por Voz</span>
                                    </div>
                                </div>

                                {/* Agenda Use Case */}
                                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-3xl p-8 relative overflow-hidden group hover:shadow-lg transition-all">
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                        <Calendar className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Gestão de Agenda</h3>
                                    <p className="text-slate-600 leading-relaxed italic text-lg opacity-90">
                                        "{sector.use_case_agenda}"
                                    </p>
                                    <div className="mt-6 flex items-center gap-2 text-emerald-700 font-semibold bg-white/60 w-fit px-4 py-2 rounded-full border border-emerald-200">
                                        <Check className="w-5 h-5" />
                                        <span>Sincronização em Tempo Real</span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Section */}
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-14 border border-slate-800 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
                                <div className="relative z-10">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 border-l-4 border-emerald-500 pl-6">
                                        O Futuro do Atendimento para {sector.sector}
                                    </h2>
                                    <div className="prose prose-invert prose-emerald prose-lg max-w-none">
                                        {sector.content_section.split('\n\n').map((paragraph, i) => (
                                            <p key={i} className="text-slate-300 leading-relaxed mb-6 font-light">
                                                {paragraph}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Comparison Table Section */}
                <section className="py-14 sm:py-24 bg-gradient-to-br from-slate-50 to-emerald-50">
                    <div className="container mx-auto px-4">
                        <div className="max-w-5xl mx-auto">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                                    Atendente Humano vs. <span className="text-emerald-600">Funcionário de IA</span>
                                </h2>
                                <p className="text-slate-600">A comparação definitiva para o seu negócio de {sector.sector}</p>
                            </div>

                            <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-emerald-100 animate-in fade-in duration-1000">
                                <div className="grid grid-cols-3">
                                    {/* Header */}
                                    <div className="p-6 bg-slate-50 border-b border-slate-100 font-bold uppercase text-xs tracking-widest text-slate-400">Dimensão</div>
                                    <div className="p-6 bg-slate-50 border-b border-slate-100 text-center font-bold text-slate-700 uppercase text-xs tracking-widest">Atendente Humano</div>
                                    <div className="p-6 bg-emerald-500 border-b border-emerald-600 text-center font-bold text-white uppercase text-xs tracking-widest">IA Clonefy</div>

                                    {/* Custo */}
                                    <div className="p-6 sm:p-8 border-b border-slate-50 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                                            <DollarSign className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <span className="font-bold text-slate-800">Custo Mensal</span>
                                    </div>
                                    <div className="p-6 sm:p-8 border-b border-slate-50 text-center">
                                        <span className="text-red-500 font-medium px-3 py-1 bg-red-50 rounded-full">{sector.comparison.human_cost}</span>
                                    </div>
                                    <div className="p-6 sm:p-8 border-b border-slate-50 text-center bg-emerald-50/50">
                                        <span className="text-emerald-600 font-bold text-xl">{sector.comparison.ai_cost}</span>
                                    </div>

                                    {/* Disponibilidade */}
                                    <div className="p-6 sm:p-8 border-b border-slate-50 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                                            <Clock className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <span className="font-bold text-slate-800">Disponibilidade</span>
                                    </div>
                                    <div className="p-6 sm:p-8 border-b border-slate-50 text-center text-slate-600">{sector.comparison.human_hours}</div>
                                    <div className="p-6 sm:p-8 border-b border-slate-50 text-center bg-emerald-50/50">
                                        <span className="text-emerald-600 font-bold">{sector.comparison.ai_hours}</span>
                                    </div>

                                    {/* Resposta */}
                                    <div className="p-6 sm:p-8 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                                            <Zap className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <span className="font-bold text-slate-800">Tempo de Resposta</span>
                                    </div>
                                    <div className="p-6 sm:p-8 text-center text-slate-600">{sector.comparison.human_response}</div>
                                    <div className="p-6 sm:p-8 text-center bg-emerald-50/50">
                                        <div className="inline-flex items-center gap-2 text-emerald-600 font-bold text-lg animate-pulse">
                                            <Zap className="w-5 h-5 fill-current" />
                                            {sector.comparison.ai_response}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ROI Box */}
                            <div className="mt-12 bg-white p-8 rounded-3xl border border-emerald-200 shadow-lg flex flex-col md:flex-row items-center gap-8 animate-in slide-in-from-bottom-8 duration-700">
                                <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center shrink-0 shadow-inner">
                                    <Calculator className="w-10 h-10 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Impacto no ROI</h3>
                                    <p className="text-slate-600 text-lg leading-relaxed">
                                        {sector.roi_calculation}
                                    </p>
                                </div>
                                <div className="shrink-0 w-full md:w-auto">
                                    <a href="https://www.agendamento-agendify.com/b/ia-clonefy" target="_blank" rel="noopener noreferrer">
                                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 px-8 rounded-2xl">
                                            Verificar ROI Real
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Embedded Chat Section */}
                <section className="py-14 sm:py-20 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="max-w-2xl mx-auto">
                            <div className="text-center mb-8">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                                    <MessageCircle className="h-4 w-4" />
                                    Chat ao Vivo
                                </span>
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                                    Teste a Julia <span className="text-emerald-600">agora mesmo!</span>
                                </h2>
                                <p className="text-slate-600 text-lg">Converse com nossa IA especializada em {sector.sector}</p>
                            </div>

                            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-emerald-200 relative">
                                {!chatLoaded && (
                                    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-10">
                                        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                                        <p className="text-slate-500 text-sm">Carregando chat...</p>
                                    </div>
                                )}
                                <iframe
                                    src={`https://clonefy-ai-assistants-studio.lovable.app/embed-chat/${CHAT_ASSISTANT_ID}`}
                                    className="w-full"
                                    style={{
                                        height: '500px',
                                        border: 'none',
                                        opacity: chatLoaded ? 1 : 0,
                                        transition: 'opacity 0.3s ease-in-out'
                                    }}
                                    title={`Chat com IA para ${sector.sector}`}
                                    allow="microphone"
                                    onLoad={() => setChatLoaded(true)}
                                />
                            </div>

                            <div className="text-center mt-8">
                                <p className="text-slate-600 mb-4 text-lg">
                                    Gostou? Tenha uma <strong className="text-emerald-600">Julia especializada</strong> para seu negócio!
                                </p>
                                <a href="https://www.agendamento-agendify.com/b/ia-clonefy" target="_blank" rel="noopener noreferrer">
                                    <Button
                                        size="lg"
                                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-6 text-lg font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all"
                                    >
                                        QUERO MINHA PRÓPRIA IA
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-14 sm:py-24 bg-slate-50">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                                    Tudo que você precisa saber
                                </h2>
                                <p className="text-slate-600">Dúvidas comuns sobre IA no setor de {sector.sector}</p>
                            </div>

                            <div className="space-y-4">
                                {sector.faq.map((item, index) => (
                                    <div
                                        key={index}
                                        className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-emerald-500 rounded-3xl overflow-hidden transition-all duration-300"
                                    >
                                        <button
                                            onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                            className="w-full flex items-center justify-between p-6 sm:p-8 text-left transition-colors"
                                        >
                                            <span className="text-lg font-bold text-slate-900">{item.question}</span>
                                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${expandedFaq === index ? 'bg-emerald-500 text-white rotate-180' : 'bg-slate-200 text-slate-500'}`}>
                                                <ChevronDown className="h-5 w-5" />
                                            </div>
                                        </button>
                                        {expandedFaq === index && (
                                            <div className="px-6 sm:px-8 pb-8 text-slate-600 text-lg leading-relaxed animate-in slide-in-from-top-4 duration-300">
                                                {item.answer}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final Call to Action */}
                <section className="py-20 sm:py-32 bg-slate-900 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                        <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500 rounded-full blur-[120px]"></div>
                        <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-500 rounded-full blur-[120px]"></div>
                    </div>

                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <div className="max-w-4xl mx-auto">
                            <span className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 text-emerald-400 rounded-full text-lg font-bold mb-8 border border-emerald-500/20">
                                <Zap className="h-6 w-6 fill-current" />
                                Comece hoje mesmo
                            </span>
                            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight">
                                Transforme seu atendimento com <span className="text-emerald-500">IA de ponta</span>
                            </h2>
                            <p className="text-slate-400 text-xl sm:text-2xl mb-12 font-light">
                                Pare de perder leads por demora no WhatsApp. Junte-se à revolução da Clonefy no setor de {sector.sector}.
                            </p>
                            <a href="https://www.agendamento-agendify.com/b/ia-clonefy" target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-12 py-8 text-2xl rounded-[2rem] shadow-[0_0_50px_-12px_rgba(16,185,129,0.5)] transform hover:scale-105 active:scale-95 transition-all">
                                    AGENDAR DEMO AGORA
                                    <ArrowRight className="ml-3 h-8 w-8" />
                                </Button>
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white pt-20 pb-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 px-4">
                        <div className="col-span-2">
                            <LazyImage
                                src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png"
                                alt="CLONEFY Logo"
                                className="h-16 w-auto mb-8"
                                loading="lazy"
                            />
                            <p className="text-slate-500 text-lg leading-relaxed max-w-sm">
                                Especialistas em criar Funcionários de IA que trabalham 24h para o seu negócio. Atendimento, vendas e suporte totalmente automatizados.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-6 uppercase text-sm tracking-widest">Plataforma</h4>
                            <nav className="flex flex-col gap-4">
                                <Link to="/" className="text-slate-600 hover:text-emerald-600 text-lg">Home</Link>
                                <Link to="/auth" className="text-slate-600 hover:text-emerald-600 text-lg">Entrar no Painel</Link>
                                <a href="https://www.agendamento-agendify.com/b/ia-clonefy" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-emerald-600 text-lg font-bold">Agendar Demo</a>
                            </nav>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-6 uppercase text-sm tracking-widest">IA Solutions</h4>
                            <nav className="flex flex-col gap-4">
                                <Link to="/ia/clinicas-estetica" className="text-slate-600 hover:text-emerald-600 text-sm">Clínicas de Estética</Link>
                                <Link to="/ia/imobiliarias" className="text-slate-600 hover:text-emerald-600 text-sm">Imobiliárias</Link>
                                <Link to="/ia/restaurantes-delivery" className="text-slate-600 hover:text-emerald-600 text-sm">Restaurantes</Link>
                                <Link to="/ia/academias-crossfit" className="text-slate-600 hover:text-emerald-600 text-sm">Academias</Link>
                                <Link to="/ia/contabilidade" className="text-slate-600 hover:text-emerald-600 text-sm">Contabilidade</Link>
                            </nav>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 pt-10 text-center">
                        <p className="text-slate-400 text-sm">
                            © 2024 CLONEFY - TECNOLOGIA EM ATENDIMENTO IA. TODOS OS DIREITOS RESERVADOS.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Julia Widget Popup */}
            {showWidget && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-10 duration-700">
                    <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-emerald-100 p-6 max-w-[320px] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-600"></div>
                        <div className="flex flex-col gap-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-12 transition-transform">
                                    <Bot className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h5 className="font-black text-slate-900 tracking-tight">Julia da Clonefy</h5>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Online Agora</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed font-medium">
                                {sector.widget_greeting}
                            </p>
                            <a href="https://www.agendamento-agendify.com/b/ia-clonefy" target="_blank" rel="noopener noreferrer">
                                <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl py-5 shadow-emerald-200 shadow-lg">
                                    Teste Gratuito
                                    <Zap className="ml-2 h-4 w-4 fill-current" />
                                </Button>
                            </a>
                        </div>
                        <button
                            onClick={() => setShowWidget(false)}
                            className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-full p-1.5 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        <ChatWidget />
        </div>
    );
};

export default SectorIASolution;

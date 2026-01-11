import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Bot, Mic, Calendar, Check, X, ArrowRight, Zap, ChevronDown, ChevronUp, MessageCircle, Clock, DollarSign } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import LazyImage from "@/components/LazyImage";
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
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
                                className="h-10 w-auto"
                                loading="eager"
                            />
                        </Link>
                        <div className="h-6 w-px bg-slate-300 mx-1"></div>
                        <span className="text-lg font-bold text-indigo-700">IA Solutions</span>
                    </div>
                    <Link to="/">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            Conhecer Clonefy
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 lg:py-16">
                {/* Hero Section */}
                <header className="max-w-5xl mx-auto text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold mb-6">
                        <Bot className="h-4 w-4" />
                        SOLUÇÃO ESPECIALIZADA
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
                        {sector.headline}
                    </h1>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                        {sector.intro}
                    </p>
                </header>

                {/* Superpowers Section */}
                <section className="max-w-6xl mx-auto mb-20">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
                        Superpoderes no <span className="text-indigo-600">{sector.sector}</span>
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Audio Use Case */}
                        <article className="bg-white rounded-3xl shadow-xl border border-indigo-100 p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                                    <Mic className="h-7 w-7 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">
                                    IA que Escuta Áudios
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {sector.use_case_audio}
                                </p>
                            </div>
                        </article>

                        {/* Agenda Use Case */}
                        <article className="bg-white rounded-3xl shadow-xl border border-indigo-100 p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                                    <Calendar className="h-7 w-7 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">
                                    Integração com Agenda
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {sector.use_case_agenda}
                                </p>
                            </div>
                        </article>
                    </div>
                </section>

                {/* Content Section */}
                <section className="max-w-4xl mx-auto mb-20">
                    <article className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">
                            Por que {sector.sector} precisam de IA para atendimento?
                        </h2>
                        <div className="prose prose-slate prose-lg max-w-none">
                            {sector.content_section.split('\n\n').map((paragraph, i) => (
                                <p key={i} className="text-slate-600 leading-relaxed mb-4">
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    </article>
                </section>

                {/* Comparison Table */}
                <section className="max-w-5xl mx-auto mb-20">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
                        Atendente Humano vs. IA Clonefy<br />
                        <span className="text-indigo-600">no setor de {sector.sector}</span>
                    </h2>

                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                        <div className="grid grid-cols-3 gap-0">
                            {/* Header */}
                            <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-100">
                                <span className="text-sm font-bold text-slate-500 uppercase">Critério</span>
                            </div>
                            <div className="p-4 sm:p-6 bg-red-50 border-b border-slate-100 text-center">
                                <span className="text-sm font-bold text-red-600 uppercase">Atendente Humano</span>
                            </div>
                            <div className="p-4 sm:p-6 bg-emerald-50 border-b border-slate-100 text-center">
                                <span className="text-sm font-bold text-emerald-600 uppercase">IA Clonefy</span>
                            </div>

                            {/* Cost Row */}
                            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-slate-400" />
                                <span className="font-medium text-slate-900">Custo Mensal</span>
                            </div>
                            <div className="p-4 sm:p-6 border-b border-slate-100 text-center">
                                <span className="text-red-600 font-semibold">{sector.comparison.human_cost}</span>
                            </div>
                            <div className="p-4 sm:p-6 border-b border-slate-100 text-center">
                                <span className="text-emerald-600 font-bold">{sector.comparison.ai_cost}</span>
                            </div>

                            {/* Hours Row */}
                            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-slate-400" />
                                <span className="font-medium text-slate-900">Disponibilidade</span>
                            </div>
                            <div className="p-4 sm:p-6 border-b border-slate-100 text-center">
                                <span className="text-red-600">{sector.comparison.human_hours}</span>
                            </div>
                            <div className="p-4 sm:p-6 border-b border-slate-100 text-center">
                                <span className="text-emerald-600 font-semibold">{sector.comparison.ai_hours}</span>
                            </div>

                            {/* Response Row */}
                            <div className="p-4 sm:p-6 flex items-center gap-2">
                                <MessageCircle className="h-5 w-5 text-slate-400" />
                                <span className="font-medium text-slate-900">Tempo de Resposta</span>
                            </div>
                            <div className="p-4 sm:p-6 text-center">
                                <span className="text-red-600">{sector.comparison.human_response}</span>
                            </div>
                            <div className="p-4 sm:p-6 text-center">
                                <span className="text-emerald-600 font-semibold">{sector.comparison.ai_response}</span>
                            </div>
                        </div>
                    </div>

                    {/* ROI Calculation */}
                    <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white">
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Cálculo de ROI para {sector.sector}
                        </h3>
                        <p className="text-indigo-100 leading-relaxed">
                            {sector.roi_calculation}
                        </p>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="max-w-3xl mx-auto mb-20">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <Bot className="h-16 w-16 text-indigo-400 mx-auto mb-6" />
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                                Pronto para automatizar seu {sector.sector}?
                            </h2>
                            <p className="text-slate-300 mb-8 max-w-xl mx-auto">
                                Agende uma demonstração gratuita e veja a Julia atendendo clientes do seu setor em tempo real.
                            </p>
                            <Link to="/">
                                <Button size="lg" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-8 py-6 text-lg rounded-xl">
                                    {sector.cta_text}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="max-w-4xl mx-auto mb-20">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
                        Perguntas Frequentes sobre IA para {sector.sector}
                    </h2>
                    <div className="space-y-4">
                        {sector.faq.map((item, index) => (
                            <article
                                key={index}
                                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
                            >
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-semibold text-slate-900 pr-4">{item.question}</span>
                                    {expandedFaq === index ? (
                                        <ChevronUp className="h-5 w-5 text-indigo-500 shrink-0" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                                    )}
                                </button>
                                {expandedFaq === index && (
                                    <div className="px-5 pb-5 text-slate-600 leading-relaxed">
                                        {item.answer}
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            </main>

            {/* Julia Widget (Pre-configured for sector) */}
            {showWidget && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 max-w-xs mb-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center shrink-0">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-700 mb-3">
                                    {sector.widget_greeting}
                                </p>
                                <Link to="/">
                                    <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs">
                                        Testar Julia Agora
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowWidget(false)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12">
                <div className="container mx-auto px-4 text-center">
                    <LazyImage
                        src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png"
                        alt="CLONEFY Logo"
                        className="h-10 w-auto mx-auto mb-6 brightness-0 invert"
                        loading="lazy"
                    />
                    <div className="flex justify-center gap-6 flex-wrap mb-6">
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link>
                        <Link to="/ferramentas/clickgo" className="text-slate-400 hover:text-white transition-colors">ClickGo</Link>
                        <Link to="/ferramentas/gerador-link-whatsapp" className="text-slate-400 hover:text-white transition-colors">Gerador de Link</Link>
                    </div>
                    <p className="text-slate-500 text-sm">
                        © 2024 Clonefy - Funcionários de IA para WhatsApp
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default SectorIASolution;

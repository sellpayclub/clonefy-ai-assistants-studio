import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Zap, ArrowRight, Check, Phone, MessageSquare, Smartphone, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import LazyImage from "@/components/LazyImage";
import { toast } from "sonner";
import ResultPopup from "@/components/ResultPopup";
import ClonefyPromoBanner from "@/components/ClonefyPromoBanner";
import nichesData from "@/data/niches.json";

interface NicheData {
    slug: string;
    title: string;
    profession_name: string;
    pain_point: string;
    suggested_message: string;
    meta_description: string;
    faq: { question: string; answer: string }[];
}

const NicheLinkGenerator = () => {
    const { slug } = useParams<{ slug: string }>();
    const { setTheme } = useTheme();
    const [phone, setPhone] = useState("55");
    const [message, setMessage] = useState("");
    const [generatedLink, setGeneratedLink] = useState("");
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const niche = useMemo(() => {
        return (nichesData as NicheData[]).find((n) => n.slug === slug);
    }, [slug]);

    useEffect(() => {
        setTheme("light");
        if (niche) {
            setMessage(niche.suggested_message);
        }
    }, [setTheme, niche]);

    const handlePhoneChange = (value: string) => {
        let cleanValue = value.replace(/\D/g, "");
        if (!cleanValue.startsWith("55")) {
            cleanValue = "55" + cleanValue.replace(/^55/, "");
        }
        setPhone(cleanValue);
    };

    const handleGenerate = () => {
        if (!phone || phone === "55") {
            toast.error("Por favor, digite um número de telefone.");
            return;
        }
        const cleanPhone = phone.replace(/\D/g, "");
        const encodedMessage = encodeURIComponent(message);
        const link = `https://wa.me/${cleanPhone}${message ? `?text=${encodedMessage}` : ""}`;
        setGeneratedLink(link);
        setIsPopupOpen(true);
    };

    if (!niche) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">Nicho não encontrado</h1>
                    <Link to="/ferramentas/gerador-link-whatsapp">
                        <Button>Voltar ao Gerador</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // JSON-LD Schema for FAQ
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": niche.faq.map((item) => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer,
            },
        })),
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/50">
            <Helmet>
                <title>{niche.title} | Clonefy Tools</title>
                <meta name="description" content={niche.meta_description} />
                <meta name="keywords" content={`gerador link whatsapp ${niche.profession_name.toLowerCase()}, whatsapp para ${niche.profession_name.toLowerCase()}, link whatsapp ${niche.slug}`} />
                <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
            </Helmet>

            <ResultPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                title="Link Gerado com Sucesso!"
                description={`Seu link de WhatsApp para ${niche.profession_name} está pronto.`}
                resultLabel="Seu link personalizado:"
                resultValue={generatedLink}
                actionUrl={generatedLink}
                actionLabel="Testar Link"
            />

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
                        <span className="text-lg font-bold text-slate-700">Tools</span>
                    </div>
                    <Link to="/ferramentas/gerador-link-whatsapp">
                        <Button variant="ghost" size="sm" className="text-emerald-700 hover:bg-emerald-50">
                            Todas as Profissões
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 lg:py-16">
                <div className="max-w-4xl mx-auto">
                    {/* Hero */}
                    <header className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold mb-4">
                            <Zap className="h-3 w-3" />
                            FERRAMENTA ESPECIALIZADA
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
                            Gerador de Link de WhatsApp para <span className="text-emerald-600">{niche.profession_name}</span>
                        </h1>
                    </header>

                    {/* Content Section - SEO Rich */}
                    <article className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 sm:p-10 mb-12">
                        <section className="prose prose-slate max-w-none mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">
                                Por que {niche.profession_name} precisam de links personalizados de WhatsApp?
                            </h2>
                            <p className="text-slate-600 leading-relaxed text-lg">
                                {niche.pain_point}
                            </p>
                        </section>

                        {/* Generator Form */}
                        <section className="border-t border-slate-100 pt-8 space-y-6">
                            <h3 className="text-lg font-bold text-slate-900">Crie seu link agora</h3>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-emerald-600" />
                                    Seu WhatsApp
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm pointer-events-none">
                                        🇧🇷 +
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="5511999998888"
                                        value={phone}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                        className="pl-14 h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                                    Mensagem para {niche.profession_name}
                                </label>
                                <Textarea
                                    placeholder={niche.suggested_message}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="min-h-[100px] rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 resize-none p-4"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    💡 Dica: Mensagem pré-configurada para {niche.profession_name}
                                </p>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                size="lg"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-xl shadow-lg shadow-emerald-200"
                            >
                                GERAR LINK PARA {niche.profession_name.toUpperCase()}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </section>
                    </article>

                    {/* FAQ Section */}
                    <section className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 sm:p-10">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">
                            Perguntas Frequentes sobre WhatsApp para {niche.profession_name}
                        </h2>
                        <div className="space-y-4">
                            {niche.faq.map((item, index) => (
                                <div
                                    key={index}
                                    className="border border-slate-100 rounded-xl overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50"
                                    >
                                        <span className="font-medium text-slate-900">{item.question}</span>
                                        {expandedFaq === index ? (
                                            <ChevronUp className="h-5 w-5 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-slate-400" />
                                        )}
                                    </button>
                                    {expandedFaq === index && (
                                        <div className="p-4 pt-0 text-slate-600">
                                            {item.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>

            <ClonefyPromoBanner />

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12">
                <div className="container mx-auto px-4 text-center">
                    <LazyImage
                        src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png"
                        alt="CLONEFY Logo"
                        className="h-10 w-auto mx-auto mb-6 brightness-0 invert"
                        loading="lazy"
                    />
                    <div className="flex justify-center gap-6 flex-wrap">
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Clonefy</Link>
                        <Link to="/ferramentas/gerador-link-whatsapp" className="text-slate-400 hover:text-white transition-colors">Gerador de Link</Link>
                        <Link to="/ferramentas/clickgo" className="text-slate-400 hover:text-white transition-colors">ClickGo</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default NicheLinkGenerator;

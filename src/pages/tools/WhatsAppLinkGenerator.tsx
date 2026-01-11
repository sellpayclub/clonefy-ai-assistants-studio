import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Zap, ArrowRight, Check, Copy, MessageSquare, Phone, Smartphone, ExternalLink, Globe } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import LazyImage from "@/components/LazyImage";
import { Link as RouterLink } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import ClonefyPromoBanner from "@/components/ClonefyPromoBanner";

const WhatsAppLinkGenerator = () => {
    const { setTheme } = useTheme();
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [generatedLink, setGeneratedLink] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        setTheme("light");
    }, [setTheme]);

    const handleGenerate = () => {
        if (!phone) {
            toast.error("Por favor, digite um número de telefone.");
            return;
        }

        // Clean phone number (remove non-digits)
        const cleanPhone = phone.replace(/\D/g, "");
        const encodedMessage = encodeURIComponent(message);
        const link = `https://wa.me/${cleanPhone}${message ? `?text=${encodedMessage}` : ""}`;

        setGeneratedLink(link);
        toast.success("Link gerado com sucesso!");
    };

    const copyToClipboard = () => {
        if (!generatedLink) return;
        navigator.clipboard.writeText(generatedLink);
        setIsCopied(true);
        toast.success("Link copiado para a área de transferência!");
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/50">
            <Helmet>
                <title>Gerador de Link de WhatsApp Grátis - Clonefy Tools</title>
                <meta name="description" content="Crie links personalizados para o seu WhatsApp com mensagens pré-definidas de forma gratuita. Melhore sua conversão e facilite o contato dos seus clientes." />
                <meta name="keywords" content="gerador link whatsapp, criar link whatsapp, link direto whatsapp, whatsapp message generator, clonefy" />
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
                    <RouterLink to="/ferramentas/clickgo">
                        <Button variant="ghost" size="sm" className="text-emerald-700 hover:bg-emerald-50">
                            Conheça o ClickGo
                        </Button>
                    </RouterLink>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 lg:py-20">
                <div className="max-w-5xl mx-auto">
                    {/* Hero Header */}
                    <div className="text-center mb-12 sm:mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold mb-4">
                            <Zap className="h-3 w-3" />
                            FERRAMENTA GRATUITA
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
                            Gerador de Link de <span className="text-emerald-600">WhatsApp</span>
                        </h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Crie links personalizados com mensagens prontas em segundos.
                            Facilite o contato dos seus clientes e aumente suas vendas!
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Form Section */}
                        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-10 space-y-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-emerald-600" />
                                    Número do WhatsApp
                                </label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="Ex: 5511999998888"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="pl-4 h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
                                        Inclua o código do país e DDD (apenas números).
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                                    Mensagem Personalizada
                                </label>
                                <Textarea
                                    placeholder="Olá! Gostaria de mais informações sobre..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="min-h-[120px] rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 resize-none p-4"
                                />
                            </div>

                            <Button
                                onClick={handleGenerate}
                                size="lg"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-xl shadow-lg shadow-emerald-200 transition-all transform active:scale-95"
                            >
                                GERAR LINK AGORA
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>

                            {generatedLink && (
                                <div className="pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Seu link gerado:</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 truncate font-mono">
                                            {generatedLink}
                                        </div>
                                        <Button
                                            onClick={copyToClipboard}
                                            variant="outline"
                                            className={`shrink-0 rounded-xl px-4 border-slate-200 hover:bg-slate-50 ${isCopied ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : ''}`}
                                        >
                                            {isCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                        </Button>
                                    </div>
                                    <div className="mt-4 flex gap-3">
                                        <a
                                            href={generatedLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1"
                                        >
                                            <Button variant="ghost" className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl gap-2 font-semibold">
                                                Testar Link <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Preview Section */}
                        <div className="lg:sticky lg:top-8 flex flex-col items-center">
                            <p className="text-slate-500 text-sm font-medium mb-4 flex items-center gap-2">
                                <Smartphone className="h-4 w-4" />
                                Pré-visualização do chat
                            </p>

                            <div className="relative w-[280px] sm:w-[320px] h-[550px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden p-1">
                                {/* Mobile Screen Shell */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>

                                <div className="h-full w-full bg-[#E5DDD5] overflow-hidden flex flex-col pt-6">
                                    {/* WhatsApp Header Simulation */}
                                    <div className="bg-[#075E54] p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center text-slate-400">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white text-xs font-bold truncate">
                                                {phone || "Seu Número"}
                                            </p>
                                            <p className="text-white/70 text-[10px]">visto por último hoje às 09:00</p>
                                        </div>
                                    </div>

                                    {/* Chat Content */}
                                    <div className="flex-1 p-4 flex flex-col justify-end pb-8">
                                        {message ? (
                                            <div className="bg-emerald-100 p-3 rounded-lg rounded-tr-none shadow-sm relative animate-in zoom-in-50 duration-300 self-end max-w-[85%]">
                                                <p className="text-xs text-slate-800 whitespace-pre-wrap">{message}</p>
                                                <span className="text-[10px] text-slate-500 block text-right mt-1">09:01 ✓✓</span>
                                                <div className="absolute -right-2 top-0 w-0 h-0 border-l-[10px] border-l-emerald-100 border-b-[10px] border-b-transparent"></div>
                                            </div>
                                        ) : (
                                            <div className="text-center italic text-slate-400 text-sm mb-4">
                                                Aguardando sua mensagem...
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Input Simulation */}
                                    <div className="bg-[#f0f2f5] p-2 flex items-center gap-2">
                                        <div className="flex-1 h-8 bg-white rounded-full"></div>
                                        <div className="w-8 h-8 bg-[#075E54] rounded-full flex items-center justify-center">
                                            <ArrowRight className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-6 text-slate-400 text-xs text-center max-w-[280px]">
                                É assim que seus usuários verão a mensagem quando clicarem no seu link.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* SEO Content Section */}
            <section className="bg-white py-16 sm:py-24 mt-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 border-l-4 border-emerald-500 pl-4">
                        Por que usar um Gerador de Link do WhatsApp?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-600 leading-relaxed">
                        <div className="space-y-4">
                            <p>
                                O link direto do WhatsApp (também conhecido como "wa.me") permite que seus clientes iniciem uma conversa com você com apenas um clique, sem precisar salvar seu número na agenda primeiro.
                            </p>
                            <p>
                                Com a mensagem pré-configurada, você já recebe o contato sabendo do que ele precisa, economizando tempo e profissionalizando seu atendimento.
                            </p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Globe className="h-4 w-4 text-emerald-600" />
                                Dicas de Conversão:
                            </h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex gap-2">
                                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                    Use em botões de "Saiba Mais" na sua Landing Page.
                                </li>
                                <li className="flex gap-2">
                                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                    Adicione o link na sua Bio do Instagram.
                                </li>
                                <li className="flex gap-2">
                                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                    Crie mensagens diferentes para cada produto.
                                </li>
                                <li className="flex gap-2">
                                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                    Encurte seu link para usar em anúncios.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

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
                    <p className="text-slate-400 text-sm mb-6">
                        Uma ferramenta cortesia da Clonefy - Inteligência Artificial para Atendimento.
                    </p>
                    <div className="flex justify-center gap-6">
                        <RouterLink to="/" className="text-slate-400 hover:text-white transition-colors">Clonefy</RouterLink>
                        <RouterLink to="/ferramentas/clickgo" className="text-slate-400 hover:text-white transition-colors">ClickGo</RouterLink>
                        <RouterLink to="/auth" className="text-slate-400 hover:text-white transition-colors">Entrar</RouterLink>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default WhatsAppLinkGenerator;

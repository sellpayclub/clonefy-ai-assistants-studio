import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Check, Smartphone, Code, Sparkles } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import LazyImage from "@/components/LazyImage";
import { Link as RouterLink } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import ClonefyPromoBanner from "@/components/ClonefyPromoBanner";
import ResultPopup from "@/components/ResultPopup";

const WhatsAppWidgetGenerator = () => {
    const { setTheme } = useTheme();
    const [phone, setPhone] = useState("55");
    const [message, setMessage] = useState("");
    const [btnText, setBtnText] = useState("Fale Conosco");
    const [btnColor, setBtnColor] = useState("#25D366");
    const [generatedCode, setGeneratedCode] = useState("");
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    useEffect(() => {
        setTheme("light");
    }, [setTheme]);

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

        const snippet = `<!-- WhatsApp Widget by Clonefy -->
<div id="wa-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
  <a href="https://wa.me/${cleanPhone}?text=${encodedMessage}" target="_blank" style="background-color: ${btnColor}; color: white; padding: 12px 20px; border-radius: 50px; text-decoration: none; font-family: sans-serif; font-weight: bold; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); transition: transform 0.3s ease;">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"></path></svg>
    ${btnText}
  </a>
</div>`;

        setGeneratedCode(snippet);
        setIsPopupOpen(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/50">
            <Helmet>
                <title>Gerador de Botão de WhatsApp para Site (Widget Grátis) - Clonefy</title>
                <meta name="description" content="Crie um botão flutuante do WhatsApp para o seu site em segundos. Ferramenta gratuita para aumentar conversões e facilitar o atendimento ao cliente." />
                <meta name="keywords" content="gerador de botão whatsapp, widget whatsapp site, botão whatsapp flutuante, whatsapp button generator, clonefy" />
            </Helmet>

            {/* Result Popup with Clonefy Banner */}
            <ResultPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                title="Widget Gerado com Sucesso!"
                description="Cole o código abaixo antes da tag </body> do seu site."
                resultLabel="Código HTML do Widget:"
                resultValue={generatedCode}
            />

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
                        <RouterLink to="/ferramentas/gerador-link-whatsapp" className="text-sm text-slate-500 hover:text-emerald-600 font-medium">Gerador de Link</RouterLink>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 lg:py-16">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-4">
                            <Sparkles className="h-3 w-3" />
                            NOVA FERRAMENTA
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
                            Gerador de Botão de <span className="text-emerald-600">WhatsApp para Sites</span>
                        </h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Adicione um widget flutuante profissional ao seu site e receba leads diretamente no seu celular. Simples, rápido e 100% gratuito.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form Section */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Seu WhatsApp</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm pointer-events-none">
                                                🇧🇷 +
                                            </div>
                                            <Input
                                                placeholder="5511999998888"
                                                value={phone}
                                                onChange={(e) => handlePhoneChange(e.target.value)}
                                                className="pl-12 rounded-xl border-slate-200 font-mono"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1 ml-1">O código 55 já está incluído.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Texto do Botão</label>
                                        <Input
                                            placeholder="Ex: Fale Conosco"
                                            value={btnText}
                                            onChange={(e) => setBtnText(e.target.value)}
                                            className="rounded-xl border-slate-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Mensagem Inicial (Opcional)</label>
                                    <Textarea
                                        placeholder="Olá! Vi seu site e gostaria de..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="rounded-xl border-slate-200 min-h-[100px]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Cor do Botão</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="color"
                                            value={btnColor}
                                            onChange={(e) => setBtnColor(e.target.value)}
                                            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-100"
                                        />
                                        <Input
                                            value={btnColor}
                                            onChange={(e) => setBtnColor(e.target.value)}
                                            className="font-mono rounded-xl border-slate-200"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-xl shadow-lg"
                                >
                                    GERAR CÓDIGO DO WIDGET
                                    <Code className="ml-2 h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 h-full flex flex-col">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Smartphone className="h-5 w-5 text-emerald-600" />
                                    Como ficará no seu site
                                </h3>

                                <div className="flex-1 bg-slate-100 rounded-2xl relative overflow-hidden border border-slate-200 min-h-[300px]">
                                    <div className="absolute top-4 left-4 right-4 h-4 bg-white/50 rounded-full"></div>
                                    <div className="absolute top-12 left-4 w-1/2 h-24 bg-white/50 rounded-xl"></div>
                                    <div className="absolute top-40 left-4 right-4 space-y-2">
                                        <div className="h-3 bg-white/50 rounded-full w-full"></div>
                                        <div className="h-3 bg-white/50 rounded-full w-5/6"></div>
                                        <div className="h-3 bg-white/50 rounded-full w-4/6"></div>
                                    </div>

                                    {/* The Widget Preview */}
                                    <div className="absolute bottom-6 right-6 pointer-events-none">
                                        <div
                                            style={{ backgroundColor: btnColor }}
                                            className="px-4 py-3 rounded-full text-white text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"></path></svg>
                                            {btnText}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Check className="h-4 w-4 text-emerald-500" />
                                        Adaptável a qualquer site
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Check className="h-4 w-4 text-emerald-500" />
                                        Responsivo para mobile
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <ClonefyPromoBanner />

            {/* Footer */}
            <footer className="bg-white border-t py-12">
                <div className="container mx-auto px-4 text-center">
                    <LazyImage
                        src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png"
                        alt="CLONEFY Logo"
                        className="h-10 w-auto mx-auto mb-6"
                        loading="lazy"
                    />
                    <div className="flex justify-center gap-8 mb-8">
                        <RouterLink to="/" className="text-slate-500 hover:text-emerald-600 font-medium">Home</RouterLink>
                        <RouterLink to="/ferramentas/clickgo" className="text-slate-500 hover:text-emerald-600 font-medium">ClickGo</RouterLink>
                        <RouterLink to="/ferramentas/gerador-link-whatsapp" className="text-slate-500 hover:text-emerald-600 font-medium">Gerador de Link</RouterLink>
                    </div>
                    <p className="text-slate-400 text-sm">© 2024 Clonefy Tools - Aumente sua conversão com IA.</p>
                </div>
            </footer>
        </div>
    );
};

export default WhatsAppWidgetGenerator;

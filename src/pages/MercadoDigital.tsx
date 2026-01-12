import { Button } from "@/components/ui/button";
import { Bot, Clock, Globe, Smartphone, MessageSquare, Zap, ArrowRight, Check, Mic, Volume2, Image, Sparkles, Code, Calculator, Crown, Infinity, Users, Shield, Eye, HelpCircle, ChevronDown, XCircle, TrendingUp, DollarSign, Target, Flame, Lock, Rocket, BrainCircuit } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import LazyImage from "@/components/LazyImage";

const MercadoDigital = () => {
    const { setTheme } = useTheme();
    const [chatLoaded, setChatLoaded] = useState(false);

    const CHAT_ASSISTANT_ID = "aeb677ad-3f58-4ecd-b414-79c1aa534d13";

    const scrollToPlanos = (e: React.MouseEvent) => {
        e.preventDefault();
        document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        setTheme("light");

        // Facebook Pixel
        const script = document.createElement('script');
        script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      
      fbq('init', '768462872382350');
      fbq('track', 'PageView');
    `;
        document.head.appendChild(script);
    }, [setTheme]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/50">
            {/* Header */}
            <header className="container mx-auto px-4 py-4 lg:py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <LazyImage
                            src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png"
                            alt="CLONEFY Logo"
                            className="h-14 w-auto sm:h-16 lg:h-20"
                            loading="eager"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/auth">
                            <Button variant="outline" size="sm" className="text-xs sm:text-sm border-emerald-200 hover:bg-emerald-50 px-2 sm:px-3">
                                Entrar
                            </Button>
                        </Link>
                        <a href="#planos" onClick={scrollToPlanos}>
                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-xs sm:text-sm px-2 sm:px-4"
                            >
                                <span className="hidden sm:inline">Quero Vender no X1</span>
                                <span className="sm:hidden">Ver Planos</span>
                            </Button>
                        </a>
                    </div>
                </div>
            </header>

            {/* Hero Section - AGGRESSIVE COPY */}
            <section className="container mx-auto px-4 py-8 sm:py-10 lg:py-14">
                <div className="max-w-5xl mx-auto text-center">
                    {/* Badge */}
                    <div className="mb-5">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                            <Zap className="h-4 w-4" />
                            🔥 O Segredo dos Top Afiliados que Faturam Alto
                        </span>
                    </div>

                    {/* Main Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight text-slate-900">
                        Venda{" "}
                        <span className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                            Encapsulados e Infoprodutos
                        </span>
                        <br />
                        no X1 <span className="text-emerald-600">sem trabalhar o dia todo!</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 mb-6 max-w-4xl mx-auto leading-relaxed">
                        Enquanto você <strong className="text-slate-800">dorme, viaja ou descansa</strong>, sua IA está lá no WhatsApp{" "}
                        <strong className="text-emerald-600">respondendo, quebrando objeções e fechando vendas</strong> no X1 por você.
                    </p>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 max-w-4xl mx-auto">
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-emerald-100">
                            <DollarSign className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-700">Venda 24/7</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-emerald-100">
                            <Bot className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-700">100% Automático</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-emerald-100">
                            <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-700">Anti-Bloqueio</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-emerald-100">
                            <BrainCircuit className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-700">IA que Pensa</span>
                        </div>
                    </div>

                    {/* Highlight Box */}
                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-5 sm:p-6 mb-8 max-w-3xl mx-auto shadow-xl">
                        <p className="text-white text-lg sm:text-xl font-semibold leading-relaxed">
                            💰 Imagine acordar todo dia com <span className="underline decoration-2 underline-offset-4">notificações de vendas</span> que{" "}
                            <span className="text-yellow-300 font-bold">você nem precisou fazer!</span>
                        </p>
                    </div>

                    {/* CTA Button */}
                    <a href="#planos" onClick={scrollToPlanos} className="block w-full sm:w-auto sm:inline-block">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                            <span className="hidden sm:inline">QUERO VENDER NO AUTOMÁTICO!</span>
                            <span className="sm:hidden">QUERO ISSO!</span>
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </a>
                </div>
            </section>

            {/* Problem Section - PAIN POINTS */}
            <section className="py-10 sm:py-14 bg-slate-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        {/* Title */}
                        <div className="text-center mb-8">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-full text-sm font-medium mb-4">
                                <XCircle className="h-4 w-4" />
                                Você está PERDENDO dinheiro se...
                            </span>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
                                Cansou de <span className="text-red-500">ficar o dia todo no WhatsApp?</span>
                            </h2>
                        </div>

                        {/* Pain Points Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-bold mb-1">Extensões de Chrome "automáticas"</h3>
                                    <p className="text-slate-600 text-sm">Você ainda precisa clicar em "enviar" o dia todo. Isso NÃO é automação!</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-bold mb-1">Bots quadrados e genéricos</h3>
                                    <p className="text-slate-600 text-sm">Respostas robóticas que espantam clientes e não quebram objeções.</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-bold mb-1">Número bloqueado toda semana</h3>
                                    <p className="text-slate-600 text-sm">Automações amadoras que o WhatsApp detecta e bane seu número.</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-bold mb-1">Leads esfriando na sua lista</h3>
                                    <p className="text-slate-600 text-sm">Você demora pra responder e perde a venda pro concorrente.</p>
                                </div>
                            </div>
                        </div>

                        {/* Transition */}
                        <div className="text-center">
                            <p className="text-xl text-slate-600 mb-4">
                                E se existisse uma <strong className="text-emerald-600">IA que vende POR você</strong> no X1...
                            </p>
                            <p className="text-2xl font-bold text-emerald-600">
                                ...sem você precisar digitar UMA mensagem?
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solution Section - AI CAPABILITIES */}
            <section className="py-10 sm:py-14 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        {/* Title */}
                        <div className="text-center mb-8">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                                <Rocket className="h-4 w-4" />
                                A Arma Secreta dos Top Afiliados
                            </span>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
                                Uma IA que <span className="text-emerald-600">VENDE</span> igual você (ou melhor!)
                            </h2>
                            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                                Treine ela com seu script, seu jeito de falar, e deixe ela fazer o trabalho pesado
                            </p>
                        </div>

                        {/* Capabilities Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {/* Entende Contexto */}
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4 sm:p-6 text-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                                    <BrainCircuit className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-sm sm:text-lg mb-1 sm:mb-2">Entende Contexto</h3>
                                <p className="text-slate-600 text-xs sm:text-sm">
                                    Não é bot quadrado. Ela pensa e adapta a resposta pro cliente.
                                </p>
                            </div>

                            {/* Segue Seu Script */}
                            <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-4 sm:p-6 text-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                                    <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-sm sm:text-lg mb-1 sm:mb-2">Segue Seu Script</h3>
                                <p className="text-slate-600 text-xs sm:text-sm">
                                    Personalize o script de vendas e ela segue à risca.
                                </p>
                            </div>

                            {/* Quebra Objeções */}
                            <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 sm:p-6 text-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                                    <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-sm sm:text-lg mb-1 sm:mb-2">Quebra Objeções</h3>
                                <p className="text-slate-600 text-xs sm:text-sm">
                                    "Tá caro", "Vou pensar"... ela sabe contornar tudo!
                                </p>
                            </div>

                            {/* Anti-Bloqueio */}
                            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-4 sm:p-6 text-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-sm sm:text-lg mb-1 sm:mb-2">Anti-Bloqueio</h3>
                                <p className="text-slate-600 text-xs sm:text-sm">
                                    Tecnologia que protege seu número de ser banido.
                                </p>
                            </div>

                            {/* Escuta Áudio */}
                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 sm:p-6 text-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                                    <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-sm sm:text-lg mb-1 sm:mb-2">Escuta Áudios</h3>
                                <p className="text-slate-600 text-xs sm:text-sm">
                                    Cliente mandou áudio? Ela escuta e responde!
                                </p>
                            </div>

                            {/* Follow-up Automático */}
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4 sm:p-6 text-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                                    <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-sm sm:text-lg mb-1 sm:mb-2">Follow-up Automático</h3>
                                <p className="text-slate-600 text-xs sm:text-sm">
                                    Sumiu? Ela manda mensagem pra resgatar o lead!
                                </p>
                            </div>

                            {/* CRM Inteligente */}
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-4 sm:p-6 text-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-sm sm:text-lg mb-1 sm:mb-2">CRM com LeadScore</h3>
                                <p className="text-slate-600 text-xs sm:text-sm">
                                    Saiba quem são seus leads quentes em tempo real.
                                </p>
                            </div>

                            {/* Envia Mídia */}
                            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 sm:p-6 text-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                                    <Image className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-sm sm:text-lg mb-1 sm:mb-2">Envia Mídias</h3>
                                <p className="text-slate-600 text-xs sm:text-sm">
                                    Fotos do produto, vídeo de depoimento, PDF... ela manda!
                                </p>
                            </div>
                        </div>

                        {/* Extra highlight */}
                        <div className="mt-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-5 sm:p-6 text-center">
                            <p className="text-white text-base sm:text-xl font-semibold">
                                🚀 <span className="text-slate-900 font-bold">RESULTADO:</span> Você acorda com vendas que NEM PRECISOU FAZER!
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison Section */}
            <section className="py-10 sm:py-14 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                                CLONEFY vs <span className="text-red-400">Automações Comuns</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Automações Comuns */}
                            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                                <h3 className="text-red-400 font-bold text-xl mb-4 flex items-center gap-2">
                                    <XCircle className="w-6 h-6" />
                                    Automações Comuns
                                </h3>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-slate-400">
                                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                        <span>Extensões de Chrome que você precisa clicar</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-400">
                                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                        <span>Bots com respostas robóticas e genéricas</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-400">
                                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                        <span>Número bloqueado frequentemente</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-400">
                                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                        <span>Não entende áudio nem contexto</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-400">
                                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                        <span>Você precisa ficar online pra funcionar</span>
                                    </li>
                                </ul>
                            </div>

                            {/* CLONEFY */}
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
                                <h3 className="text-emerald-400 font-bold text-xl mb-4 flex items-center gap-2">
                                    <Check className="w-6 h-6" />
                                    CLONEFY IA
                                </h3>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <span>100% automático, 0 cliques necessários</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <span>IA que pensa, entende contexto e converte</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <span>Tecnologia anti-bloqueio avançada</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <span>Escuta e responde áudios nativamente</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <span>Funciona 24/7 mesmo com celular desligado</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Chat Demo Section */}
            <section className="container mx-auto px-4 py-10 sm:py-12">
                <div className="max-w-2xl mx-auto">
                    {/* Section Title */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 mb-3">
                            <MessageSquare className="h-5 w-5 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold text-sm">Teste ao vivo</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
                            Veja como ela <span className="text-emerald-600">conversa e vende:</span>
                        </h2>
                        <p className="text-slate-600 text-base">
                            Mande uma mensagem e veja a mágica acontecer!
                        </p>
                    </div>

                    {/* Embedded Chat */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-200 relative">
                        {/* Loading Skeleton */}
                        {!chatLoaded && (
                            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-10">
                                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                                <p className="text-slate-500 text-sm">Carregando IA...</p>
                            </div>
                        )}
                        <iframe
                            src={`/embed-chat/${CHAT_ASSISTANT_ID}`}
                            className="w-full"
                            style={{
                                height: '480px',
                                border: 'none',
                                opacity: chatLoaded ? 1 : 0,
                                transition: 'opacity 0.3s ease-in-out'
                            }}
                            title="Chat com IA CLONEFY"
                            allow="microphone"
                            onLoad={() => setChatLoaded(true)}
                        />
                    </div>

                    {/* CTA After Chat */}
                    <div className="text-center mt-8">
                        <p className="text-slate-600 mb-4 text-base">
                            Imagina essa IA vendendo <strong className="text-emerald-600">seu produto</strong> 24 horas por dia?
                        </p>
                        <a href="#planos" onClick={scrollToPlanos} className="block w-full sm:w-auto sm:inline-block">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 sm:px-8 py-5 text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <span className="hidden sm:inline">QUERO VENDER NO AUTOMÁTICO!</span>
                                <span className="sm:hidden">QUERO ISSO!</span>
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </a>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="planos" className="py-12 sm:py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        {/* Title */}
                        <div className="text-center mb-10">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-4">
                                <Sparkles className="h-4 w-4" />
                                Planos e Preços
                            </span>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                                Escolha seu <span className="text-emerald-400">Plano de Vendas</span>
                            </h2>
                            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                                Quanto você perde por mês deixando leads esfriar? Pague menos que uma pizza e venda no automático!
                            </p>
                        </div>

                        {/* Pricing Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Plan 1 - Starter */}
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300">
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-white mb-2">Iniciante X1</h3>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-bold text-emerald-400">R$ 47</span>
                                        <span className="text-slate-400">/mês</span>
                                    </div>
                                </div>
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span><strong className="text-white">1</strong> Vendedor IA</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span><strong className="text-white">1</strong> WhatsApp conectado</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Mensagens <strong className="text-white">ilimitadas</strong></span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Leads <strong className="text-white">ilimitados</strong></span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Mic className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Escuta e entende áudios</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Eye className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Vê imagens e documentos</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Shield className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Anti-bloqueio WhatsApp</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Clock className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Funciona 24h (cel desligado)</span>
                                    </li>
                                </ul>
                                <a href="https://pay.kiwify.com.br/rImx3dy" target="_blank" rel="noopener noreferrer">
                                    <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 py-5 font-bold">
                                        Começar a Vender
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </a>
                            </div>

                            {/* Plan 2 - Pro (Highlighted) */}
                            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-sm border-2 border-yellow-500 rounded-2xl p-6 relative transform md:-translate-y-4 shadow-2xl shadow-yellow-500/20">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                        <Crown className="w-4 h-4" />
                                        MAIS VENDIDO
                                    </span>
                                </div>
                                <div className="text-center mb-6 mt-2">
                                    <h3 className="text-xl font-bold text-white mb-2">Afiliado Pro</h3>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-bold text-yellow-400">R$ 97</span>
                                        <span className="text-slate-400">/mês</span>
                                    </div>
                                </div>
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-yellow-400" />
                                        </div>
                                        <span><strong className="text-white">3</strong> Vendedores IA</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-yellow-400" />
                                        </div>
                                        <span><strong className="text-white">3</strong> WhatsApps conectados</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-yellow-400" />
                                        </div>
                                        <span>Mensagens <strong className="text-white">ilimitadas</strong></span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-yellow-400" />
                                        </div>
                                        <span>Leads <strong className="text-white">ilimitados</strong></span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
                                            <Mic className="w-3 h-3 text-yellow-400" />
                                        </div>
                                        <span>Escuta e entende áudios</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
                                            <Eye className="w-3 h-3 text-yellow-400" />
                                        </div>
                                        <span>Vê imagens e documentos</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
                                            <Shield className="w-3 h-3 text-yellow-400" />
                                        </div>
                                        <span>Anti-bloqueio WhatsApp</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
                                            <Zap className="w-3 h-3 text-yellow-400" />
                                        </div>
                                        <span>Follow-up Automático IA</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
                                            <Users className="w-3 h-3 text-yellow-400" />
                                        </div>
                                        <span>CRM LeadScore Inteligente</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
                                            <Image className="w-3 h-3 text-yellow-400" />
                                        </div>
                                        <span>Envio de fotos/vídeos/PDFs</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-yellow-400 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
                                            <Code className="w-3 h-3 text-yellow-400" />
                                        </div>
                                        <span>Embed IA no seu site</span>
                                    </li>
                                </ul>
                                <a href="https://pay.kiwify.com.br/Z17cId5" target="_blank" rel="noopener noreferrer">
                                    <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white py-5 font-bold shadow-lg">
                                        Quero Vender Mais
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </a>
                            </div>

                            {/* Plan 3 - Enterprise */}
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300">
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-white mb-2">Escala Ilimitada</h3>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-bold text-emerald-400">R$ 197</span>
                                        <span className="text-slate-400">/mês</span>
                                    </div>
                                </div>
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-center gap-3 text-emerald-400 font-bold">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Infinity className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Vendedores IA <strong>ilimitados</strong></span>
                                    </li>
                                    <li className="flex items-center gap-3 text-emerald-400 font-bold">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Infinity className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>WhatsApps <strong>ilimitados</strong></span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Mensagens <strong className="text-white">ilimitadas</strong></span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Leads <strong className="text-white">ilimitados</strong></span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Mic className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Escuta e entende áudios</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Eye className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Vê imagens e documentos</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Shield className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Anti-bloqueio WhatsApp</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Clock className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Funciona 24h (cel desligado)</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Zap className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Follow-up Automático IA</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Users className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>CRM LeadScore Inteligente</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Image className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Envio de fotos/vídeos/PDFs</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Code className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Embed IA no seu site</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-emerald-400 font-bold">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <Rocket className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>Múltiplos produtos/nichos</span>
                                    </li>
                                </ul>
                                <a href="https://pay.kiwify.com.br/MvFo5AL" target="_blank" rel="noopener noreferrer">
                                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-5 font-bold shadow-lg">
                                        Escalar Agora
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </a>
                            </div>
                        </div>

                        {/* Guarantee */}
                        <div className="text-center mt-10">
                            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-6 py-3">
                                <span className="text-2xl">🔒</span>
                                <span className="text-yellow-400 font-medium">Garantia de 7 dias. Não vendeu? Devolvemos seu dinheiro!</span>
                            </div>
                        </div>
                    </div>
                </div >
            </section >

            {/* FAQ Section */}
            < section className="py-12 sm:py-16 bg-white" >
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        {/* Title */}
                        <div className="text-center mb-10">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                                <HelpCircle className="h-4 w-4" />
                                Perguntas Frequentes
                            </span>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
                                Tire suas <span className="text-emerald-600">dúvidas</span>
                            </h2>
                        </div>

                        {/* FAQ Items */}
                        <div className="space-y-4">
                            <details className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                                    <span className="font-semibold text-slate-900">Funciona pra vender encapsulado/infoproduto?</span>
                                    <ChevronDown className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-5 pb-5 text-slate-600">
                                    Sim! A IA é treinada especificamente pro seu produto. Ela aprende seu script de vendas, conhece as objeções comuns do seu nicho e sabe como quebrar todas elas. Funciona pra qualquer produto digital ou físico.
                                </div>
                            </details>

                            <details className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                                    <span className="font-semibold text-slate-900">E se meu número for bloqueado?</span>
                                    <ChevronDown className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-5 pb-5 text-slate-600">
                                    Usamos tecnologia anti-bloqueio que simula comportamento humano natural. Diferente de extensões e bots comuns, nossa IA não dispara mensagens em massa - ela conversa de verdade, o que reduz drasticamente o risco de bloqueio.
                                </div>
                            </details>

                            <details className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                                    <span className="font-semibold text-slate-900">Funciona com celular desligado?</span>
                                    <ChevronDown className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-5 pb-5 text-slate-600">
                                    Sim! A IA roda nos nossos servidores na nuvem. Você pode desligar o celular, viajar, dormir... ela continua vendendo 24 horas por dia, 7 dias por semana. Você acorda com vendas que nem precisou fazer!
                                </div>
                            </details>

                            <details className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                                    <span className="font-semibold text-slate-900">É diferente de extensão de Chrome?</span>
                                    <ChevronDown className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-5 pb-5 text-slate-600">
                                    Totalmente! Extensões de Chrome precisam que você fique clicando em "enviar" o dia todo. Isso NÃO é automação de verdade. Nossa IA funciona 100% sozinha, pensa antes de responder e adapta as respostas pro contexto da conversa.
                                </div>
                            </details>

                            <details className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                                    <span className="font-semibold text-slate-900">Quanto tempo pra configurar?</span>
                                    <ChevronDown className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-5 pb-5 text-slate-600">
                                    Menos de 10 minutos! Você cria sua conta, cola seu script de vendas, conecta seu WhatsApp via QR Code e pronto. Sua IA já começa a vender no mesmo dia.
                                </div>
                            </details>

                            <details className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                                    <span className="font-semibold text-slate-900">Posso testar antes de pagar?</span>
                                    <ChevronDown className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-5 pb-5 text-slate-600">
                                    Oferecemos garantia de 7 dias! Se você não gostar ou não vender, devolvemos 100% do seu dinheiro. Risco zero pra você testar.
                                </div>
                            </details>
                        </div>

                        {/* CTA */}
                        <div className="text-center mt-10">
                            <p className="text-slate-600 mb-4">Pronto pra vender no automático?</p>
                            <a href="#planos" onClick={scrollToPlanos}>
                                <Button className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-8 py-5 font-bold rounded-xl">
                                    Quero Começar Agora
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </section >

            {/* Footer */}
            < footer className="border-t border-slate-700 bg-slate-900 pt-12 pb-8" >
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* Logo and About */}
                        <div className="flex flex-col items-center md:items-start">
                            <LazyImage
                                src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png"
                                alt="CLONEFY Logo"
                                className="h-12 w-auto mb-4"
                                loading="lazy"
                            />
                            <p className="text-slate-400 text-sm text-center md:text-left max-w-xs">
                                A arma secreta dos top afiliados para vender no X1 no automático, 24 horas por dia.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div className="flex flex-col items-center md:items-start">
                            <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-wider">Ferramentas Gratuitas</h4>
                            <nav className="flex flex-col gap-2">
                                <a href="https://clickgo-redirec-wpp.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-2">
                                    <Zap className="h-4 w-4" />
                                    ClickGo - Redirecionador de WhatsApp
                                </a>
                                <Link to="/ferramentas/gerador-link-whatsapp" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Gerador de Link de WhatsApp
                                </Link>
                                <Link to="/ferramentas/calculadora-roi-whatsapp" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-2">
                                    <Calculator className="h-4 w-4" />
                                    Calculadora de ROI WhatsApp
                                </Link>
                                <Link to="/auth" className="text-slate-400 hover:text-emerald-400 text-sm">Acessar Painel</Link>
                            </nav>
                        </div>

                        {/* Institutional */}
                        <div className="flex flex-col items-center md:items-start">
                            <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-wider">Institucional</h4>
                            <nav className="flex flex-col gap-2">
                                <a href="#planos" onClick={scrollToPlanos} className="text-slate-400 hover:text-emerald-400 text-sm">Ver Planos</a>
                                <Link to="/" className="text-slate-400 hover:text-emerald-400 text-sm">Página Principal</Link>
                                <Link to="#" className="text-slate-400 hover:text-emerald-400 text-sm">Política de Privacidade</Link>
                                <Link to="#" className="text-slate-400 hover:text-emerald-400 text-sm">Termos de Uso</Link>
                            </nav>
                        </div>
                    </div>

                    <div className="border-t border-slate-700 pt-8">
                        <p className="text-center text-slate-500 text-xs">
                            © 2024 CLONEFY - Todos os direitos reservados. IA para Afiliados e Mercado Digital.
                        </p>
                    </div>
                </div>
            </footer >
        </div >
    );
};

export default MercadoDigital;

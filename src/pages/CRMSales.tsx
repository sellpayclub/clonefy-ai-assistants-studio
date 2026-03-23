import { Button } from "@/components/ui/button";
import {
    Bot, Clock, Smartphone, MessageSquare, Zap, ArrowRight, Check, Mic,
    Volume2, Image, Sparkles, Target, Flame, Lock, Rocket, BrainCircuit,
    XCircle, TrendingUp, DollarSign, Shield, Users, BarChart3, Database,
    MessageCircle, Gift, Infinity, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import LazyImage from "@/components/LazyImage";

declare const fbq: any;

const CRMSales = () => {
    const { setTheme } = useTheme();

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

        // SmartPlayer ConverteAI
        if (!document.getElementById("converteai-script")) {
            const smartplayerScript = document.createElement("script");
            smartplayerScript.id = "converteai-script";
            smartplayerScript.src = "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js";
            smartplayerScript.async = true;
            document.head.appendChild(smartplayerScript);
        }
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
                                <span className="hidden sm:inline">Começar Teste Grátis</span>
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
                            <TrendingUp className="h-4 w-4" />
                            Chega de Deixar Dinheiro na Mesa
                        </span>
                    </div>

                    {/* Main Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight text-slate-900">
                        O CRM Inteligente que Encontra e Recupera<br />
                        <span className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                            Dinheiro Escondido nas Suas Conversas.
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 mb-6 max-w-4xl mx-auto leading-relaxed">
                        Esqueça planilhas caóticas e softwares difíceis de usar. Assuma o <strong className="text-slate-800">controle da sua operação</strong> com um sistema projetado para acabar com o vazamento de lucros por falha de <i>follow-up</i> ou desorganização.
                    </p>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 max-w-4xl mx-auto">
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-emerald-100">
                            <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-700">Controle Total</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-emerald-100">
                            <TrendingUp className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-700">Previsibilidade</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-emerald-100">
                            <Bot className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-700">IA 24/7 Organiza Tudo</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-emerald-100">
                            <Database className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-700">Adeus Planilhas</span>
                        </div>
                    </div>

                    {/* Highlight Box */}
                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-5 sm:p-6 mb-8 max-w-3xl mx-auto shadow-xl">
                        <p className="text-white text-lg sm:text-xl font-semibold leading-relaxed">
                            💰 O Único CRM com Inteligência Artificial que <span className="underline decoration-2 underline-offset-4">trabalha por você</span> de verdade.
                        </p>
                    </div>

                    {/* CTA Button */}
                    <a href="#planos" onClick={scrollToPlanos} className="block w-full sm:w-auto sm:inline-block">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                            <span className="hidden sm:inline">QUERO PARAR DE PERDER VENDAS</span>
                            <span className="sm:hidden">PARAR DE PERDER VENDAS</span>
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
                                Onde seu dinheiro está vazando agora mesmo
                            </span>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
                                Você se identifica com <span className="text-red-500">algum desses problemas?</span>
                            </h2>
                        </div>

                        {/* Pain Points Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-bold mb-1">O Lead Esfria na Fila de Espera</h3>
                                    <p className="text-slate-600 text-sm">Aquele lead entra quente, pronto para comprar. Sua equipe demora para responder e ele fecha com o concorrente.</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-bold mb-1">Refém da Equipe de Vendas</h3>
                                    <p className="text-slate-600 text-sm">Seu vendedor sai da empresa e o ativo mais valioso vai embora com ele: os contatos salvos no próprio celular.</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-bold mb-1">O Caos do Atendimento Descontrolado</h3>
                                    <p className="text-slate-600 text-sm">Você investe em tráfego, o WhatsApp enche, mas é impossível saber quantos clientes exigem resposta urgente agora.</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-bold mb-1">Tratando Clientes como Desconhecidos</h3>
                                    <p className="text-slate-600 text-sm">Um cliente liga de novo, a equipe não tem o histórico fácil e ninguém sabe o que foi prometido na última conversa.</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-bold mb-1">Trabalhando Muito, Lucrando Pouco</h3>
                                    <p className="text-slate-600 text-sm">A quantidade de mensagens duplica, sua operação fica mais pesada, mas o faturamento estagna. Tem dinheiro vazando.</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-bold mb-1">Equipe Enterrada em Planilhas</h3>
                                    <p className="text-slate-600 text-sm">Sua equipe perde vendas preenchendo o que deveria ser automático: copiando conversas intermináveis para o Excel.</p>
                                </div>
                            </div>
                        </div>

                        {/* Transition */}
                        <div className="text-center mb-10">
                            <p className="text-lg sm:text-xl font-bold text-emerald-700 bg-emerald-100 inline-block px-6 sm:px-10 py-3 sm:py-4 rounded-2xl shadow-sm border border-emerald-200">
                                Seu negócio merece previsibilidade. O primeiro CRM IA que organiza a casa por você.
                            </p>
                        </div>

                        {/* VSL / Video Section */}
                        <div
                            className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-slate-100 bg-black"
                            dangerouslySetInnerHTML={{
                                __html: `
                                    <div id="ifr_69ab17dc715cadaa9a5a0577_wrapper" style="margin: 0 auto; width: 100%;">
                                        <div style="position: relative; padding: 60.416666666666664% 0 0 0;" id="ifr_69ab17dc715cadaa9a5a0577_aspect">
                                            <iframe 
                                                frameborder="0" 
                                                allowfullscreen 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                src="about:blank" 
                                                id="ifr_69ab17dc715cadaa9a5a0577" 
                                                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                                                referrerpolicy="origin" 
                                                onload="this.onload=null, this.src='https://scripts.converteai.net/ceaefeeb-feef-4b52-8911-9ec9de0d5b6b/players/69ab17dc715cadaa9a5a0577/v4/embed.html' + (location.search || '?') + '&vl=' + encodeURIComponent(location.href)"
                                            ></iframe>
                                        </div>
                                    </div>
                                `
                            }}
                        />

                    </div>
                </div>
            </section>

            {/* Print Demonstration Section */}
            <section className="py-10 sm:py-14 bg-white overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-10">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                                <Eye className="h-4 w-4" />
                                Veja Direto do Sistema
                            </span>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
                                <span className="text-emerald-600">O que o nosso CRM IA</span> faz por você:
                            </h2>
                            <p className="text-slate-600 text-lg">Acabe com a confusão e organize tudo com inteligência artificial.</p>
                        </div>

                        {/* Prints - Layout alternado */}
                        <div className="space-y-16">

                            {/* Bloco 1 - Kanban */}
                            <div className="flex flex-col lg:flex-row items-center gap-8">
                                <div className="lg:w-1/2 space-y-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                                        <Database className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">Organiza o seu Funil de Vendas</h3>
                                    <p className="text-lg text-slate-600">
                                        Cada cliente no estágio certo, sem depender da memória de ninguém da equipe. Você bate o olho e sabe exatamente onde cada negociação parou.
                                    </p>
                                    <ul className="space-y-2 mt-4">
                                        <li className="flex items-center gap-2 text-slate-700">
                                            <Check className="w-5 h-5 text-emerald-500" />
                                            Arrastou e soltou
                                        </li>
                                        <li className="flex items-center gap-2 text-slate-700">
                                            <Check className="w-5 h-5 text-emerald-500" />
                                            Visualização em Lista ou Kanban (Cartões)
                                        </li>
                                    </ul>
                                </div>
                                <div className="lg:w-1/2 rounded-2xl p-2 bg-slate-100 border border-slate-200 shadow-lg transform lg:rotate-1 hover:rotate-0 transition-transform">
                                    <div className="aspect-[16/9] w-full bg-slate-200 rounded-xl flex items-center justify-center overflow-hidden group">
                                        <img src="/crm-prints/1.png" alt="Print Visão Kanban dos Leads" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Bloco 2 - Resumo IA */}
                            <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
                                <div className="lg:w-1/2 space-y-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                                        <BrainCircuit className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">A IA Salva e Resume Tudo</h3>
                                    <p className="text-lg text-slate-600">
                                        Você não precisa mais ler históricos imensos de conversa. Nossa IA resume cada conversa, salva arquivos, áudios e propostas.
                                    </p>
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mt-4">
                                        <p className="text-emerald-800 font-medium">
                                            💡 "Você vê em 10 segundos o que foi tratado em 1 hora de conversa."
                                        </p>
                                    </div>
                                </div>
                                <div className="lg:w-1/2 rounded-2xl p-2 bg-slate-100 border border-slate-200 shadow-lg transform lg:-rotate-1 hover:rotate-0 transition-transform">
                                    <div className="aspect-[4/3] w-full bg-slate-200 rounded-xl flex items-center justify-center overflow-hidden group">
                                        <img src="/crm-prints/2.png" alt="Print Análise Completa da Conversa e Tópicos" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Bloco 3 - Pontuação */}
                            <div className="flex flex-col lg:flex-row items-center gap-8">
                                <div className="lg:w-1/2 space-y-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                                        <Target className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">Pontuação de Leads e Ações Próximas</h3>
                                    <p className="text-lg text-slate-600">
                                        Sabe quem está quente e quem está frio automaticamente. A IA sugere instantaneamente qual é a melhor <strong className="text-emerald-600">Próxima Ação</strong> para fechar a venda, baseado no sentimento e urgência.
                                    </p>
                                    <ul className="space-y-2 mt-4">
                                        <li className="flex items-center gap-2 text-slate-700">
                                            <Check className="w-5 h-5 text-emerald-500" />
                                            Score de temperatura (Frio, Morno, Quente)
                                        </li>
                                        <li className="flex items-center gap-2 text-slate-700">
                                            <Check className="w-5 h-5 text-emerald-500" />
                                            Sentimento da Mensagem e Objeções
                                        </li>
                                    </ul>
                                </div>
                                <div className="lg:w-1/2 rounded-2xl p-2 bg-slate-100 border border-slate-200 shadow-lg transform lg:rotate-1 hover:rotate-0 transition-transform">
                                    <div className="aspect-[4/3] w-full bg-slate-200 rounded-xl flex items-center justify-center overflow-hidden group">
                                        <img src="/crm-prints/3.png" alt="Print Gaveta do Lead com Resumo de Intenção e Sentimento" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* Solution Features Grid */}
            <section className="py-10 sm:py-14 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 text-center shadow-sm hover:shadow-md transition">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                    <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-sm sm:text-lg mb-1 sm:mb-2">Captura e Retenção Imediata</h3>
                                <p className="text-slate-600 text-xs sm:text-sm">Cada contato via WhatsApp entra instantaneamente no sistema e fica blindado. Você é dono da sua própria base de leads, inegociável.</p>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 text-center shadow-sm hover:shadow-md transition">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                    <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-sm sm:text-lg mb-1 sm:mb-2">Leitura de Entrelinhas</h3>
                                <p className="text-slate-600 text-xs sm:text-sm">A inteligência artificial analisa a conversa na hora. Ela caça sentimentos, antecipa dúvidas e revela qual a objeção verdadeira para o fechamento.</p>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 text-center shadow-sm hover:shadow-md transition">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-sm sm:text-lg mb-1 sm:mb-2">Seu Melhor Vendedor Não Dorme</h3>
                                <p className="text-slate-600 text-xs sm:text-sm">Vendas continuam ativas aos sábados, domingos e feriados. Atendimento imediato para qualificar o prospect enquanto sua equipe descansa.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BONUS SECTION */}
            <section className="py-12 sm:py-16 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 opacity-10">
                    <Gift className="w-96 h-96 text-indigo-300" />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-10">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/30 text-indigo-300 rounded-full text-sm font-bold mb-4 uppercase tracking-wider">
                                <Gift className="h-4 w-4" />
                                Seu Pacote de Benefícios Exclusivos
                            </span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
                                Tudo que você ganha ao assinar <span className="text-emerald-400">hoje</span>:
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur flex items-start gap-4">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                                    <Bot className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Inteligência Artificial Nativa (Clonefy IA)</h3>
                                    <p className="text-slate-300 text-sm mb-2">Treine a IA para atender como seu melhor vendedor, tirar dúvidas e fechar negócios direto no WhatsApp 24h por dia.</p>
                                    <p className="text-sm"><span className="line-through text-slate-500 mr-2">De R$ 197</span> <span className="text-emerald-400 font-bold">GRÁTIS neste pacote</span></p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur flex items-start gap-4">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                                    <MessageSquare className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Central de Atendimento Multicanal</h3>
                                    <p className="text-slate-300 text-sm mb-2">Conecte vários números de WhatsApp, direcione para vários atendentes e controle tudo em um único painel.</p>
                                    <p className="text-sm"><span className="line-through text-slate-500 mr-2">De R$ 197</span> <span className="text-emerald-400 font-bold">GRÁTIS neste pacote</span></p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur flex items-start gap-4">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                                    <Zap className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Máquina de Recuperação de Leads</h3>
                                    <p className="text-slate-300 text-sm mb-2">Follow-up 100% automático. O sistema engaja leads frios e envia ofertas sem sua equipe perder um segundo.</p>
                                    <p className="text-sm"><span className="line-through text-slate-500 mr-2">De R$ 197</span> <span className="text-emerald-400 font-bold">GRÁTIS neste pacote</span></p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur flex items-start gap-4">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                                    <Smartphone className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Licença para 5 Conexões WhatsApp</h3>
                                    <p className="text-slate-300 text-sm mb-2">Multiplique seus atendentes sem custos extras de infraestrutura logo no primeiro contato.</p>
                                    <p className="text-sm text-emerald-400 font-bold">Incluso no seu plano base</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="planos" className="py-12 sm:py-16 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                            <Lock className="h-4 w-4" />
                            Oferta Exclusiva
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                            Organize suas Vendas e <br /><span className="text-emerald-600">Pare de Perder Dinheiro</span>
                        </h2>

                        <div className="bg-white border-2 border-emerald-500 rounded-3xl p-8 sm:p-10 shadow-2xl relative mt-10">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-2 rounded-full text-base font-bold shadow-lg">
                                    7 DIAS GRÁTIS
                                </span>
                            </div>

                            <p className="text-slate-500 font-medium tracking-widest uppercase mb-4 mt-2">Plano Pro Completo</p>

                            <div className="flex items-end justify-center gap-2 mb-8">
                                <span className="text-slate-400 text-2xl font-bold line-through">R$ 197</span>
                                <span className="text-6xl font-black text-slate-900">R$ 49</span>
                                <span className="text-2xl font-bold text-slate-900">,90</span>
                                <span className="text-slate-500 font-medium">/mês</span>
                            </div>

                            <ul className="space-y-4 mb-10 text-left max-w-sm mx-auto">
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                    <span className="text-slate-700 font-medium">CRM Inteligente com Painel Kanban</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                    <span className="text-slate-700 font-medium">Bônus: IA para Atendimento de Vendas</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                    <span className="text-slate-700 font-medium">Bônus: Chat Ao Vivo Multi-Número</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                    <span className="text-slate-700 font-medium">Bônus: Follow-up Automático</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                    <span className="text-slate-700 font-medium">Até 5 Conexões WhatsApp Inteligentes</span>
                                </li>
                            </ul>

                            <a href="#" target="_blank" rel="noopener noreferrer">
                                <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-8 text-xl font-bold rounded-2xl shadow-xl transition-transform transform hover:scale-105">
                                    Começar Teste Grátis de 7 Dias
                                    <ArrowRight className="ml-3 h-6 w-6" />
                                </Button>
                            </a>
                            <p className="text-slate-400 text-sm mt-4 font-medium flex items-center justify-center gap-2">
                                <Shield className="w-4 h-4" /> Cancelamento fácil a qualquer momento
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CRMSales;

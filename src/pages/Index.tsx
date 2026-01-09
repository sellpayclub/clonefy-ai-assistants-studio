import { Button } from "@/components/ui/button";
import { Bot, Clock, Globe, Smartphone, MessageSquare, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import LazyImage from "@/components/LazyImage";

const Index = () => {
  const { setTheme } = useTheme();
  const [chatLoaded, setChatLoaded] = useState(false);

  const SCHEDULING_URL = "https://www.agendamento-agendify.com/b/ia-clonefy";
  const CHAT_ASSISTANT_ID = "aeb677ad-3f58-4ecd-b414-79c1aa534d13";

  useEffect(() => {
    // Força modo claro na página de vendas
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
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/auth">
              <Button variant="outline" size="sm" className="text-sm border-emerald-200 hover:bg-emerald-50">
                Entrar
              </Button>
            </Link>
            <a href={SCHEDULING_URL} target="_blank" rel="noopener noreferrer">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-sm px-4"
              >
                Agendar Demo
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 sm:py-10 lg:py-14">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              <Zap className="h-4 w-4" />
              Inteligência Artificial para Atendimento
            </span>
          </div>
          
          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight text-slate-900">
            Crie um{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
              Funcionário de IA
            </span>
            <br />
            especializado para seu atendimento!
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 mb-6 max-w-4xl mx-auto leading-relaxed">
            É como ter o <strong className="text-slate-800">ChatGPT Especializado</strong> para o seu produto/negócio 
            que <strong className="text-emerald-600">responde instantaneamente</strong> às perguntas dos seus clientes.
          </p>
          
          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-emerald-100">
              <Clock className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700">Atendimento 24/7</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-emerald-100">
              <Bot className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700">100% Automático</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-emerald-100">
              <Globe className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700">+95 idiomas</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-emerald-100">
              <Smartphone className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700">WhatsApp, Site...</span>
            </div>
          </div>

          {/* Highlight Box */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-5 sm:p-6 mb-8 max-w-3xl mx-auto shadow-xl">
            <p className="text-white text-lg sm:text-xl font-semibold leading-relaxed">
              Seu atendimento <span className="underline decoration-2 underline-offset-4">disponível sem descanso</span> e pagando{" "}
              <span className="text-yellow-300 font-bold">10% de um salário</span> de um humano.
            </p>
          </div>

          {/* CTA Button */}
          <a href={SCHEDULING_URL} target="_blank" rel="noopener noreferrer">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              QUERO AGENDAR UMA DEMONSTRAÇÃO!
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </div>
      </section>

      {/* Chat Section */}
      <section className="container mx-auto px-4 py-10 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              <span className="text-emerald-600 font-semibold text-sm">Chat ao vivo</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
              Tem dúvidas? <span className="text-emerald-600">Fale com nossa IA:</span>
            </h2>
            <p className="text-slate-600 text-base">
              Experimente agora mesmo!
            </p>
          </div>

          {/* Embedded Chat */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-200 relative">
            {/* Loading Skeleton */}
            {!chatLoaded && (
              <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-10">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 text-sm">Carregando chat...</p>
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
              Gostou? Tenha um assistente assim para o <strong>seu negócio</strong>!
            </p>
            <a href={SCHEDULING_URL} target="_blank" rel="noopener noreferrer">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-5 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                QUERO AGENDAR UMA DEMONSTRAÇÃO!
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-3">
              Por que escolher a <span className="text-emerald-600">CLONEFY</span>?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Nunca Descansa</h3>
              <p className="text-slate-600 text-sm">
                Atendimento 24/7. Seus clientes nunca ficam sem resposta.
              </p>
            </div>
            
            <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Conversas Naturais</h3>
              <p className="text-slate-600 text-sm">
                IA treinada para seu negócio. Respostas humanizadas.
              </p>
            </div>
            
            <div className="text-center p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Plataforma</h3>
              <p className="text-slate-600 text-sm">
                WhatsApp, Instagram, Facebook, seu site e mais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <LazyImage 
              src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png" 
              alt="CLONEFY Logo" 
              className="h-10 w-auto"
              loading="lazy"
            />
          </div>
          <p className="text-center text-slate-500 mt-2 text-sm">
            © 2024 CLONEFY - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

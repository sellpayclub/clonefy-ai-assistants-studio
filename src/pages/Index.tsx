import { Button } from "@/components/ui/button";
import { Bot, Clock, Globe, Smartphone, MessageSquare, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import LazyImage from "@/components/LazyImage";

const Index = () => {
  const { setTheme } = useTheme();

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
              <Button variant="outline" size="sm" className="text-sm">
                Entrar
              </Button>
            </Link>
            <a href={SCHEDULING_URL} target="_blank" rel="noopener noreferrer">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-sm px-4"
              >
                Agendar Demo
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <Zap className="h-4 w-4" />
              Inteligência Artificial para Atendimento
            </span>
          </div>
          
          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-slate-900">
            Crie um{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Funcionário de IA
            </span>
            <br />
            especializado para seu atendimento!
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            É como ter o <strong className="text-slate-800">ChatGPT Especializado</strong> para o seu produto/negócio 
            que <strong className="text-blue-600">responde instantaneamente</strong> às perguntas dos seus clientes.
          </p>
          
          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-100">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700">Atendimento 24/7</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-100">
              <Bot className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700">100% Automático e Humanizado</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-100">
              <Globe className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700">Fala +95 idiomas</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-100">
              <Smartphone className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700">WhatsApp, Instagram, Site...</span>
            </div>
          </div>

          {/* Highlight Box */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 mb-10 max-w-3xl mx-auto shadow-xl">
            <p className="text-white text-lg sm:text-xl lg:text-2xl font-semibold leading-relaxed">
              Seu atendimento <span className="underline decoration-2 underline-offset-4">disponível sem descanso</span> e pagando{" "}
              <span className="text-yellow-300 font-bold">10% de um salário</span> de um humano.
            </p>
          </div>

          {/* CTA Button */}
          <a href={SCHEDULING_URL} target="_blank" rel="noopener noreferrer">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              QUERO AGENDAR UMA DEMONSTRAÇÃO!
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </div>
      </section>

      {/* Chat Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              <span className="text-blue-600 font-semibold">Chat ao vivo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Tem dúvidas? <span className="text-blue-600">Fale com nossa IA:</span>
            </h2>
            <p className="text-slate-600 text-lg">
              Experimente agora mesmo como funciona o atendimento automatizado
            </p>
          </div>

          {/* Embedded Chat */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <iframe
              src={`/embed-chat/${CHAT_ASSISTANT_ID}`}
              className="w-full"
              style={{ 
                height: '550px',
                border: 'none'
              }}
              title="Chat com IA CLONEFY"
              allow="microphone"
            />
          </div>

          {/* CTA After Chat */}
          <div className="text-center mt-10">
            <p className="text-slate-600 mb-6 text-lg">
              Gostou? Tenha um assistente assim para o <strong>seu negócio</strong>!
            </p>
            <a href={SCHEDULING_URL} target="_blank" rel="noopener noreferrer">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                QUERO AGENDAR UMA DEMONSTRAÇÃO!
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Por que escolher a <span className="text-blue-600">CLONEFY</span>?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Nunca Descansa</h3>
              <p className="text-slate-600">
                Atendimento 24 horas por dia, 7 dias por semana. Seus clientes nunca ficam sem resposta.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Conversas Naturais</h3>
              <p className="text-slate-600">
                IA treinada especificamente para seu negócio. Respostas humanizadas e contextualizadas.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Plataforma</h3>
              <p className="text-slate-600">
                Integre no WhatsApp, Instagram, Facebook, seu site e muito mais. Tudo em um só lugar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <LazyImage 
              src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png" 
              alt="CLONEFY Logo" 
              className="h-10 w-auto"
              loading="lazy"
            />
          </div>
          <p className="text-center text-slate-500 mt-3 text-sm">
            © 2024 CLONEFY - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

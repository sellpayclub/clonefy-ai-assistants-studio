import { Button } from "@/components/ui/button";
import { Bot, Clock, Globe, Smartphone, MessageSquare, Zap, ArrowRight, Check } from "lucide-react";
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
              <span className="text-sm font-medium text-slate-700">Multi-plataforma</span>
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

      {/* Integration Section - DESTAQUE */}
      <section className="py-10 sm:py-14 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Title */}
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-4">
                <Smartphone className="h-4 w-4" />
                Integração Multi-Plataforma
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                Integre sua IA em <span className="text-emerald-400">QUALQUER LUGAR</span>
              </h2>
              <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                A mesma IA treinada para seu negócio funcionando em todas as suas plataformas de atendimento
              </p>
            </div>

            {/* Platforms Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {/* WhatsApp */}
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-2xl p-5 text-center hover:scale-105 transition-transform">
                <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <h3 className="text-white font-bold text-lg mb-1">WhatsApp</h3>
                <p className="text-slate-400 text-xs">Atendimento automático</p>
              </div>

              {/* Instagram */}
              <div className="bg-gradient-to-br from-pink-500/20 to-purple-600/10 border border-pink-500/30 rounded-2xl p-5 text-center hover:scale-105 transition-transform">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Instagram</h3>
                <p className="text-slate-400 text-xs">DMs automáticas</p>
              </div>

              {/* Facebook */}
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-5 text-center hover:scale-105 transition-transform">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Facebook</h3>
                <p className="text-slate-400 text-xs">Messenger integrado</p>
              </div>

              {/* Website */}
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-5 text-center hover:scale-105 transition-transform">
                <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Seu Site</h3>
                <p className="text-slate-400 text-xs">Chat flutuante</p>
              </div>

              {/* Telegram */}
              <div className="bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/30 rounded-2xl p-5 text-center hover:scale-105 transition-transform">
                <div className="w-14 h-14 bg-sky-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Telegram</h3>
                <p className="text-slate-400 text-xs">Bot inteligente</p>
              </div>
            </div>

            {/* Benefits List */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Uma IA, múltiplas plataformas</p>
                    <p className="text-slate-400 text-sm">Configure uma vez, use em todos os canais</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Histórico centralizado</p>
                    <p className="text-slate-400 text-sm">Todas as conversas em um só lugar</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Instalação em minutos</p>
                    <p className="text-slate-400 text-sm">Copie e cole o código ou conecte via QR Code</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Respostas consistentes</p>
                    <p className="text-slate-400 text-sm">Mesma qualidade em todos os canais</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-8">
              <a href={SCHEDULING_URL} target="_blank" rel="noopener noreferrer">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  QUERO INTEGRAR MINHA IA!
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>
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

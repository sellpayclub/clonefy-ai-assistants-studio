import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Smartphone, Star, ArrowRight, Clock, Users, TrendingUp, Shield, Zap, HeadphonesIcon, Send, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import ChatWidget from "@/components/ChatWidget";
import { useTheme } from "@/components/ThemeProvider";

const Index = () => {
  const { t } = useLanguage();
  const { setTheme } = useTheme();
  const [currentRole, setCurrentRole] = useState(0);
  const roles = [
    t('hero.roles.vendedor'),
    t('hero.roles.sdr'),
    t('hero.roles.atendente'),
    t('hero.roles.funcionario')
  ];

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-section');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

    const interval = setInterval(() => {
      setCurrentRole((prev) => (prev + 1) % roles.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [roles.length, setTheme]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      {/* Header */}
      <header className="container mx-auto px-4 py-4 lg:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png" 
              alt="CLONEFY Logo" 
              className="h-16 w-auto sm:h-16 lg:h-20 xl:h-24"
              loading="eager"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="hidden md:block">
              <LanguageSelector />
            </div>
            <Link to="/auth">
              <Button variant="outline" size="sm" className="text-sm lg:text-base">
                {t('header.login')}
              </Button>
            </Link>
            <a href="https://pay.plataformasellpay.com.br/checkout-white-6917/?add-to-cart=6917" target="_blank" rel="noopener noreferrer">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-sm lg:text-base px-3 sm:px-4 lg:px-6"
              >
                <span className="hidden sm:inline">{t('header.startFree')}</span>
                <span className="sm:hidden">Começar</span>
              </Button>
            </a>
          </div>
        </div>
        {/* Mobile Language Selector */}
        <div className="md:hidden mt-4 flex justify-center">
          <LanguageSelector />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-6 sm:py-8 lg:py-12 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {t('hero.badge')}
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
            {t('hero.title')}{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent inline-block min-w-[140px] sm:min-w-[200px] lg:min-w-[300px] transition-all duration-500">
              {roles[currentRole]}
            </span>
            <br />
            {t('hero.titleEnd')}
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-10 max-w-4xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
            <br />
            <strong className="text-foreground">{t('hero.subtitleBold')}</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 sm:mb-12 max-w-md sm:max-w-none mx-auto">
            <Button 
              size="lg" 
              onClick={scrollToPricing}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8 py-4 text-lg font-semibold"
            >
              <span className="sm:hidden">Ver Preços</span>
              <span className="hidden sm:inline">Ver Preços</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={scrollToPricing}
              className="w-full sm:w-auto px-8 py-4 text-lg font-semibold"
            >
              <span className="sm:hidden">Ver Demo</span>
              <span className="hidden sm:inline">{t('hero.watchDemo')}</span>
            </Button>
          </div>

          <div className="bg-card/60 backdrop-blur-sm border rounded-2xl p-6 sm:p-8 lg:p-10 max-w-4xl mx-auto">
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-4">
              {t('hero.description1')}
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
              {t('hero.description2')}
            </p>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="container mx-auto px-4 py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">Como é Simples Usar o CLONEFY</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg sm:text-xl">
            Veja na prática como criar e configurar seus agentes de IA em poucos cliques
          </p>
        </div>
        
        <div className="space-y-20 sm:space-y-24">
          {/* Paso 1: Criar Agente - Texto à Esquerda, Imagem à Direita */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-1">
              <div className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium inline-block mb-6">
                Passo 1
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">Criar Seu Agente</h3>
              <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed">
                Clique em "Novo Agente" e pronto! Uma interface simples e intuitiva 
                para começar a configurar seu assistente virtual.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Interface clean e fácil de usar</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Processo guiado passo a passo</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Configuração em minutos</span>
                </li>
              </ul>
            </div>
            <div className="order-2">
              <img 
                src="/lovable-uploads/78405cc7-ac71-4962-a65b-41f013b48492.png"
                alt="Criar Agente - Interface simples para começar"
                className="rounded-2xl shadow-2xl border w-full max-w-lg mx-auto"
                loading="lazy"
              />
            </div>
          </div>

          {/* Paso 2: Configurar - Imagem à Esquerda, Texto à Direita */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/lovable-uploads/840c4611-5645-4a58-98c5-fea65bbb08fc.png"
                alt="Configurar Agente - Personalização completa"
                className="rounded-2xl shadow-2xl border w-full max-w-lg mx-auto"
                loading="lazy"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium inline-block mb-6">
                Passo 2
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">Personalizar Completamente</h3>
              <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed">
                Defina o nome, descrição e instruções detalhadas. Ensine seu agente 
                a ser exatamente como você precisa - um vendedor, atendente, secretária ou qualquer função!
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Personalize o nome e função</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Configure instruções específicas</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Adicione arquivos e conhecimento</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Paso 3: Gerenciar - Texto à Esquerda, Imagem à Direita */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-1">
              <div className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium inline-block mb-6">
                Passo 3
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">Gerenciar Seus Agentes</h3>
              <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed">
                Visualize todos os seus agentes criados, edite quando necessário, 
                teste as conversas e monitore o desempenho.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Dashboard organizado e claro</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Botões de ação rápida</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Teste antes de colocar no ar</span>
                </li>
              </ul>
            </div>
            <div className="order-2">
              <img 
                src="/lovable-uploads/18248d32-3b27-4c30-b5b7-0fdcc905ae7b.png"
                alt="Lista de Agentes - Gerenciamento fácil"
                className="rounded-2xl shadow-2xl border w-full max-w-lg mx-auto"
                loading="lazy"
              />
            </div>
          </div>

          {/* Paso 4: Conectar WhatsApp - Imagem à Esquerda, Texto à Direita */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/lovable-uploads/6997528e-0637-4e0e-b1c5-189e6c76f917.png"
                alt="Conectar WhatsApp - Integração simples"
                className="rounded-2xl shadow-2xl border w-full max-w-lg mx-auto"
                loading="lazy"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium inline-block mb-6">
                Passo 4
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">Conectar ao WhatsApp</h3>
              <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed">
                Conecte seus agentes ao WhatsApp em segundos! Basta escanear o QR Code 
                e seu agente estará pronto para atender seus clientes 24/7.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Conexão por QR Code</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Múltiplas instâncias WhatsApp</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Atendimento automático 24/7</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Paso 5: Chat Flutuante + WhatsApp - Texto à Esquerda, Imagem à Direita */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-1">
              <div className="bg-green-100 text-green-700 rounded-full px-4 py-2 text-sm font-medium inline-block mb-6">
                Passo 5 - EXTRA
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-8 w-8 text-primary" />
                  Incorporar no Seu Site
                </span>
                <span className="text-green-500 text-xl font-medium">+ WhatsApp</span>
              </h3>
              <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed">
                <strong className="text-green-600">ALÉM do WhatsApp</strong>, você pode adicionar um chat flutuante no seu site! 
                Copie e cole o código e pronto - seus visitantes poderão falar com seu agente diretamente.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Código pronto para copiar</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Widget responsivo</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Integração em qualquer site</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                  <span className="text-base sm:text-lg text-green-700">
                    <strong>+ WhatsApp sempre ativo</strong>
                  </span>
                </li>
              </ul>
            </div>
            <div className="order-2">
              <img 
                src="/lovable-uploads/1c3acef0-0f93-4eef-b3a5-2cb3614deb57.png"
                alt="Chat Flutuante - Widget para site"
                className="rounded-2xl shadow-2xl border w-full max-w-lg mx-auto"
                loading="lazy"
              />
            </div>
          </div>

          {/* Resultado Final - Imagem à Esquerda, Texto à Direita */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/lovable-uploads/a9dc3a05-1c17-4478-9cc9-51f472d73ed6.png"
                alt="Conversa Real - Agente funcionando"
                className="rounded-2xl shadow-2xl border w-full max-w-lg mx-auto"
                loading="lazy"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-green-100 text-green-700 rounded-full px-4 py-2 text-sm font-medium inline-block mb-6">
                ✅ Resultado
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">Agente Funcionando Perfeitamente!</h3>
              <p className="text-muted-foreground text-lg sm:text-xl mb-8 leading-relaxed">
                Veja seu agente em ação! Conversas naturais, respostas inteligentes 
                e atendimento profissional 24 horas por dia, todos os dias.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Conversas naturais e fluidas</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Respostas contextualizadas</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                  <span className="text-base sm:text-lg">Disponível 24/7 sem pausas</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mt-20 sm:mt-24">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl p-8 sm:p-10 lg:p-12 max-w-4xl mx-auto">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">É Assim de Simples!</h3>
            <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Em menos de 10 minutos você pode ter seu próprio agente de IA funcionando. 
              Sem programação, sem complicação.
            </p>
            <Button 
              size="lg" 
              onClick={scrollToPricing}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-semibold"
            >
              <span className="sm:hidden">Ver Preços</span>
              <span className="hidden sm:inline">Ver Preços Agora</span>
              <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 px-2">{t('features.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-2">
            {t('features.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{t('features.salesAgent.title')}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              {t('features.salesAgent.description')}
            </p>
          </div>
          
          <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{t('features.scheduling.title')}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              {t('features.scheduling.description')}
            </p>
          </div>
          
          <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{t('features.multiService.title')}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              {t('features.multiService.description')}
            </p>
          </div>
          
          <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <HeadphonesIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{t('features.support.title')}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              {t('features.support.description')}
            </p>
          </div>
          
          <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{t('features.naturalConversations.title')}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              {t('features.naturalConversations.description')}
            </p>
          </div>
          
          <div className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{t('features.fastService.title')}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              {t('features.fastService.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 px-2">{t('pricing.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-2">
            {t('pricing.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {/* Funcionário Tradicional */}
          <div className="p-6 sm:p-8 rounded-xl sm:rounded-2xl border bg-card/30">
            <div className="text-center mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-muted-foreground mb-2">{t('pricing.traditional.title')}</h3>
              <div className="text-3xl sm:text-4xl font-bold text-muted-foreground">{t('pricing.currency')}{t('pricing.traditional.price')}</div>
              <p className="text-muted-foreground text-sm sm:text-base">{t('pricing.traditional.period')}</p>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-2 text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 flex-shrink-0"></div>
                {t('pricing.traditional.features.0')}
              </li>
              <li className="flex items-center gap-2 text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 flex-shrink-0"></div>
                {t('pricing.traditional.features.1')}
              </li>
              <li className="flex items-center gap-2 text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 flex-shrink-0"></div>
                {t('pricing.traditional.features.2')}
              </li>
              <li className="flex items-center gap-2 text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 flex-shrink-0"></div>
                {t('pricing.traditional.features.3')}
              </li>
            </ul>
          </div>

          {/* CLONEFY */}
          <div className="p-6 sm:p-8 rounded-xl sm:rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
              <span className="bg-primary text-primary-foreground px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                {t('pricing.clonefy.recommended')}
              </span>
            </div>
            <div className="text-center mb-6">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">{t('pricing.clonefy.title')}</h3>
              <div className="text-3xl sm:text-4xl font-bold text-primary">{t('pricing.currency')}{t('pricing.clonefy.price')}</div>
              <p className="text-muted-foreground text-sm sm:text-base">{t('pricing.clonefy.period')}</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-primary text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                {t('pricing.clonefy.features.0')}
              </li>
              <li className="flex items-center gap-2 text-primary text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                {t('pricing.clonefy.features.1')}
              </li>
              <li className="flex items-center gap-2 text-primary text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                {t('pricing.clonefy.features.2')}
              </li>
              <li className="flex items-center gap-2 text-primary text-sm sm:text-base">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                {t('pricing.clonefy.features.3')}
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <p className="text-lg sm:text-xl lg:text-2xl font-bold mb-6 sm:mb-8 px-2">
            {t('pricing.finalMessage')} <span className="text-primary">{t('pricing.finalMessageHighlight')}</span>
          </p>
          <a href="https://pay.plataformasellpay.com.br/checkout-white-6917/?add-to-cart=6917" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg">
              {t('pricing.startNow')}
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center justify-center">
            <img 
              src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png" 
              alt="CLONEFY Logo" 
              className="h-14 sm:h-10 lg:h-12 w-auto"
              loading="lazy"
            />
          </div>
          <p className="text-center text-muted-foreground mt-3 sm:mt-4 text-sm sm:text-base px-2">
            {t('footer.copyright')}
          </p>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default Index;

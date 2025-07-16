import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Smartphone, Star, ArrowRight, Clock, Users, TrendingUp, Shield, Zap, HeadphonesIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

const Index = () => {
  const { t } = useLanguage();
  const [currentRole, setCurrentRole] = useState(0);
  const roles = [
    t('hero.roles.vendedor'),
    t('hero.roles.sdr'),
    t('hero.roles.atendente'),
    t('hero.roles.funcionario')
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRole((prev) => (prev + 1) % roles.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [roles.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      {/* Header */}
      <header className="container mx-auto px-4 py-4 lg:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png" 
              alt="CLONEFY Logo" 
              className="h-14 w-auto sm:h-12 lg:h-16"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>
            <Link to="/auth" className="hidden sm:block">
              <Button variant="outline" size="sm" className="lg:h-10 lg:px-4">
                {t('header.login')}
              </Button>
            </Link>
            <a href="https://pay.plataformasellpay.com.br/checkout-white-6917/?add-to-cart=6917" target="_blank" rel="noopener noreferrer">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 lg:h-10 lg:px-4 text-sm lg:text-base"
              >
                <span className="hidden sm:inline">{t('header.startFree')}</span>
                <span className="sm:hidden">Começar</span>
              </Button>
            </a>
          </div>
        </div>
        {/* Mobile Language Selector */}
        <div className="sm:hidden mt-3 flex justify-center">
          <LanguageSelector />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <span className="inline-block px-3 sm:px-4 py-2 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              {t('hero.badge')}
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-2">
            {t('hero.title')}{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent inline-block min-w-[120px] sm:min-w-[200px] transition-all duration-500">
              {roles[currentRole]}
            </span>
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            {t('hero.titleEnd')}
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-2">
            {t('hero.subtitle')}
            <br className="hidden sm:block" />
            <strong className="text-foreground">{t('hero.subtitleBold')}</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-2">
            <a href="https://pay.plataformasellpay.com.br/checkout-white-6917/?add-to-cart=6917" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg">
                <span className="sm:hidden">Criar Agente</span>
                <span className="hidden sm:inline">{t('hero.createAssistant')}</span>
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg">
              <span className="sm:hidden">Ver Demo</span>
              <span className="hidden sm:inline">{t('hero.watchDemo')}</span>
            </Button>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-3 sm:mb-4">
              {t('hero.description1')}
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
              {t('hero.description2')}
            </p>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 px-2">Como é Simples Usar o CLONEFY</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-2">
            Veja na prática como criar e configurar seus agentes de IA em poucos cliques
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-20">
          {/* Paso 1: Criar Agente */}
          <div className="order-2 lg:order-1 px-2">
            <div className="bg-primary/10 text-primary rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium inline-block mb-4">
              Passo 1
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4">Criar Seu Agente</h3>
            <p className="text-muted-foreground text-base sm:text-lg mb-6">
              Clique em "Novo Agente" e pronto! Uma interface simples e intuitiva 
              para começar a configurar seu assistente virtual.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Interface clean e fácil de usar</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Processo guiado passo a passo</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Configuração em minutos</span>
              </li>
            </ul>
          </div>
          <div className="order-1 lg:order-2">
            <img 
              src="/lovable-uploads/78405cc7-ac71-4962-a65b-41f013b48492.png"
              alt="Criar Agente - Interface simples para começar"
              className="rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl border w-full max-w-sm sm:max-w-md mx-auto"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-20">
          {/* Paso 2: Configurar */}
          <div className="order-2 lg:order-1">
            <img 
              src="/lovable-uploads/840c4611-5645-4a58-98c5-fea65bbb08fc.png"
              alt="Configurar Agente - Personalização completa"
              className="rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl border w-full"
            />
          </div>
          <div className="order-1 lg:order-2 px-2">
            <div className="bg-primary/10 text-primary rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium inline-block mb-4">
              Passo 2
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4">Personalizar Completamente</h3>
            <p className="text-muted-foreground text-base sm:text-lg mb-6">
              Defina o nome, descrição e instruções detalhadas. Ensine seu agente 
              a ser exatamente como você precisa - um vendedor, atendente, secretária ou qualquer função!
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Personalize o nome e função</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Configure instruções específicas</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Adicione arquivos e conhecimento</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-20">
          {/* Paso 3: Gerenciar */}
          <div className="order-2 lg:order-1 px-2">
            <div className="bg-primary/10 text-primary rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium inline-block mb-4">
              Passo 3
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4">Gerenciar Seus Agentes</h3>
            <p className="text-muted-foreground text-base sm:text-lg mb-6">
              Visualize todos os seus agentes criados, edite quando necessário, 
              teste as conversas e monitore o desempenho.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Dashboard organizado e claro</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Botões de ação rápida</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Teste antes de colocar no ar</span>
              </li>
            </ul>
          </div>
          <div className="order-1 lg:order-2">
            <img 
              src="/lovable-uploads/18248d32-3b27-4c30-b5b7-0fdcc905ae7b.png"
              alt="Lista de Agentes - Gerenciamento fácil"
              className="rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl border w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-20">
          {/* Paso 4: Conectar WhatsApp */}
          <div className="order-2 lg:order-1">
            <img 
              src="/lovable-uploads/6997528e-0637-4e0e-b1c5-189e6c76f917.png"
              alt="Conectar WhatsApp - Integração simples"
              className="rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl border w-full"
            />
          </div>
          <div className="order-1 lg:order-2 px-2">
            <div className="bg-primary/10 text-primary rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium inline-block mb-4">
              Passo 4
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4">Conectar ao WhatsApp</h3>
            <p className="text-muted-foreground text-base sm:text-lg mb-6">
              Conecte seus agentes ao WhatsApp em segundos! Basta escanear o QR Code 
              e seu agente estará pronto para atender seus clientes 24/7.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Conexão por QR Code</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Múltiplas instâncias WhatsApp</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Atendimento automático 24/7</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-20">
          {/* Paso 5: Chat Flutuante */}
          <div className="order-2 lg:order-1 px-2">
            <div className="bg-primary/10 text-primary rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium inline-block mb-4">
              Passo 5
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4">Incorporar no Seu Site</h3>
            <p className="text-muted-foreground text-base sm:text-lg mb-6">
              Adicione um chat flutuante no seu site! Copie e cole o código 
              e pronto - seus visitantes poderão falar com seu agente diretamente.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Código pronto para copiar</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Widget responsivo</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Integração em qualquer site</span>
              </li>
            </ul>
          </div>
          <div className="order-1 lg:order-2">
            <img 
              src="/lovable-uploads/1c3acef0-0f93-4eef-b3a5-2cb3614deb57.png"
              alt="Chat Flutuante - Widget para site"
              className="rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl border w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-16">
          {/* Resultado Final */}
          <div className="order-2 lg:order-1">
            <img 
              src="/lovable-uploads/a9dc3a05-1c17-4478-9cc9-51f472d73ed6.png"
              alt="Conversa Real - Agente funcionando"
              className="rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl border w-full"
            />
          </div>
          <div className="order-1 lg:order-2 px-2">
            <div className="bg-green-100 text-green-700 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium inline-block mb-4">
              ✅ Resultado
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4">Agente Funcionando Perfeitamente!</h3>
            <p className="text-muted-foreground text-base sm:text-lg mb-6">
              Veja seu agente em ação! Conversas naturais, respostas inteligentes 
              e atendimento profissional 24 horas por dia, todos os dias.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Conversas naturais e fluidas</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Respostas contextualizadas</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Disponível 24/7 sem pausas</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-12 sm:mt-16">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">É Assim de Simples!</h3>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 px-2">
              Em menos de 10 minutos você pode ter seu próprio agente de IA funcionando. 
              Sem programação, sem complicação.
            </p>
            <a href="https://pay.plataformasellpay.com.br/checkout-white-6917/?add-to-cart=6917" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
                <span className="sm:hidden">Criar Agente</span>
                <span className="hidden sm:inline">Criar Meu Primeiro Agente Agora</span>
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </a>
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
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
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
              className="h-12 sm:h-10 lg:h-12 w-auto"
            />
          </div>
          <p className="text-center text-muted-foreground mt-3 sm:mt-4 text-sm sm:text-base px-2">
            {t('footer.copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

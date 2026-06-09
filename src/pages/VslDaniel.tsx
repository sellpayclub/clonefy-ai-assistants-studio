import { useState, useEffect, useRef } from 'react';
import { Check, Shield, Mic, Zap, Users, Clock, ArrowRight, ChevronDown, HelpCircle, Sparkles, Crown, Infinity } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VslDaniel = () => {
  const [showPlans, setShowPlans] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load SmartPlayer SDK and set iframe src
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js';
    script.async = true;
    script.onload = () => {
      const iframe = document.getElementById('ifr_6a28480770b71c2fb26e3a81') as HTMLIFrameElement;
      if (iframe) {
        const vl = new URLSearchParams(window.location.search).get('vl') || '';
        const searchParams = window.location.search;
        const vlParam = vl ? `&vl=${vl}` : '';
        iframe.src = `https://scripts.converteai.net/ceaefeeb-feef-4b52-8911-9ec9de0d5b6b/players/6a28480770b71c2fb26e3a81/v4/embed.html${searchParams}${searchParams ? '&' : '?'}vl=${vl}`;
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Delayed content reveal after 15min 15sec
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPlans(true);
    }, 915000);

    return () => clearTimeout(timer);
  }, []);

  // Trigger mount animation after showPlans becomes true
  useEffect(() => {
    if (showPlans) {
      requestAnimationFrame(() => {
        setMounted(true);
      });
    }
  }, [showPlans]);

  const plans = [
    {
      name: 'Plano Start',
      price: 'R$ 297,00',
      badge: null,
      borderClass: 'border-white/10 hover:border-emerald-500/50',
      accentColor: 'emerald',
      icon: <Sparkles className="h-6 w-6 text-emerald-400" />,
      features: [
        { text: '1 Conexão WhatsApp', icon: <Check className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: '1 Funcionário de IA', icon: <Users className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: 'Mensagens ilimitadas', icon: <Check className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: 'Contatos ilimitados', icon: <Check className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: 'Escuta ativa (IA ouve áudio)', icon: <Mic className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: 'Disponível 24h (celular desligado)', icon: <Clock className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: 'Anti-bloqueio WhatsApp', icon: <Shield className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: 'Follow-up Automático IA', icon: <Zap className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: 'CRM Leads com LeadScore', icon: <Users className="w-3.5 h-3.5 text-emerald-400" /> },
      ],
      buyLink: 'https://pay.kiwify.com.br/e8OeYHo?src=vsldaniel',
      buttonClass: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700',
    },
    {
      name: 'Plano PRO',
      price: 'R$ 397,00',
      badge: 'MAIS POPULAR',
      borderClass: 'border-emerald-500/60 hover:border-emerald-400',
      accentColor: 'emerald',
      icon: <Crown className="h-6 w-6 text-emerald-400" />,
      features: [
        { text: '3 Conexões WhatsApp', icon: <Check className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: '3 Funcionários de IA', icon: <Users className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: 'Mensagens ilimitadas', icon: <Check className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: 'Contatos ilimitados', icon: <Check className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: 'Escuta ativa (IA ouve áudio)', icon: <Mic className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: 'Disponível 24h (celular desligado)', icon: <Clock className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: 'Anti-bloqueio WhatsApp', icon: <Shield className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: 'Follow-up Automático IA', icon: <Zap className="w-3.5 h-3.5 text-emerald-400" /> },
        { text: 'CRM Leads com LeadScore', icon: <Users className="w-3.5 h-3.5 text-emerald-400" /> },
      ],
      buyLink: 'https://pay.kiwify.com.br/ubSVmBh?src=vsldaniel',
      buttonClass: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700',
    },
    {
      name: 'Plano ILIMITADO',
      price: 'R$ 497,00',
      badge: null,
      borderClass: 'border-yellow-500/40 hover:border-yellow-400/60',
      accentColor: 'yellow',
      icon: <Infinity className="h-6 w-6 text-yellow-400" />,
      features: [
        { text: 'Sem Limites de Conexões WhatsApp', icon: <Check className="w-3.5 h-3.5 text-yellow-400" /> },
        { text: 'Sem Limites Funcionários de IA', icon: <Users className="w-3.5 h-3.5 text-yellow-400" /> },
        { text: 'Mensagens ilimitadas', icon: <Check className="w-3.5 h-3.5 text-yellow-400" /> },
        { text: 'Contatos ilimitados', icon: <Check className="w-3.5 h-3.5 text-yellow-400" /> },
        { text: 'Escuta ativa (IA ouve áudio)', icon: <Mic className="w-3.5 h-3.5 text-yellow-400" /> },
        { text: 'Disponível 24h (celular desligado)', icon: <Clock className="w-3.5 h-3.5 text-yellow-400" /> },
        { text: 'Anti-bloqueio WhatsApp', icon: <Shield className="w-3.5 h-3.5 text-yellow-400" /> },
        { text: 'Follow-up Automático IA', icon: <Zap className="w-3.5 h-3.5 text-yellow-400" /> },
        { text: 'CRM Leads com LeadScore', icon: <Users className="w-3.5 h-3.5 text-yellow-400" /> },
      ],
      buyLink: 'https://pay.kiwify.com.br/h55ZDVJ?src=vsldaniel',
      buttonClass: 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700',
    },
  ];

  const faqs = [
    {
      question: 'Como funciona a IA de atendimento?',
      answer: 'A IA é treinada especificamente para o seu negócio. Ela aprende sobre seus produtos, serviços e forma de atender, respondendo automaticamente às perguntas dos clientes 24 horas por dia, 7 dias por semana.',
    },
    {
      question: 'A IA funciona mesmo com o celular desligado?',
      answer: 'Sim! A IA roda em nossos servidores na nuvem, então ela continua atendendo seus clientes 24 horas, mesmo que você desligue o celular ou fique sem internet.',
    },
    {
      question: 'O que é a tecnologia anti-bloqueio?',
      answer: 'Utilizamos tecnologia avançada que simula comportamento humano natural, evitando que o WhatsApp detecte automação. Isso protege seu número de ser bloqueado.',
    },
    {
      question: 'Posso cancelar a qualquer momento?',
      answer: 'Sim! Não há fidelidade. Você pode cancelar a qualquer momento. Garantia de 7 dias - não gostou, devolvemos 100% do dinheiro.',
    },
    {
      question: 'Quanto tempo leva para configurar?',
      answer: 'Em menos de 10 minutos você já tem sua IA funcionando! Basta treinar a IA com as informações do seu negócio e conectar seu WhatsApp.',
    },
    {
      question: 'A IA escuta áudios de verdade?',
      answer: 'Sim! Nossa IA possui escuta ativa. Ela transcreve e entende mensagens de voz enviadas pelos seus clientes e responde de forma inteligente.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="container mx-auto px-4 py-4 lg:py-6">
        <div className="flex items-center justify-center">
          <img
            src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png"
            alt="CLONEFY Logo"
            className="h-14 w-auto sm:h-16 lg:h-20"
          />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 sm:py-10 lg:py-14">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
              <Zap className="h-4 w-4" />
              Inteligência Artificial para WhatsApp
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
            Crie um{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              Funcionário de IA
            </span>{' '}
            especializado para seu atendimento no{' '}
            <span className="text-emerald-400">WhatsApp</span>!
          </h1>

          {/* Feature Chips - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/10">
              <span className="text-lg">⏰</span>
              <span className="text-sm font-medium text-white/90">Atendimento 24/7</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/10">
              <span className="text-lg">🤖</span>
              <span className="text-sm font-medium text-white/90">100% Automático</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/10">
              <span className="text-lg">🎧</span>
              <span className="text-sm font-medium text-white/90">Escuta ÁUDIO e responde</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/10">
              <span className="text-lg">🔄</span>
              <span className="text-sm font-medium text-white/90">Faz Follow-Up sozinha</span>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="container mx-auto px-4 pb-12 sm:pb-16">
        <div className="max-w-lg mx-auto">
          <div
            id="ifr_6a28480770b71c2fb26e3a81_wrapper"
            style={{ margin: '0 auto', width: '100%', maxWidth: '400px' }}
          >
            <div
              style={{ position: 'relative', padding: '100% 0 0 0' }}
              id="ifr_6a28480770b71c2fb26e3a81_aspect"
            >
              <iframe
                frameBorder="0"
                allowFullScreen
                src="about:blank"
                id="ifr_6a28480770b71c2fb26e3a81"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
                referrerPolicy="origin"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Delayed Content: Plans + FAQ */}
      {showPlans && (
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
            pointerEvents: mounted ? 'auto' : 'none',
          }}
        >
          {/* Plans Section */}
          <section className="container mx-auto px-4 py-12 sm:py-16">
            <div className="max-w-6xl mx-auto">
              {/* Title */}
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-4">
                  <Sparkles className="h-4 w-4" />
                  Planos e Preços
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                  Escolha seu Plano de acordo com sua demanda:
                </h2>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan, index) => (
                  <div
                    key={plan.name}
                    className={`relative bg-white/5 backdrop-blur-sm border ${plan.borderClass} rounded-2xl p-6 transition-all duration-300 ${
                      index === 1 ? 'md:scale-105 shadow-2xl shadow-emerald-500/10' : ''
                    } ${index === 2 ? 'shadow-lg shadow-yellow-500/5' : ''}`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    {/* Plan Header */}
                    <div className="text-center mb-6 pt-2">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                        {plan.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span
                          className={`text-4xl font-bold ${
                            index === 2 ? 'text-yellow-400' : 'text-emerald-400'
                          }`}
                        >
                          {plan.price}
                        </span>
                        <span className="text-slate-400">/mês</span>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-3 text-slate-300">
                          <div
                            className={`w-5 h-5 rounded-full ${
                              index === 2 ? 'bg-yellow-500/20' : 'bg-emerald-500/20'
                            } flex items-center justify-center flex-shrink-0`}
                          >
                            {feature.icon}
                          </div>
                          <span className="text-sm">{feature.text}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <a href={plan.buyLink} target="_blank" rel="noopener noreferrer" className="block">
                      <Button
                        className={`w-full ${plan.buttonClass} text-white font-bold py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                      >
                        Assinar Agora
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>

              {/* Guarantee Badge */}
              <div className="text-center mt-8">
                <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-6 py-3">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  <span className="text-white/80 text-sm">
                    🔒 Garantia de 7 dias. Não gostou? Devolvemos seu dinheiro!
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="container mx-auto px-4 py-12 sm:py-16">
            <div className="max-w-3xl mx-auto">
              {/* Title */}
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-4">
                  <HelpCircle className="h-4 w-4" />
                  Dúvidas Frequentes
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Perguntas Frequentes
                </h2>
              </div>

              {/* FAQ Items */}
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <details
                    key={index}
                    className="group bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
                  >
                    <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium hover:bg-slate-800/80 transition-colors list-none">
                      <span className="pr-4">{faq.question}</span>
                      <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="px-5 pb-5 text-slate-300 text-sm leading-relaxed border-t border-slate-700/50 pt-4">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-white/5">
        <div className="text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Clonefy. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default VslDaniel;

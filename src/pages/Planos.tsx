import { Button } from "@/components/ui/button";
import {
  Check,
  Shield,
  Mic,
  Zap,
  Users,
  Clock,
  ArrowRight,
  ChevronDown,
  HelpCircle,
  Sparkles,
  Crown,
  Infinity,
} from "lucide-react";

const Planos = () => {
  const sharedFeatures = [
    { icon: Check, text: "Mensagens ilimitadas", bold: "ilimitadas" },
    { icon: Check, text: "Contatos ilimitados", bold: "ilimitados" },
    { icon: Mic, text: "Escuta ativa (IA ouve áudio)" },
    { icon: Clock, text: "Disponível 24h (celular desligado)" },
    { icon: Shield, text: "Anti-bloqueio WhatsApp" },
    { icon: Zap, text: "Follow-up Automático IA" },
    { icon: Users, text: "CRM Leads com LeadScore" },
  ];

  const faqItems = [
    {
      question: "Como funciona a IA de atendimento?",
      answer:
        "A IA é treinada especificamente para o seu negócio. Ela aprende sobre seus produtos, serviços e forma de atender, respondendo automaticamente às perguntas dos clientes 24 horas por dia, 7 dias por semana.",
    },
    {
      question: "A IA funciona mesmo com o celular desligado?",
      answer:
        "Sim! A IA roda em nossos servidores na nuvem, então ela continua atendendo seus clientes 24 horas, mesmo que você desligue o celular ou fique sem internet. Você nunca perde uma venda.",
    },
    {
      question: "O que é a tecnologia anti-bloqueio?",
      answer:
        "Utilizamos tecnologia avançada que simula comportamento humano natural, evitando que o WhatsApp detecte automação. Isso protege seu número de ser bloqueado, garantindo continuidade no atendimento.",
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer:
        "Sim! Não há fidelidade. Você pode cancelar seu plano a qualquer momento diretamente pelo painel. Além disso, oferecemos garantia de 7 dias - se não gostar, devolvemos 100% do seu dinheiro.",
    },
    {
      question: "Quanto tempo leva para configurar?",
      answer:
        "Em menos de 10 minutos você já tem sua IA funcionando! Basta criar sua conta, treinar a IA com as informações do seu negócio e conectar seu WhatsApp via QR Code.",
    },
    {
      question: "A IA escuta áudios de verdade?",
      answer:
        "Sim! Nossa IA possui escuta ativa. Ela transcreve e compreende áudios enviados pelos clientes no WhatsApp, respondendo de forma inteligente e contextualizada, como um atendente humano faria.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
          <img
            src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png"
            alt="CLONEFY Logo"
            className="h-10 w-auto"
          />
        </div>
      </header>

      {/* Headline Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Planos e Preços
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Escolha seu plano abaixo
            </h1>
            <p className="text-slate-300 text-lg sm:text-xl">
              Comece agora e tenha seu funcionário de IA trabalhando 24/7!
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan Start */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Plano Start</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-emerald-400">R$ 297</span>
                  <span className="text-slate-400">,00</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span>
                    <strong className="text-white">1</strong> Conexão WhatsApp
                  </span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span>
                    <strong className="text-white">1</strong> Funcionário de IA
                  </span>
                </li>
                {sharedFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
              <a
                href="https://pay.kiwify.com.br/e8OeYHo?src=vsldaniel"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-5 font-bold shadow-lg">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>

            {/* Plan PRO (Highlighted) */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-sm border-2 border-emerald-500/50 rounded-2xl p-6 relative transform md:-translate-y-4 shadow-2xl shadow-emerald-500/20">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                  <Crown className="w-4 h-4" />
                  MAIS POPULAR
                </span>
              </div>
              <div className="text-center mb-6 mt-2">
                <h3 className="text-xl font-bold text-white mb-2">Plano PRO</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-emerald-400">R$ 397</span>
                  <span className="text-slate-400">,00</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span>
                    <strong className="text-white">3</strong> Conexões WhatsApp
                  </span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span>
                    <strong className="text-white">3</strong> Funcionários de IA
                  </span>
                </li>
                {sharedFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
              <a
                href="https://pay.kiwify.com.br/ubSVmBh?src=vsldaniel"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-5 font-bold shadow-lg">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>

            {/* Plan ILIMITADO */}
            <div className="bg-white/5 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 hover:border-amber-500/50 transition-all duration-300">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-amber-400 mb-2">Plano ILIMITADO</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-amber-400">R$ 497</span>
                  <span className="text-slate-400">,00</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Infinity className="w-3 h-3 text-amber-400" />
                  </div>
                  <span>
                    Sem Limites de Conexões WhatsApp
                  </span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Infinity className="w-3 h-3 text-amber-400" />
                  </div>
                  <span>
                    Sem Limites Funcionários de IA
                  </span>
                </li>
                {sharedFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-3 h-3 text-amber-400" />
                    </div>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
              <a
                href="https://pay.kiwify.com.br/h55ZDVJ?src=vsldaniel"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white py-5 font-bold shadow-lg">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>

          {/* Guarantee */}
          <div className="text-center mt-10">
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-6 py-3">
              <span className="text-2xl">🔒</span>
              <span className="text-yellow-400 font-medium">
                Garantia de 7 dias. Não gostou? Devolvemos seu dinheiro!
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Title */}
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-4">
                <HelpCircle className="h-4 w-4" />
                Perguntas Frequentes
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                Tire suas <span className="text-emerald-400">dúvidas</span>
              </h2>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <details
                  key={index}
                  className="group bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                    <span className="font-semibold text-white">{item.question}</span>
                    <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-2" />
                  </summary>
                  <div className="px-5 pb-5 text-slate-400">{item.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <img
              src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png"
              alt="CLONEFY Logo"
              className="h-8 w-auto opacity-60"
            />
            <p className="text-slate-500 text-xs text-center">
              © 2024 CLONEFY - Todos os direitos reservados. Inteligência Artificial para
              Atendimento.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Planos;

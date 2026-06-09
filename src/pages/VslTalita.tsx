import { useState, useEffect } from "react";
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

const VslTalita = () => {
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    // Delay to show plans after 18 minutes
    const timer = setTimeout(() => {
      setShowPlans(true);
    }, 1080000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Load SmartPlayer script
    const script = document.createElement("script");
    script.src =
      "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js";
    script.async = true;
    document.head.appendChild(script);

    // Set iframe src after script loads
    const setIframeSrc = () => {
      const iframe = document.getElementById(
        "ifr_6a28494754339e2055e2fad1"
      ) as HTMLIFrameElement | null;
      if (iframe) {
        const vl = new Date()
          .toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .split("/")
          .join("");
        iframe.src = `https://scripts.converteai.net/ceaefeeb-feef-4b52-8911-9ec9de0d5b6b/players/6a28494754339e2055e2fad1/v4/embed.html${location.search}${location.search ? "&" : "?"}vl=${vl}`;
      }
    };

    script.onload = setIframeSrc;

    // Fallback: try setting src after a short delay
    const fallbackTimer = setTimeout(setIframeSrc, 1500);

    return () => {
      clearTimeout(fallbackTimer);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pt-8 sm:pt-12">
      {/* Hero Section */}
      <section className="px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">
              Inteligência Artificial para WhatsApp
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-8">
            Crie um{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              Funcionário de IA
            </span>{" "}
            especializado para seu atendimento no{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              WhatsApp
            </span>
            !
          </h1>

          {/* Bullet Chips - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto mb-10">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-sm font-medium">
              ⏰ Atendimento 24/7
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-sm font-medium">
              🤖 100% Automático
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-sm font-medium">
              🎧 Escuta ÁUDIO e responde
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-sm font-medium">
              🔄 Faz Follow-Up sozinha
            </div>
          </div>
        </div>

        {/* Video Section */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-2 md:p-4">
            <div
              id="ifr_6a28494754339e2055e2fad1_wrapper"
              style={{ margin: "0 auto", width: "100%" }}
            >
              <div
                style={{ position: "relative", padding: "56.25% 0 0 0" }}
                id="ifr_6a28494754339e2055e2fad1_aspect"
              >
                <iframe
                  frameBorder={0}
                  allowFullScreen
                  src="about:blank"
                  id="ifr_6a28494754339e2055e2fad1"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                  }}
                  referrerPolicy="origin"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delayed Content - Plans Section */}
      {showPlans && (
        <div className="animate-in fade-in duration-1000">
          {/* Plans Section */}
          <section className="px-4 py-12 md:py-16">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-4xl font-bold text-center mb-4">
                Escolha seu plano
              </h2>
              <p className="text-slate-400 text-center mb-10 max-w-2xl mx-auto">
                Comece agora e transforme seu atendimento com Inteligência
                Artificial
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Plano Start */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-1">Plano Start</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-bold">R$ 297</span>
                      <span className="text-slate-400">,00/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>1 Conexão WhatsApp</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>1 Funcionário de IA</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Mensagens ilimitadas</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Contatos ilimitados</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Mic className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Escuta ativa</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Disponível 24h</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Anti-bloqueio</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Follow-up Automático IA</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>CRM Leads com LeadScore</span>
                    </li>
                  </ul>

                  <a
                    href="https://pay.kiwify.com.br/e8OeYHo?src=vsltalita"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-6 text-base rounded-xl">
                      Começar Agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>

                {/* Plano PRO - Highlighted */}
                <div className="bg-white/5 backdrop-blur-sm border-2 border-emerald-500/50 rounded-2xl p-6 flex flex-col relative shadow-lg shadow-emerald-500/10">
                  {/* Badge */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                      Mais Popular
                    </span>
                  </div>

                  <div className="mb-6 mt-2">
                    <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                      Plano PRO
                    </h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-bold">R$ 397</span>
                      <span className="text-slate-400">,00/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold">
                        3 Conexões WhatsApp
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold">
                        3 Funcionários de IA
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Mensagens ilimitadas</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Contatos ilimitados</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Mic className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Escuta ativa</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Disponível 24h</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Anti-bloqueio</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Follow-up Automático IA</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>CRM Leads com LeadScore</span>
                    </li>
                  </ul>

                  <a
                    href="https://pay.kiwify.com.br/ubSVmBh?src=vsltalita"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-6 text-base rounded-xl">
                      Começar Agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>

                {/* Plano ILIMITADO - Golden */}
                <div className="bg-white/5 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 flex flex-col relative">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                      <Crown className="h-5 w-5 text-amber-400" />
                      <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                        Plano ILIMITADO
                      </span>
                    </h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                        R$ 497
                      </span>
                      <span className="text-slate-400">,00/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center gap-2 text-sm">
                      <Infinity className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="font-semibold text-amber-300">
                        Conexões Sem Limites
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Infinity className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="font-semibold text-amber-300">
                        Funcionários de IA Sem Limites
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>Mensagens ilimitadas</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>Contatos ilimitados</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Mic className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>Escuta ativa</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>Disponível 24h</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>Anti-bloqueio</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>Follow-up Automático IA</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>CRM Leads com LeadScore</span>
                    </li>
                  </ul>

                  <a
                    href="https://pay.kiwify.com.br/h55ZDVJ?src=vsltalita"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold py-6 text-base rounded-xl">
                      Começar Agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>

              {/* Guarantee Badge */}
              <div className="mt-10 text-center">
                <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm text-slate-300">
                    🔒 Garantia de 7 dias. Não gostou? Devolvemos seu dinheiro!
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="px-4 py-12 md:py-16">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 mb-4">
                  <HelpCircle className="h-5 w-5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">FAQ</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  Perguntas Frequentes
                </h2>
              </div>

              <div className="space-y-3">
                {/* FAQ Item 1 */}
                <details className="group bg-slate-800/50 rounded-xl border border-slate-700">
                  <summary className="flex items-center justify-between cursor-pointer p-5 text-sm md:text-base font-medium list-none">
                    <span>Como funciona a IA de atendimento?</span>
                    <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">
                    A IA é treinada especificamente para o seu negócio. Ela
                    aprende sobre seus produtos, serviços e forma de
                    atendimento, respondendo os clientes de maneira natural e
                    personalizada, como se fosse um funcionário real da sua
                    empresa.
                  </div>
                </details>

                {/* FAQ Item 2 */}
                <details className="group bg-slate-800/50 rounded-xl border border-slate-700">
                  <summary className="flex items-center justify-between cursor-pointer p-5 text-sm md:text-base font-medium list-none">
                    <span>
                      A IA funciona mesmo com o celular desligado?
                    </span>
                    <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">
                    Sim! A IA roda em nossos servidores na nuvem, 24 horas por
                    dia, 7 dias por semana. Não depende do seu celular estar
                    ligado ou conectado à internet.
                  </div>
                </details>

                {/* FAQ Item 3 */}
                <details className="group bg-slate-800/50 rounded-xl border border-slate-700">
                  <summary className="flex items-center justify-between cursor-pointer p-5 text-sm md:text-base font-medium list-none">
                    <span>O que é a tecnologia anti-bloqueio?</span>
                    <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">
                    Utilizamos tecnologia avançada que simula comportamento
                    humano natural no WhatsApp, evitando bloqueios e banimentos.
                    Isso garante que sua IA funcione de forma contínua e segura.
                  </div>
                </details>

                {/* FAQ Item 4 */}
                <details className="group bg-slate-800/50 rounded-xl border border-slate-700">
                  <summary className="flex items-center justify-between cursor-pointer p-5 text-sm md:text-base font-medium list-none">
                    <span>Posso cancelar a qualquer momento?</span>
                    <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">
                    Sim! Não há fidelidade. Você pode cancelar sua assinatura a
                    qualquer momento sem multa ou burocracia.
                  </div>
                </details>

                {/* FAQ Item 5 */}
                <details className="group bg-slate-800/50 rounded-xl border border-slate-700">
                  <summary className="flex items-center justify-between cursor-pointer p-5 text-sm md:text-base font-medium list-none">
                    <span>Quanto tempo leva para configurar?</span>
                    <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">
                    Em menos de 10 minutos você já tem sua IA funcionando.
                    Basta conectar seu WhatsApp, configurar as respostas e
                    pronto!
                  </div>
                </details>

                {/* FAQ Item 6 */}
                <details className="group bg-slate-800/50 rounded-xl border border-slate-700">
                  <summary className="flex items-center justify-between cursor-pointer p-5 text-sm md:text-base font-medium list-none">
                    <span>A IA escuta áudios de verdade?</span>
                    <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">
                    Sim! Nossa IA possui escuta ativa que transcreve e
                    compreende mensagens de áudio enviadas pelos clientes,
                    respondendo de forma inteligente e contextualizada.
                  </div>
                </details>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <img
            src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png"
            alt="Clonefy"
            className="h-8 mx-auto mb-4 opacity-60"
          />
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Clonefy. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default VslTalita;

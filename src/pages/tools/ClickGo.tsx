import { Button } from "@/components/ui/button";
import { Zap, MessageSquare, Shield, ArrowRight, Check, Users, BarChart3, Globe } from "lucide-react";
import { useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import LazyImage from "@/components/LazyImage";
import { Link as RouterLink } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ClonefyPromoBanner from "@/components/ClonefyPromoBanner";

const ClickGo = () => {
  const { setTheme } = useTheme();
  const CLICKGO_PROD_URL = "https://clickgo-redirec-wpp.vercel.app";

  useEffect(() => {
    // Força modo claro na página de vendas para manter consistência com o Clonefy
    setTheme("light");

    // SEO Meta Tags will be handled by Helmet
  }, [setTheme]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/50">
      <Helmet>
        <title>ClickGo - Redirecionador de WhatsApp e Distribuidor de Leads Grátis</title>
        <meta name="description" content="ClickGo é a ferramenta gratuita definitiva para redirecionamento de WhatsApp e distribuição de leads. Melhore seu SEO e converta mais com links inteligentes." />
        <meta name="keywords" content="redirecionador whatsapp, distribuidor leads whatsapp, leads whatsapp gratis, clickgo, clonefy, marketing digital whatsapp" />
        <meta property="og:title" content="ClickGo - Redirecionador Inteligente de WhatsApp" />
        <meta property="og:description" content="Distribua seus leads do WhatsApp de forma inteligente e gratuita com o ClickGo." />
        <meta property="og:image" content="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png" />
      </Helmet>

      {/* Header */}
      <header className="container mx-auto px-4 py-4 lg:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RouterLink to="/">
              <LazyImage
                src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png"
                alt="CLONEFY Logo"
                className="h-10 w-auto sm:h-12 lg:h-14"
                loading="eager"
              />
            </RouterLink>
            <div className="h-6 w-px bg-slate-300 mx-1"></div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
              ClickGo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a href={CLICKGO_PROD_URL} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm border-emerald-200 hover:bg-emerald-50 px-2 sm:px-3"
              >
                Entrar
              </Button>
            </a>
            <a href={CLICKGO_PROD_URL} target="_blank" rel="noopener noreferrer">
              <Button
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-xs sm:text-sm px-2 sm:px-4 text-white"
              >
                Criar Conta Grátis
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              <Zap className="h-4 w-4" />
              Ferramenta 100% Gratuita da Clonefy
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight text-slate-900">
            O Redirecionador de WhatsApp<br />
            <span className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
              Mais Rápido e Inteligente
            </span>
          </h1 >

          <p className="text-xl sm:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Distribua leads entre seus vendedores de forma automática, monitore cliques em tempo real e nunca mais perca uma venda por demora no atendimento.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a href={CLICKGO_PROD_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-7 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                CRIAR MEU LINK AGORA
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </a>
            <p className="text-slate-500 font-medium">Sem cartão de crédito. Grátis para sempre.</p>
          </div>

          <div className="relative mt-8 max-w-4xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-white border border-emerald-100 rounded-2xl shadow-2xl overflow-hidden p-2">
              <div className="bg-slate-50 rounded-xl p-4 sm:p-8 flex flex-col items-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">Rotação de Leads</h3>
                    <p className="text-sm text-slate-500">Distribua leads igualmente entre seu time (Round Robin).</p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                      <BarChart3 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">Analytics Real-time</h3>
                    <p className="text-sm text-slate-500">Saiba exatamente quantos cliques cada link e vendedor recebeu.</p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                      <Globe className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">Pixel do Facebook</h3>
                    <p className="text-sm text-slate-500">Rastreie conversões e otimize suas campanhas de tráfego pago.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Detail */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Por que o ClickGo é a <span className="text-emerald-600">melhor escolha?</span>
              </h2>
              <p className="text-slate-600 text-lg">
                Tudo que você precisa para gerenciar seus redirecionamentos de WhatsApp em um só lugar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="bg-emerald-100 p-3 rounded-xl h-fit">
                    <Check className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Links Personalizados</h3>
                    <p className="text-slate-600">Crie slugs amigáveis como clickgo.me/seu-negocio para passar mais profissionalismo.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-emerald-100 p-3 rounded-xl h-fit">
                    <MessageSquare className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Abertura de App Direta</h3>
                    <p className="text-slate-600">Tecnologia que força a abertura do aplicativo do WhatsApp, aumentando a taxa de conversão.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-emerald-100 p-3 rounded-xl h-fit">
                    <Shield className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">100% Seguro</h3>
                    <p className="text-slate-600">Seus dados e de seus clientes estão protegidos com criptografia de ponta a ponta.</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold mb-4">Aumente sua conversão em até 40%</h3>
                  <p className="text-emerald-50 mb-6 italic">
                    "Desde que começamos a usar o ClickGo para distribuir nossos leads do Instagram, não perdemos mais nenhum contato por demora. O sistema de distribuição funciona perfeitamente."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold">JD</div>
                    <div>
                      <p className="font-bold">João D.</p>
                      <p className="text-sm text-emerald-100">Agência de Marketing Digital</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ClonefyPromoBanner />

      {/* CTA Final */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-10 sm:p-16 shadow-xl border border-emerald-100">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
              Pronto para escalar seu atendimento?
            </h2>
            <p className="text-slate-600 text-lg mb-10">
              Junte-se a centenas de empresas que já otimizam seu fluxo de leads com o ClickGo.
            </p>
            <a href={CLICKGO_PROD_URL} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-7 text-xl font-bold rounded-2xl w-full sm:w-auto shadow-lg hover:shadow-xl transition-all"
              >
                COMEÇAR AGORA GRÁTIS
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <LazyImage
                src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png"
                alt="CLONEFY Logo"
                className="h-8 w-auto"
                loading="lazy"
              />
              <span className="text-slate-500 text-sm">© 2024 Clonefy tools</span>
            </div>
            <div className="flex gap-6 text-sm text-slate-500">
              <RouterLink to="/" className="hover:text-emerald-600">Clonefy Home</RouterLink>
              <RouterLink to="/auth" className="hover:text-emerald-600">Login</RouterLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClickGo;

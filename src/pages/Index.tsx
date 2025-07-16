import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Smartphone, Star, ArrowRight, Clock, Users, TrendingUp, Shield, Zap, HeadphonesIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const Index = () => {
  const [currentRole, setCurrentRole] = useState(0);
  const roles = ["vendedor", "SDR", "atendente", "funcionário"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRole((prev) => (prev + 1) % roles.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/a49c53ef-ee9d-47be-8b56-db4d0c8768ed.png" 
            alt="CLONEFY Logo" 
            className="h-8 w-auto"
          />
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="outline">Login</Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              Começar Grátis
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              🚀 Conheça a Inteligência artificial que vende pra você todos os dias 24hr
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Clone seu melhor{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent inline-block min-w-[200px] transition-all duration-500">
              {roles[currentRole]}
            </span>
            <br />
            com IA!
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
            Tenha Agentes IA treinados para sua empresa, atendendo no WhatsApp, 24 horas por dia.
            <br />
            <strong className="text-foreground">100% automática e humanizada!</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8 py-6 text-lg">
                Criar Meu Primeiro Assistente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg">
              Ver Demonstração
            </Button>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-8 max-w-3xl mx-auto">
            <p className="text-lg text-muted-foreground mb-4">
              Ensine seu Clone a Seguir o Seu Script de Vendas ou Seu atendimento e Automatize 100% seu WhatsApp
            </p>
            <p className="text-2xl font-bold text-primary">
              Seu Funcionário Disponível 24horas por dia, sem descanso e pagando 10% de um salário.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Funcionalidades Poderosas</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Tudo que você precisa para automatizar e escalar seu atendimento
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="text-center p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-4">Agente de Vendas</h3>
            <p className="text-muted-foreground leading-relaxed">
              SDR, Closer, Vendedor profissional! Ensine seu Clone a vender o seu Produto/Serviço e crie um vendedor profissional que se ajusta e melhora a cada conversa, enviando links personalizados, vídeos e muito mais.
            </p>
          </div>
          
          <div className="text-center p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-4">Agendamentos</h3>
            <p className="text-muted-foreground leading-relaxed">
              Crie uma secretár.IA e deixe que ela cuide da sua agenda e gerencie atendimento dos seus clientes de forma inteligente e personalizada.
            </p>
          </div>
          
          <div className="text-center p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-4">Multi-Atendimento</h3>
            <p className="text-muted-foreground leading-relaxed">
              Seu Clone terá um histórico de conversa, atendendo de forma personalizada cada cliente, lembrando de todos eles e criando um atendimento 100% personalizado.
            </p>
          </div>
          
          <div className="text-center p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
              <HeadphonesIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-4">Suporte e Atendimento</h3>
            <p className="text-muted-foreground leading-relaxed">
              Use seu clone para automatizar seu suporte e atendimento ao cliente, inclua todas as informações sobre seu negócio e deixe ele disponível para ajudar seus clientes.
            </p>
          </div>
          
          <div className="text-center p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-4">Conversas Naturais</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sua Inteligência Artificial conversa de forma natural e humanizada sempre com muita simpatia e profissionalismo.
            </p>
          </div>
          
          <div className="text-center p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-4">Atendimento Rápido</h3>
            <p className="text-muted-foreground leading-relaxed">
              Seus clientes e Leads respondidos rapidamente em qualquer horário! Assuma o controle e acompanhe tudo que a IA diz.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Plano Único e Acessível</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Compare os custos e veja como o CLONEFY é mais eficiente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Funcionário Tradicional */}
          <div className="p-8 rounded-2xl border bg-card/30">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-muted-foreground mb-2">Funcionário Tradicional</h3>
              <div className="text-4xl font-bold text-muted-foreground">R$ 1.518+</div>
              <p className="text-muted-foreground">/mês + taxas, férias, etc.</p>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50"></div>
                Trabalha apenas das 08h às 17h
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50"></div>
                Férias e feriados
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50"></div>
                Pode ficar doente
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50"></div>
                Custos adicionais
              </li>
            </ul>
          </div>

          {/* CLONEFY */}
          <div className="p-8 rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                RECOMENDADO
              </span>
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">CLONEFY</h3>
              <div className="text-4xl font-bold text-primary">R$ 97</div>
              <p className="text-muted-foreground">/mês - SEM limites</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Disponível 24 horas por dia
              </li>
              <li className="flex items-center gap-2 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Sem férias ou feriados
              </li>
              <li className="flex items-center gap-2 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Nunca fica doente
              </li>
              <li className="flex items-center gap-2 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Sem conversas/atendimento limitados
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-2xl font-bold mb-8">
            Contrate IA e não humanos, <span className="text-primary">o Futuro já Chegou!</span>
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-12 py-6 text-lg">
              Começar Agora por R$ 97/mês
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <img 
              src="/lovable-uploads/a49c53ef-ee9d-47be-8b56-db4d0c8768ed.png" 
              alt="CLONEFY Logo" 
              className="h-6 w-auto"
            />
          </div>
          <p className="text-center text-muted-foreground mt-4">
            © 2024 CLONEFY. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

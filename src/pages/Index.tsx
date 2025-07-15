import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Smartphone, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            CLONEFY
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="outline">Login</Button>
          </Link>
          <Link to="/auth">
            <Button>Começar Grátis</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Crie Assistentes de IA
            <br />
            para WhatsApp
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transforme seu atendimento com assistentes inteligentes personalizados. 
            Conecte com o WhatsApp em segundos e automatize suas conversas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Criar Meu Primeiro Assistente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Funcionalidades Poderosas</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para criar e gerenciar assistentes de IA profissionais
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-lg border bg-card">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Assistentes Personalizados</h3>
            <p className="text-muted-foreground">
              Crie assistentes únicos com instruções específicas, treine com seus próprios arquivos e dados.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Conexão WhatsApp</h3>
            <p className="text-muted-foreground">
              Conecte facilmente via QR Code e tenha seus assistentes respondendo automaticamente.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Chat Inteligente</h3>
            <p className="text-muted-foreground">
              Teste seus assistentes, acompanhe conversas e melhore continuamente as respostas.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para Começar?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já transformaram seu atendimento com a CLONEFY
          </p>
          <Link to="/auth">
            <Button size="lg">
              Criar Conta Grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center">
                <Bot className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                CLONEFY
              </span>
            </div>
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

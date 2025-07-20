import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Clock, Users, TrendingUp, Shield, MessageSquare, Star, ArrowRight, CheckCircle, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import LazyImage from "@/components/LazyImage";

const LeadCapture = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    businessType: "",
    employees: "",
    monthlyRevenue: ""
  });

  const [isQualified, setIsQualified] = useState<boolean | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Lógica de qualificação: menos de 2 funcionários = não qualificado
    const employeeCount = parseInt(formData.employees);
    
    if (employeeCount < 2) {
      setIsQualified(false);
    } else {
      setIsQualified(true);
      // Aqui você implementaria a lógica de agendamento
      console.log("Lead qualificado:", formData);
    }
  };

  const redirectToClonefy = () => {
    window.open("https://pay.plataformasellpay.com.br/checkout-white-6917/?add-to-cart=6917", "_blank");
  };

  if (isQualified === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-25 to-background flex items-center justify-center p-4">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
              <Bot className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl">Ótimo! Temos uma solução perfeita para você</CardTitle>
            <CardDescription className="text-lg">
              Para empresas menores, o <strong>CLONEFY</strong> é ideal - você mesmo pode criar e configurar seus agentes de IA!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg">
              <h3 className="font-semibold text-xl mb-4">Por que o CLONEFY é perfeito para você:</h3>
              <div className="grid gap-4 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Fácil de usar - você mesmo configura tudo</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Preço acessível para pequenas empresas</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Agentes de IA funcionais em minutos</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>WhatsApp + Chat no site inclusos</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={redirectToClonefy}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
              >
                Começar com CLONEFY Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Link to="/">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Voltar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isQualified === true) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-25 to-background flex items-center justify-center p-4">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <Star className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl">Parabéns! Você é elegível para uma IA personalizada</CardTitle>
            <CardDescription className="text-lg">
              Nossa equipe irá criar uma solução de IA completamente customizada para sua empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-green-100/50 to-green-50 p-6 rounded-lg">
              <h3 className="font-semibold text-xl mb-4">O que você receberá:</h3>
              <div className="grid gap-4 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>IA treinada especificamente com seus dados e processos</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Configuração feita pela nossa equipe especializada</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Integração com seus sistemas existentes</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Suporte dedicado e acompanhamento</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 font-medium">
                📅 Próximo passo: Nossa equipe entrará em contato em até 24h para agendar uma demonstração personalizada.
              </p>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Dados recebidos:</strong></p>
              <p>Empresa: {formData.company}</p>
              <p>Funcionários: {formData.employees}</p>
              <p>Ramo: {formData.businessType}</p>
            </div>
            
            <Link to="/">
              <Button variant="outline" size="lg">
                Voltar ao início
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/">
            <LazyImage 
              src="/lovable-uploads/dea91c3a-7ac2-4343-b166-58b5e0126a0d.png" 
              alt="CLONEFY Logo" 
              className="h-16 w-auto"
              loading="eager"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="outline">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-4xl mx-auto mb-16">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              🚀 Solução Personalizada
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Crie <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Agentes de IA</span><br />
            Treinados para Sua Empresa
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            <strong>Atendentes virtuais que conhecem seu negócio de dentro para fora.</strong><br />
            Treinados com seus dados, processos e linguagem específica.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">WhatsApp 24/7</h3>
              <p className="text-muted-foreground">Atendimento automático que nunca para</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">IA Personalizada</h3>
              <p className="text-muted-foreground">Treinada especificamente para seu negócio</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Mais Vendas</h3>
              <p className="text-muted-foreground">Converte leads mesmo quando você dorme</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Por que empresas escolhem nossa IA personalizada?
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Conhece Seus Produtos</h3>
                    <p className="text-muted-foreground">Treinamos a IA com catálogos, preços, promoções e especificações técnicas.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Fala Como Sua Equipe</h3>
                    <p className="text-muted-foreground">Adaptamos o tom de voz, linguagem e abordagem específica da sua empresa.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Integra com Seus Sistemas</h3>
                    <p className="text-muted-foreground">Conecta com CRM, estoque, agenda e qualquer sistema que você use.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Suporte Especializado</h3>
                    <p className="text-muted-foreground">Nossa equipe cuida de tudo - implementação, treinamento e melhorias.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card/60 backdrop-blur-sm border rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Ideal para empresas que:</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Têm equipe de 2+ funcionários</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Usam WhatsApp para vendas/atendimento</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Querem atendimento 24/7</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Buscam aumentar conversões</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Precisam de solução profissional</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Formulário */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl sm:text-3xl">Vamos Avaliar Sua Empresa</CardTitle>
              <CardDescription className="text-lg">
                Responda algumas perguntas para verificar se sua empresa é elegível para nossa solução personalizada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nome completo *</label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email *</label>
                    <Input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">WhatsApp *</label>
                  <Input
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Nome da empresa *</label>
                  <Input
                    required
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    placeholder="Nome da sua empresa"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">O que sua empresa faz/vende? *</label>
                  <Textarea
                    required
                    value={formData.businessType}
                    onChange={(e) => handleInputChange("businessType", e.target.value)}
                    placeholder="Ex: Vendemos roupas femininas online, consultoria empresarial, etc."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Quantos funcionários sua empresa tem? *</label>
                  <Select onValueChange={(value) => handleInputChange("employees", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o número de funcionários" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Apenas eu (solo)</SelectItem>
                      <SelectItem value="1">1 funcionário</SelectItem>
                      <SelectItem value="2-5">2 a 5 funcionários</SelectItem>
                      <SelectItem value="6-15">6 a 15 funcionários</SelectItem>
                      <SelectItem value="16-50">16 a 50 funcionários</SelectItem>
                      <SelectItem value="50+">Mais de 50 funcionários</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Faturamento mensal aproximado (opcional)</label>
                  <Select onValueChange={(value) => handleInputChange("monthlyRevenue", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o faturamento (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-10k">Até R$ 10.000</SelectItem>
                      <SelectItem value="10k-50k">R$ 10.000 - R$ 50.000</SelectItem>
                      <SelectItem value="50k-100k">R$ 50.000 - R$ 100.000</SelectItem>
                      <SelectItem value="100k-500k">R$ 100.000 - R$ 500.000</SelectItem>
                      <SelectItem value="500k+">Acima de R$ 500.000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  Verificar Elegibilidade
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default LeadCapture;
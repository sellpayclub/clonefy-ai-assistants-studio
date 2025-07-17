import { useState } from "react";
import { CheckCircle, Mail, Clock, Sparkles, Zap, MessageCircle, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ThankYou = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { toast } = useToast();
  
  const handleUpsellClick = () => {
    window.open("https://pay.plataformasellpay.com.br/checkout-white-6925/?add-to-cart=6925", "_blank");
  };

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/5515998355640?text=Olá! Preciso de ajuda com minha conta.", "_blank");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já possui uma conta. Tente fazer login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao criar conta",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar a conta e depois faça login.",
        });
        setEmail("");
        setPassword("");
        setFullName("");
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {/* Success Section */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="rounded-full bg-green-100 p-4 sm:p-6">
              <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 px-4">
            Parabéns! Sua compra foi aprovada! 🎉
          </h1>
          
          <div className="max-w-2xl mx-auto space-y-4 px-4">
            <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-muted-foreground">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Um email com as instruções foi enviado para você</span>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base">Próximos passos:</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm sm:text-base">
                <li>Verifique seu email (inclusive spam/lixo eletrônico)</li>
                <li>Crie sua conta usando o <strong>mesmo email</strong> que você usou na compra</li>
                <li>Confirme seu email clicando no link enviado</li>
                <li>Faça login e comece a criar suas IAs!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Upsell Section */}
        <Card className="max-w-4xl mx-auto mb-8 sm:mb-12 lg:mb-16 border-2 border-primary/20 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 p-4 sm:p-6">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="bg-primary/20 rounded-full p-2 sm:p-3">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
              🚀 OFERTA ESPECIAL - APENAS HOJE!
            </CardTitle>
            <CardDescription className="text-base sm:text-lg">
              Não quer perder tempo criando e treinando sua IA?
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 lg:items-center">
              <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  Nossa equipe cria e treina sua IA para você!
                </h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-sm sm:text-base">IA personalizada criada pela nossa equipe especializada</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Treinamento completo com seus dados e necessidades</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-sm sm:text-base">IA entregue pronta para conectar ao WhatsApp</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Entrega em até <strong>48 horas</strong></span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <span className="text-sm sm:text-base"><strong>Uso ILIMITADO</strong> - sua IA nunca vence!</span>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                  <p className="text-yellow-800 font-medium text-sm sm:text-base">
                    🤝 Incluímos reunião online para entender suas necessidades e configurar tudo perfeitamente!
                  </p>
                </div>
              </div>
              
              <div className="text-center space-y-4 sm:space-y-6 order-1 lg:order-2">
                <div className="bg-gradient-to-r from-red-100 to-orange-100 rounded-lg p-4 sm:p-6 border border-red-200">
                  <div className="line-through text-xl sm:text-2xl text-muted-foreground mb-2">
                    De R$ 997
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                    R$ 297
                  </div>
                  <div className="text-red-600 font-medium text-sm sm:text-base">
                    ⚡ Apenas nesta oferta especial!
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    onClick={handleUpsellClick}
                    size="lg" 
                    className="w-full text-base sm:text-lg py-4 sm:py-6 bg-gradient-to-r from-primary to-primary-variant hover:scale-105 transition-transform animate-pulse"
                  >
                    🚀 SIM! QUERO MINHA IA PRONTA
                  </Button>
                  
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    ✅ Pagamento 100% seguro • ⚡ Processo automático
                  </p>
                </div>
                
                <div className="text-center p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-medium text-xs sm:text-sm">
                    ⏰ Esta oferta expira em 24 horas!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Account Section */}
        <Card className="max-w-2xl mx-auto mb-8 sm:mb-12 lg:mb-16 border-2 border-green-200 shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="bg-green-100 rounded-full p-2 sm:p-3">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-green-700">
              🚀 Crie sua conta agora!
            </CardTitle>
            <CardDescription className="text-base sm:text-lg text-green-600">
              Use o mesmo email da compra para acessar sua conta premium
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Nome completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email (mesmo da compra)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Criar senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full"
                />
              </div>
              
              <Button
                type="submit"
                disabled={isSigningUp}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-medium"
              >
                {isSigningUp ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando conta...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Criar minha conta premium
                  </>
                )}
              </Button>
              
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Ao criar sua conta, você concorda com nossos termos de uso
              </p>
            </form>
          </CardContent>
        </Card>

        {/* WhatsApp Help Button */}
        <div className="text-center mb-8 sm:mb-12">
          <Button
            onClick={handleWhatsAppClick}
            variant="outline"
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 px-6 py-3"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            💬 Precisa de ajuda? Fale conosco no WhatsApp
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-12 px-4">
          <p className="text-sm sm:text-base text-muted-foreground">
            Dúvidas? Entre em contato conosco pelo suporte
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
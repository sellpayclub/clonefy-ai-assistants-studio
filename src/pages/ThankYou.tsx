import { CheckCircle, Mail, Clock, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ThankYou = () => {
  const handleUpsellClick = () => {
    window.open("https://pay.plataformasellpay.com.br/checkout-white-6925/?add-to-cart=6925", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        {/* Success Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Parabéns! Sua compra foi aprovada! 🎉
          </h1>
          
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Mail className="h-5 w-5" />
              <span>Um email com as instruções foi enviado para você</span>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-3">Próximos passos:</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Verifique seu email (inclusive spam/lixo eletrônico)</li>
                <li>Crie sua conta usando o <strong>mesmo email</strong> que você usou na compra</li>
                <li>Confirme seu email clicando no link enviado</li>
                <li>Faça login e comece a criar suas IAs!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Upsell Section */}
        <Card className="max-w-4xl mx-auto border-2 border-primary/20 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/20 rounded-full p-3">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-primary">
              🚀 OFERTA ESPECIAL - APENAS HOJE!
            </CardTitle>
            <CardDescription className="text-lg">
              Não quer perder tempo criando e treinando sua IA?
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-foreground">
                  Nossa equipe cria e treina sua IA para você!
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span>IA personalizada criada pela nossa equipe especializada</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span>Treinamento completo com seus dados e necessidades</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span>IA entregue pronta para conectar ao WhatsApp</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <span>Entrega em até <strong>48 horas</strong></span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <span><strong>Uso ILIMITADO</strong> - sua IA nunca vence!</span>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium">
                    🤝 Incluímos reunião online para entender suas necessidades e configurar tudo perfeitamente!
                  </p>
                </div>
              </div>
              
              <div className="text-center space-y-6">
                <div className="bg-gradient-to-r from-red-100 to-orange-100 rounded-lg p-6 border border-red-200">
                  <div className="line-through text-2xl text-muted-foreground mb-2">
                    De R$ 997
                  </div>
                  <div className="text-4xl font-bold text-primary mb-2">
                    R$ 297
                  </div>
                  <div className="text-red-600 font-medium">
                    ⚡ Apenas nesta oferta especial!
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    onClick={handleUpsellClick}
                    size="lg" 
                    className="w-full text-lg py-6 bg-gradient-to-r from-primary to-primary-variant hover:scale-105 transition-transform"
                  >
                    🚀 SIM! QUERO MINHA IA PRONTA
                  </Button>
                  
                  <p className="text-sm text-muted-foreground">
                    ✅ Pagamento 100% seguro • ⚡ Processo automático
                  </p>
                </div>
                
                <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-medium text-sm">
                    ⏰ Esta oferta expira em 24 horas!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Dúvidas? Entre em contato conosco pelo suporte
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
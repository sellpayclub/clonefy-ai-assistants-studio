import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, ExternalLink } from "lucide-react";

interface UpgradeBannerProps {
  type: 'assistants' | 'connections';
  currentCount: number;
  maxCount: number;
}

export const UpgradeBanner = ({ type, currentCount, maxCount }: UpgradeBannerProps) => {
  const handleUpgrade = () => {
    window.open('https://pay.plataformasellpay.com.br/checkout-white-6917/?add-to-cart=6917', '_blank');
  };

  const typeText = type === 'assistants' ? 'agentes' : 'conexões WhatsApp';

  return (
    <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="p-3 bg-orange-500/10 rounded-full">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
              Limite de {typeText} atingido!
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-200 mb-2">
              Você está usando <strong>{currentCount}/{maxCount}</strong> {typeText} disponíveis. 
              Faça upgrade para criar mais!
            </p>
            <div className="text-sm text-orange-600 dark:text-orange-300">
              ✨ <strong>3 conexões + 3 agentes extras por R$ 97</strong>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <Button 
              onClick={handleUpgrade}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Fazer Upgrade
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
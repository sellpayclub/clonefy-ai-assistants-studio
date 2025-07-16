import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle, Circle, Bot, MessageSquare, Settings, X, ArrowRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path?: string;
  action?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao CLONEFY!",
    description: "Vamos te guiar pelos primeiros passos para criar seus agentes de IA e automatizar conversas no WhatsApp.",
    icon: <Bot className="h-5 w-5" />
  },
  {
    id: "create-agent",
    title: "Criar seu primeiro agente",
    description: "Configure um agente de IA personalizado com instruções específicas para seu negócio.",
    icon: <Bot className="h-5 w-5" />,
    path: "/assistants",
    action: "create-agent"
  },
  {
    id: "test-agent",
    title: "Testar conversas",
    description: "Experimente conversar com seu agente para verificar se está respondendo como esperado.",
    icon: <MessageSquare className="h-5 w-5" />,
    path: "/conversations"
  },
  {
    id: "whatsapp-setup",
    title: "Conectar WhatsApp",
    description: "Configure a integração com WhatsApp para que seu agente atenda clientes automaticamente.",
    icon: <Settings className="h-5 w-5" />,
    path: "/whatsapp"
  }
];

export const OnboardingGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se o onboarding já foi completado
    const hasSeenOnboarding = localStorage.getItem("onboarding-completed");
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }

    // Carrega progresso salvo
    const savedProgress = localStorage.getItem("onboarding-progress");
    if (savedProgress) {
      setCompletedSteps(JSON.parse(savedProgress));
    }
  }, []);

  const handleStepComplete = (stepId: string) => {
    const newCompleted = [...completedSteps, stepId];
    setCompletedSteps(newCompleted);
    localStorage.setItem("onboarding-progress", JSON.stringify(newCompleted));
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAction = () => {
    const step = onboardingSteps[currentStep];
    if (step.path) {
      setIsOpen(false);
      navigate(step.path);
      
      // Se for criar agente, marca como trigger para abrir modal
      if (step.action === "create-agent") {
        localStorage.setItem("trigger-create-agent", "true");
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("onboarding-completed", "true");
  };

  const currentStepData = onboardingSteps[currentStep];
  const isCompleted = completedSteps.includes(currentStepData.id);
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <>
      {/* Trigger Button - aparece se onboarding foi fechado mas não completado */}
      {!isOpen && !localStorage.getItem("onboarding-completed") && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button onClick={() => setIsOpen(true)} className="rounded-full shadow-lg">
            <Bot className="h-4 w-4 mr-2" />
            Guia de Início
          </Button>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  {currentStepData.icon}
                </div>
                <div>
                  <DialogTitle className="text-lg">{currentStepData.title}</DialogTitle>
                  <Badge variant="secondary" className="text-xs">
                    Passo {currentStep + 1} de {onboardingSteps.length}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
              />
            </div>

            {/* Step Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {currentStepData.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{currentStepData.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {isCompleted ? "Completado" : "Pendente"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {currentStepData.description}
                </CardDescription>
              </CardContent>
            </Card>

            {/* All Steps Overview */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Progresso Geral:</h4>
              <div className="grid grid-cols-2 gap-2">
                {onboardingSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${
                      index === currentStep 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                    <span className="truncate">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              <div className="flex gap-2">
                {currentStepData.path && (
                  <Button onClick={handleAction}>
                    Ir para {currentStepData.title}
                  </Button>
                )}
                
                {!isLastStep ? (
                  <Button variant="outline" onClick={handleNext}>
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleClose}>
                    Finalizar Guia
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
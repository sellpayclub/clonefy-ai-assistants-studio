import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Clock, MessageSquare, Sparkles } from "lucide-react";

interface MessageStep {
  step: number;
  delay_hours: number;
  message_template: string;
}

interface MessageSequenceEditorProps {
  sequence: MessageStep[];
  onChange: (sequence: MessageStep[]) => void;
  variables?: string[];
}

const defaultVariables = ["{nome}", "{negocio}", "{link}", "{produto}"];

const MessageSequenceEditor = ({ 
  sequence, 
  onChange, 
  variables = defaultVariables 
}: MessageSequenceEditorProps) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const addStep = () => {
    const newStep: MessageStep = {
      step: sequence.length + 1,
      delay_hours: sequence.length === 0 ? 0.5 : 24,
      message_template: ""
    };
    onChange([...sequence, newStep]);
    setExpandedStep(newStep.step);
  };

  const removeStep = (stepNumber: number) => {
    const filtered = sequence.filter(s => s.step !== stepNumber);
    // Renumerate steps
    const renumbered = filtered.map((s, idx) => ({ ...s, step: idx + 1 }));
    onChange(renumbered);
  };

  const updateStep = (stepNumber: number, field: keyof MessageStep, value: any) => {
    const updated = sequence.map(s => 
      s.step === stepNumber ? { ...s, [field]: value } : s
    );
    onChange(updated);
  };

  const insertVariable = (stepNumber: number, variable: string) => {
    const step = sequence.find(s => s.step === stepNumber);
    if (step) {
      updateStep(stepNumber, 'message_template', step.message_template + variable);
    }
  };

  const formatDelay = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutos`;
    } else if (hours === 1) {
      return "1 hora";
    } else if (hours < 24) {
      return `${hours} horas`;
    } else if (hours === 24) {
      return "1 dia";
    } else {
      return `${Math.round(hours / 24)} dias`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Sequência de Mensagens
        </CardTitle>
        <CardDescription>
          Configure os templates de cada follow-up. Use variáveis como {'{nome}'} para personalizar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Variables Info */}
        <div className="bg-muted/50 rounded-lg p-3 border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Variáveis disponíveis:</p>
          <div className="flex flex-wrap gap-1">
            {variables.map(v => (
              <Badge key={v} variant="secondary" className="text-xs font-mono">
                {v}
              </Badge>
            ))}
          </div>
        </div>

        {/* Steps */}
        {sequence.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma mensagem configurada</p>
            <p className="text-xs">Adicione etapas para criar sua sequência de follow-up</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sequence.map((step, idx) => (
              <div 
                key={step.step}
                className={`border rounded-lg transition-all ${
                  expandedStep === step.step ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                {/* Step Header */}
                <div 
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedStep(expandedStep === step.step ? null : step.step)}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        Etapa {step.step}
                      </Badge>
                      {idx > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          após {formatDelay(step.delay_hours)}
                        </span>
                      )}
                      {idx === 0 && (
                        <span className="text-xs text-muted-foreground">
                          • Primeiro contato
                        </span>
                      )}
                    </div>
                    {step.message_template && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {step.message_template.substring(0, 60)}...
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStep(step.step);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Expanded Content */}
                {expandedStep === step.step && (
                  <div className="px-3 pb-3 space-y-4 border-t pt-3">
                    {/* Delay */}
                    {idx > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">Aguardar antes de enviar</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={step.delay_hours}
                            onChange={(e) => updateStep(step.step, 'delay_hours', parseFloat(e.target.value) || 1)}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">horas</span>
                          <div className="flex gap-1 ml-auto">
                            {[0.5, 1, 2, 4, 24, 48, 72].map(h => (
                              <Button
                                key={h}
                                variant={step.delay_hours === h ? "default" : "outline"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => updateStep(step.step, 'delay_hours', h)}
                              >
                                {formatDelay(h)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message Template */}
                    <div className="space-y-2">
                      <Label className="text-sm">Template da Mensagem</Label>
                      <Textarea
                        value={step.message_template}
                        onChange={(e) => updateStep(step.step, 'message_template', e.target.value)}
                        placeholder={`Ex: Olá {nome}! Vi que você demonstrou interesse em nossos serviços...`}
                        className="min-h-[120px] font-mono text-sm"
                      />
                      <div className="flex flex-wrap gap-1">
                        {variables.map(v => (
                          <Button
                            key={v}
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => insertVariable(step.step, v)}
                          >
                            {v}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Preview */}
                    {step.message_template && (
                      <div className="space-y-2">
                        <Label className="text-sm flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Preview
                        </Label>
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm">
                          {step.message_template
                            .replace('{nome}', 'João')
                            .replace('{negocio}', 'Seu Negócio')
                            .replace('{link}', 'https://seunegocio.com')
                            .replace('{produto}', 'Produto X')
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Step Button */}
        <Button
          variant="outline"
          onClick={addStep}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Etapa {sequence.length + 1}
        </Button>

        {/* Tip */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
          <Sparkles className="h-4 w-4 text-blue-500 mt-0.5" />
          <div>
            <p className="font-medium text-blue-700 dark:text-blue-400">Dica: Modo IA Generativa</p>
            <p>Se você deixar o template vazio, a IA irá gerar uma mensagem personalizada automaticamente com base nos dados do lead e do seu negócio.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageSequenceEditor;

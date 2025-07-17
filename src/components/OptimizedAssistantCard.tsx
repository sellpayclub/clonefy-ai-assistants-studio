import React, { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Edit, Trash2, MessageSquare, Settings, Code } from "lucide-react";

interface Assistant {
  id: string;
  name: string;
  description: string;
  instructions: string;
  model: string;
  openai_assistant_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OptimizedAssistantCardProps {
  assistant: Assistant;
  onEdit: (assistant: Assistant) => void;
  onDelete: (assistant: Assistant) => void;
  onTest: (assistant: Assistant) => void;
  onEmbed: (assistant: Assistant) => void;
}

export const OptimizedAssistantCard = memo(({
  assistant,
  onEdit,
  onDelete,
  onTest,
  onEmbed
}: OptimizedAssistantCardProps) => {
  // Memoize the truncated instructions to avoid recalculating
  const truncatedInstructions = React.useMemo(() => {
    const instructions = assistant.instructions || "Nenhuma instrução definida";
    return instructions.length > 100 ? `${instructions.substring(0, 100)}...` : instructions;
  }, [assistant.instructions]);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{assistant.name}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                GPT-4o
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(assistant)}
              aria-label="Editar assistente"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(assistant)}
              aria-label="Excluir assistente"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {assistant.description && (
          <CardDescription>{assistant.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            <strong>Instruções:</strong>
          </div>
          <p className="text-sm line-clamp-3">
            {truncatedInstructions}
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          <Button 
            size="sm" 
            className="flex-1" 
            onClick={() => onTest(assistant)}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Testar
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onEmbed(assistant)}
            aria-label="Gerar código embed"
          >
            <Code className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onEdit(assistant)}
            aria-label="Configurações"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedAssistantCard.displayName = "OptimizedAssistantCard";
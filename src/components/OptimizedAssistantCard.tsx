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
    <Card className="group hover:shadow-card transition-all duration-300 hover:scale-[1.02] h-full flex flex-col border-border/50 hover:border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm flex-shrink-0">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                {assistant.name}
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-medium mt-1.5 bg-muted/60">
                GPT-4o
              </Badge>
            </div>
          </div>
          <div className="flex gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-muted/60"
              onClick={() => onEdit(assistant)}
              aria-label="Editar assistente"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(assistant)}
              aria-label="Excluir assistente"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {assistant.description && (
          <CardDescription className="text-sm leading-relaxed mt-3 text-muted-foreground/80">
            {assistant.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Instruções
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">
            {truncatedInstructions}
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-border/40">
          <Button 
            size="sm" 
            className="col-span-2 h-9 text-sm font-medium shadow-sm" 
            onClick={() => onTest(assistant)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Testar
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-9 hover:bg-muted/60"
            onClick={() => onEmbed(assistant)}
            aria-label="Gerar código embed"
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedAssistantCard.displayName = "OptimizedAssistantCard";
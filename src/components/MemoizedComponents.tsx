import React, { memo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Componentes memoizados para melhor performance

interface ConnectionCardProps {
  connection: {
    id: number;
    nomeinstancia: string;
    idassistentgpt: string;
    whatsappuser?: string;
    created_at: string;
    IDvoz?: string;
    ApiELEVEN?: string;
  };
  assistantName: string;
  onDelete: (id: number) => void;
  onUpdate?: (id: number, updates: any) => void;
  children?: React.ReactNode;
}

export const MemoizedConnectionCard = memo<ConnectionCardProps>(({ 
  connection, 
  assistantName, 
  onDelete, 
  onUpdate,
  children 
}) => {
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {connection.nomeinstancia}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Assistente: {assistantName}
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {connection.whatsappuser ? 'Conectado' : 'Pendente'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {children}
        
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(connection.id)}
            className="w-full sm:w-auto"
          >
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

MemoizedConnectionCard.displayName = 'MemoizedConnectionCard';

interface AssistantSelectorProps {
  assistants: Array<{ id: string; name: string }>;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const MemoizedAssistantSelector = memo<AssistantSelectorProps>(({ 
  assistants, 
  value, 
  onValueChange, 
  placeholder = "Selecione um assistente" 
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="w-full p-2 border rounded-md bg-background"
    >
      <option value="">{placeholder}</option>
      {assistants.map((assistant) => (
        <option key={assistant.id} value={assistant.id}>
          {assistant.name}
        </option>
      ))}
    </select>
  );
});

MemoizedAssistantSelector.displayName = 'MemoizedAssistantSelector';
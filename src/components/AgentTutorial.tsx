import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  Bot, 
  MessageSquare, 
  Target, 
  Lightbulb, 
  CheckCircle2,
  Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExampleProps {
  title: string;
  description: string;
  example: string;
  category: string;
}

const InstructionExample = ({ title, description, example, category }: ExampleProps) => {
  const { toast } = useToast();
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Exemplo copiado para a área de transferência",
    });
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="font-medium text-sm">{title}</h4>
          <Badge variant="outline" className="text-xs">{category}</Badge>
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => copyToClipboard(example)}
          className="h-8 w-8 p-0"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="bg-muted rounded p-3">
        <pre className="text-xs whitespace-pre-wrap font-mono">{example}</pre>
      </div>
    </div>
  );
};

const AgentTutorial = () => {
  const [openSections, setOpenSections] = useState<string[]>(['basics']);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const examples = [
    {
      title: "Atendente de Vendas",
      description: "Agente focado em conversão e vendas",
      category: "Vendas",
      example: `Você é um consultor de vendas experiente e amigável. Seu objetivo é ajudar clientes a encontrarem a melhor solução para suas necessidades.

PERSONALIDADE:
- Seja entusiasta e positivo
- Use uma linguagem acessível 
- Demonstre empatia e compreensão
- Seja persistente mas respeitoso

PROCESSO DE VENDAS:
1. Cumprimente e se apresente
2. Identifique a necessidade do cliente fazendo perguntas abertas
3. Apresente soluções adequadas
4. Responda objeções com argumentos sólidos
5. Feche a venda ou agende um follow-up

REGRAS:
- Sempre pergunte o nome do cliente
- Foque nos benefícios, não apenas características
- Use exemplos e casos de sucesso quando relevante
- Se não souber algo, seja honesto e busque a informação`
    },
    {
      title: "Suporte Técnico",
      description: "Agente especializado em resolver problemas técnicos",
      category: "Suporte",
      example: `Você é um especialista em suporte técnico paciente e didático. Sua missão é resolver problemas de forma clara e eficiente.

PERSONALIDADE:
- Seja paciente e compreensivo
- Use linguagem técnica apropriada ao nível do usuário
- Mantenha-se calmo mesmo em situações estressantes
- Demonstre empatia com a frustração do cliente

METODOLOGIA:
1. Escute o problema completamente
2. Faça perguntas específicas para diagnóstico
3. Explique a solução passo a passo
4. Confirme se o problema foi resolvido
5. Documente a solução para futuros casos

REGRAS:
- Sempre confirme o entendimento antes de prosseguir
- Use analogias simples para explicar conceitos técnicos
- Ofereça alternativas quando a primeira solução não funcionar
- Escale para especialistas quando necessário`
    },
    {
      title: "Educador/Tutor",
      description: "Agente focado em ensino e aprendizagem",
      category: "Educação",
      example: `Você é um tutor dedicado e inspirador. Seu objetivo é facilitar o aprendizado de forma envolvente e eficaz.

PERSONALIDADE:
- Seja encorajador e motivador
- Adapte sua linguagem ao nível do estudante
- Celebre pequenas conquistas
- Seja paciente com dificuldades

METODOLOGIA DE ENSINO:
1. Avalie o nível atual de conhecimento
2. Estabeleça objetivos claros
3. Explique conceitos de forma progressiva
4. Use exemplos práticos e relevantes
5. Faça perguntas para verificar compreensão
6. Forneça exercícios e desafios

REGRAS:
- Sempre verifique se o aluno entendeu antes de avançar
- Use analogias e metáforas para facilitar compreensão
- Encoraje perguntas e curiosidade
- Ofereça recursos adicionais quando apropriado`
    },
    {
      title: "Assistente Pessoal",
      description: "Agente para tarefas gerais e organização",
      category: "Geral",
      example: `Você é um assistente pessoal eficiente e organizado. Sua função é ajudar com tarefas do dia a dia e fornecer informações úteis.

PERSONALIDADE:
- Seja proativo e antecipe necessidades
- Mantenha tom profissional mas amigável
- Seja conciso mas completo nas respostas
- Demonstre iniciativa em sugestões

ÁREAS DE ATUAÇÃO:
- Agendamento e lembretes
- Pesquisa de informações
- Organização de tarefas
- Recomendações personalizadas
- Planejamento e logística

REGRAS:
- Sempre confirme detalhes importantes
- Ofereça opções quando possível
- Mantenha informações organizadas e acessíveis
- Respeite privacidade e confidencialidade
- Seja proativo em sugestões relevantes`
    }
  ];

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Tutorial: Como Criar e Treinar seu Agente
        </CardTitle>
        <CardDescription>
          Aprenda a criar agentes inteligentes e eficazes com nossas dicas e exemplos práticos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Seção Básica */}
        <Collapsible open={openSections.includes('basics')} onOpenChange={() => toggleSection('basics')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="font-medium">1. Fundamentos Básicos</span>
              </div>
              {openSections.includes('basics') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Nome do Agente
                </h4>
                <p className="text-xs text-muted-foreground">
                  Escolha um nome claro e descritivo que reflita a função do agente.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Descrição
                </h4>
                <p className="text-xs text-muted-foreground">
                  Adicione uma descrição breve para facilitar a identificação posterior.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Seção de Instruções */}
        <Collapsible open={openSections.includes('instructions')} onOpenChange={() => toggleSection('instructions')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span className="font-medium">2. Escrevendo Instruções Eficazes</span>
              </div>
              {openSections.includes('instructions') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-3 space-y-3">
            <div className="space-y-3">
              <div className="bg-muted/50 rounded p-3 space-y-2">
                <h4 className="font-medium text-sm">Estrutura Recomendada:</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• <strong>Papel/Identidade:</strong> "Você é um..."</li>
                  <li>• <strong>Personalidade:</strong> Tom de voz, características</li>
                  <li>• <strong>Objetivo:</strong> O que deve alcançar</li>
                  <li>• <strong>Processo:</strong> Como deve conduzir conversas</li>
                  <li>• <strong>Regras:</strong> O que fazer e não fazer</li>
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Seção de Dicas */}
        <Collapsible open={openSections.includes('tips')} onOpenChange={() => toggleSection('tips')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span className="font-medium">3. Dicas Importantes</span>
              </div>
              {openSections.includes('tips') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-green-600">✓ Faça</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Seja específico e detalhado</li>
                  <li>• Use exemplos de situações</li>
                  <li>• Defina limites claros</li>
                  <li>• Inclua contexto relevante</li>
                  <li>• Teste e refine constantemente</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-red-600">✗ Evite</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Instruções vagas ou genéricas</li>
                  <li>• Contradições nas regras</li>
                  <li>• Excesso de informação</li>
                  <li>• Linguagem muito técnica</li>
                  <li>• Objetivos conflitantes</li>
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Seção de Exemplos */}
        <Collapsible open={openSections.includes('examples')} onOpenChange={() => toggleSection('examples')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">4. Exemplos Práticos</span>
              </div>
              {openSections.includes('examples') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {examples.map((example, index) => (
                <InstructionExample
                  key={index}
                  title={example.title}
                  description={example.description}
                  example={example.example}
                  category={example.category}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

      </CardContent>
    </Card>
  );
};

export default AgentTutorial;
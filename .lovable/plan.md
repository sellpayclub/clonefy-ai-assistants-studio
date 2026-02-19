

# IA Classifica Etapas Automaticamente + Remover Chat Flutuante

## Resumo

Duas mudancas simples e seguras:
1. A IA que ja analisa cada conversa passa a tambem classificar a **etapa do pipeline** automaticamente
2. Remover o chat flutuante de suporte da plataforma

---

## 1. IA classifica pipeline_stage automaticamente

### Como funciona hoje
A IA ja analisa cada conversa (WhatsApp e Widget) e extrai: `lead_score`, `urgency_level`, `sentiment`, `next_action`, `key_topics`, etc. Mas **nao classifica a etapa do pipeline** — todos os leads ficam como "novo".

### O que muda
Adicionar `"pipeline_stage"` ao JSON que a IA retorna na analise. A IA vai escolher a etapa com base na conversa:

```text
"pipeline_stage": "novo | contato feito | qualificado | proposta | negociacao | fechado | perdido"
```

### Regras para a IA classificar
Vamos adicionar instrucoes claras no prompt:
- **novo**: Primeiro contato, sem conversa relevante ainda
- **contato feito**: Ja houve troca de mensagens, cliente respondeu
- **qualificado**: Cliente demonstrou interesse real, fez perguntas especificas
- **proposta**: Preco/proposta foi discutido ou enviado
- **negociacao**: Cliente esta comparando, pedindo desconto, negociando condicoes
- **fechado**: Cliente confirmou compra ou aceitou proposta
- **perdido**: Cliente recusou, sumiu, ou disse que nao quer

### Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/whatsapp-webhook/index.ts` | Adicionar `pipeline_stage` no prompt JSON e no mapeamento de dados |
| `supabase/functions/widget-chat/index.ts` | Mesma alteracao |

### Seguranca
- E apenas uma linha a mais no prompt da IA (que ja funciona)
- E apenas uma linha a mais no mapeamento de dados (mesmo padrao das outras)
- Se a IA nao retornar o campo, o default "novo" continua (coluna tem DEFAULT)
- Se o usuario moveu manualmente para outra etapa, a IA pode atualizar na proxima analise (comportamento desejado — IA sempre reflete o estado real da conversa)

---

## 2. Remover chat flutuante de suporte

### Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/App.tsx` | Remover import e uso de `ConditionalSupportWidget` |
| `src/components/ConditionalSupportWidget.tsx` | Deletar arquivo |
| `src/components/SupportChatWidget.tsx` | Deletar arquivo |

### O que NAO sera removido
- `ChatWidget.tsx` (usado na pagina de vendas Espanol)
- `embed-widget.js` / `embed-widget-v2.js` (usados pelos clientes nos seus sites)

---

## Detalhes tecnicos

### Mudanca no prompt (whatsapp-webhook, ~linha 1629)
Adicionar ao JSON schema do prompt:
```text
"pipeline_stage": "novo | contato feito | qualificado | proposta | negociacao | fechado | perdido - classifique baseado no estagio REAL da negociacao na conversa"
```

### Mudanca no mapeamento (whatsapp-webhook, ~linha 1687)
Adicionar apos `if (profiling.sentiment)`:
```text
if (profiling.pipeline_stage) leadData.pipeline_stage = profiling.pipeline_stage;
```

### Mesmas duas mudancas no widget-chat (~linhas 145 e 202)

Totalizando: 4 linhas adicionadas em 2 edge functions + limpeza do chat flutuante.



## O que muda

Só os prompts dos 2 webhooks. Nenhum outro arquivo é tocado.

### Problema atual
O prompt atual diz:
- `"Análise DETALHADA em 3-5 parágrafos: contexto da conversa, necessidades identificadas..."`
- `"SEJA DETALHADO! O vendedor vai usar essa análise para fechar a venda."`

Isso instrui o modelo a escrever como consultor de negócios — linguagem técnica e formal.

### A correção
Mudar a instrução de tom nos dois arquivos para algo como:

**`intent_summary`** — pedir linguagem simples, como se explicasse para um amigo:
> "Escreva em linguagem simples e direta, como se contasse para um colega o que o cliente quer. Sem jargões."

**`conversation_analysis`** — pedir texto fácil de ler:
> "Use linguagem simples e humana. Explique o que aconteceu na conversa, o que o cliente quer, se parece interessado e o que o vendedor deve fazer. Como se fosse um resumo para alguém que não leu a conversa."

**`next_action`** — já está ok, mas reforçar clareza:
> "Diga claramente o que fazer a seguir, em uma frase curta e direta."

**Instrução geral no final do prompt** — trocar:
- Antes: `"SEJA DETALHADO! O vendedor vai usar essa análise para fechar a venda."`
- Depois: `"Escreva tudo em linguagem simples, direta e fácil de entender. Como se fosse explicar para alguém que não é especialista. Evite palavras difíceis, siglas ou termos corporativos."`

### Arquivos alterados
| Arquivo | Mudança |
|---|---|
| `supabase/functions/whatsapp-webhook/index.ts` | Atualizar instruções de `intent_summary`, `conversation_analysis` e instrução final do prompt |
| `supabase/functions/widget-chat/index.ts` | Mesma mudança |

Zero alterações em frontend, banco de dados ou qualquer outro arquivo.

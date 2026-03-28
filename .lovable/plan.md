

## Revisão Completa — Problemas Encontrados e Correções

### Problemas Identificados

#### 1. BUG REAL: Cache incoerente no `loadData` (linhas 194-196)
No bloco de `assistants`, as linhas 195-196 fazem cache de `connectionsData` que **ainda pode ser `undefined`** nesse ponto (se connections está sendo carregada em paralelo e ainda não retornou). Isso salva `undefined` no cache de conexões.

```
// Dentro do bloco 'assistants':
performanceCache.set(connectionsCacheKey, connectionsData, 10); // connectionsData pode ser undefined aqui!
```

Esse cache já é feito corretamente no bloco `connections` (linha 204), então as linhas 195-196 dentro do bloco `assistants` devem ser removidas. A linha 195 (cache assistants) deve permanecer mas ser movida para o lugar correto.

**Correção**: Mover `performanceCache.set(assistantsCacheKey, assistantsData, 15)` para logo após `assistantsData = response.data.assistants` e remover a linha 196.

#### 2. BUG: Follow-up toggle/input usa `defaultChecked={false}` e `defaultValue={5}` fixos
Os valores de `followup_enabled` e `followup_delay_minutes` não vêm da conexão carregada — sempre mostram `false` e `5` independente do que está salvo no banco. O usuário ativa, recarrega a página, e vê desativado de novo (embora no banco esteja ativo).

**Correção**: Carregar os valores de `followup_enabled` e `followup_delay_minutes` da tabela `n8n_fluxogpt` e usar como valores iniciais. Opções:
- Adicionar esses campos na interface `WhatsAppConnection` e retorná-los na edge function `whatsapp-evolution` (action `list`)
- Ou fazer uma query separada no frontend para cada conexão

A melhor abordagem: adicionar `followup_enabled` e `followup_delay_minutes` na resposta da edge function `whatsapp-evolution` quando lista conexões, pois ela já faz `SELECT *` da tabela `n8n_fluxogpt`.

#### 3. BUG: RLS pode bloquear updates do follow-up no frontend
O frontend faz `supabase.from('n8n_fluxogpt').update(...)` com o anon key. Preciso verificar se há RLS policies na tabela `n8n_fluxogpt` que permitam isso. Como a tabela não está na lista de RLS policies fornecida, provavelmente RLS não está habilitado nessa tabela ou está habilitado sem policies — o que bloquearia tudo.

**Correção**: Verificar e garantir que a tabela tem uma policy que permite UPDATE pelo usuário autenticado via email match.

#### 4. MENOR: Grupo toggle também usa `defaultChecked={false}` fixo (mesmo problema do item 2 mas pré-existente)

#### 5. MENOR: Indentação irregular nas linhas 194-196 (cosmético, mas indica o bug de cópia errada)

### Plano de Correções

| Arquivo | Correção |
|---|---|
| `src/pages/WhatsApp.tsx` | Corrigir cache bug (linhas 194-196); usar valores reais do banco para toggle/input do follow-up |
| `src/pages/WhatsApp.tsx` | Adicionar `followup_enabled` e `followup_delay_minutes` à interface `WhatsAppConnection` |
| `supabase/functions/whatsapp-evolution/index.ts` | Verificar que `SELECT *` já retorna os novos campos (já faz, pois é `SELECT *`) |
| Nova migração SQL | Adicionar RLS policy para permitir UPDATE na `n8n_fluxogpt` pelo usuário autenticado (match por `emailuser`) — se necessário |
| `src/pages/Changelog.tsx` | OK, sem problemas |

### Prioridade
1. **Crítico**: Fix cache bug (pode causar perda de dados de conexões no cache)
2. **Crítico**: Fix follow-up toggle mostrando sempre desativado (UX quebrada)
3. **Importante**: Verificar/adicionar RLS policy para updates funcionarem


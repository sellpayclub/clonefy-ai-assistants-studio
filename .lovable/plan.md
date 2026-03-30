

## Plano: Aplicar apenas as 3 otimizações seguras

Mudanças isoladas, sem risco para usuários ativos.

### 1. `src/hooks/useDashboardStats.ts` — Remover realtime subscriptions
- Remover o segundo `useEffect` que cria 2 channels WebSocket (`assistants-stats`, `connections-stats`)
- Dados continuam carregando normalmente no mount — só param de escutar mudanças em tempo real (contadores de dashboard não precisam disso)
- **Risco**: Zero. Nenhuma funcionalidade depende de contadores atualizando em tempo real

### 2. `src/hooks/useUserLimits.ts` — Cache de 1min → 5min
- Mudar `performanceCache.set(cacheKey, newLimits, 1)` para `performanceCache.set(cacheKey, newLimits, 5)`
- O realtime subscription existente já invalida o cache quando os limites mudam no banco
- **Risco**: Zero. Backup de invalidação por realtime já existe

### 3. `src/hooks/useOptimizedAssistants.ts` — Remover debounce do load inicial
- Separar a função em `loadAssistants` (direto, sem debounce) para o primeiro carregamento
- Manter debounce apenas no `reloadAssistants` (para re-fetches manuais)
- **Risco**: Mínimo. Rate limiting interno (`lastLoadRef`) e cache check já protegem contra chamadas duplicadas

### O que NÃO será alterado
- Nenhuma página (WhatsApp, Assistants, Conversations) — auth local mantida intacta
- Nenhuma edge function
- Nenhuma rota ou componente de UI
- Nenhuma migração de banco


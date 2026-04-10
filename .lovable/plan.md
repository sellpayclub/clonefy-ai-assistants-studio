

## Plano: Garantir Follow-up Funcional para TODOS os Usuários (Antigos e Novos)

### Situação atual

| Instância | Contatos | followup_count | followup_enabled | Status |
|---|---|---|---|---|
| royalparma | 276 | 0-1 | true | ✅ Corrigido (já funciona) |
| AGENTE_PLX | 27 | 3 (bloqueado!) | false | ⚠️ Se ativar follow-up, não vai funcionar |
| secretaria_IA | 7 | 3 (bloqueado!) | false | ⚠️ Se ativar follow-up, não vai funcionar |

**Webhook** (para novos contatos): Já corrigido. Novos contatos nascem com `followup_count: 0` e herdam configurações da instância.

**Problema restante**: 34 contatos antigos (AGENTE_PLX + secretaria_IA) ainda têm `followup_count: 3`. Se esses usuários ativarem o follow-up no futuro, esses contatos antigos ficarão bloqueados.

### Correções necessárias

**1. Migration SQL — Resetar `followup_count` de TODOS os contatos antigos**

Atualizar todos os contatos com `followup_count = 3` para `followup_count = 0` em TODAS as instâncias. Isso garante que se qualquer usuário ativar follow-up, os contatos antigos já estarão prontos.

```sql
UPDATE n8n_fluxogpt
SET followup_count = 0
WHERE followup_count = 3
  AND whatsappuser NOT IN ('Conectado', 'Connected');
```

**2. Toggle do WhatsApp — Propagar `followup_count = 0` ao ativar**

No `src/pages/WhatsApp.tsx` (linha 1014-1017), quando o usuário ativa o toggle de follow-up, além de setar `followup_enabled = true`, também resetar `followup_count = 0` para garantir que contatos existentes sejam processados.

Mudar de:
```typescript
.update({ followup_enabled: checked })
```
Para:
```typescript
.update({ followup_enabled: checked, followup_count: 0 })
```

### Impacto
- **Usuários antigos**: 34 contatos bloqueados serão desbloqueados
- **Usuários novos**: Já cobertos pela correção anterior no webhook
- **Toggle futuro**: Sempre reseta contatos ao ativar follow-up
- Zero risco de quebrar funcionalidade existente (apenas muda `followup_count` de 3 para 0)

### Arquivos modificados
| Arquivo | Alteração |
|---|---|
| `src/pages/WhatsApp.tsx` | 1 linha: adicionar `followup_count: 0` no update do toggle |
| Nova migration SQL | Reset de `followup_count` para todos contatos bloqueados |




## Plano: Tornar CRM-only robusto para todos os clientes (atual e futuros)

### Diagnóstico atual (dados de produção)

| Item | Status | Evidência |
|---|---|---|
| Live Chat (LibidFem) | ✅ Funciona | 1 sessão criada com userId correto `814575e9` |
| CRM Lead (LibidFem) | ❌ Não criado | 0 leads para userId `814575e9` |
| userId resolução | ⚠️ Instável | 00:40 falhou `(não encontrado)`, 00:47 funcionou |

### Problema raiz

1. **userId instável**: O método Auth Admin API (`/auth/v1/admin/users?per_page=1000`) é frágil — depende de paginação e pode falhar em ambientes com muitos usuários. Funcionou às 00:47 mas falhou às 00:40.

2. **CRM lead não criado**: Quando userId falhou (00:40), o `if (userId)` no bloco CRM-only retornou sem criar lead. Quando funcionou (00:47), os logs indicam que o fluxo pode ter sido interrompido por buffer/timeout antes de chegar ao upsert.

### Correções (cirúrgicas, sem risco)

**1. Nova função SQL `get_user_id_by_email` (migration)**

Acessa `auth.users` diretamente via `SECURITY DEFINER` — sem paginação, sem API HTTP:
```sql
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(target_email text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = target_email LIMIT 1;
$$;
```

**2. Simplificar resolução de userId no webhook (linhas 742-776)**

Substituir o bloco inteiro de 34 linhas (fetch Auth Admin API) por 8 linhas com RPC:
```typescript
if (!userId && instanceConfig.emailuser) {
    const { data: resolvedId } = await supabase
        .rpc('get_user_id_by_email', { target_email: instanceConfig.emailuser });
    if (resolvedId) {
        userId = resolvedId;
        console.log('✅ userId resolvido via RPC:', userId);
    }
}
```

**3. Deploy do webhook**

### O que NÃO muda
- Todo o fluxo de conexões COM agente IA (userId vem de `assistantData.user_id`)
- Live Chat (já funciona para CRM-only)
- Lógica de follow-up
- Frontend
- Nenhum outro edge function

### Risco: zero
- A função SQL é `STABLE` e `SECURITY DEFINER` — consulta read-only
- O bloco `if (!userId)` só executa quando assistantData é null (CRM-only)
- Conexões com agente nunca entram nesse bloco (já têm userId)

### Arquivos
| Arquivo | Alteração |
|---|---|
| Nova migration SQL | Criar função `get_user_id_by_email` |
| `supabase/functions/whatsapp-webhook/index.ts` | Substituir linhas 742-776 por RPC (8 linhas) |
| Deploy | `whatsapp-webhook` |


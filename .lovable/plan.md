

## Plano: Corrigir Live Chat e CRM para Conexoes CRM-Only (sem agente IA)

### Problema raiz

Duas falhas impedem conexoes CRM-only (como LibidFem) de aparecerem no Live Chat e CRM:

1. **`userId` vazio**: A tabela `n8n_fluxogpt` nao tem coluna `userId`. Para conexoes com agente, o `user_id` vem de `assistantData.user_id`. Para CRM-only, `assistantData` e null, entao `userId` fica `''` — e nenhuma sessao/mensagem/lead e criada.

2. **CRM lead nunca criado**: A funcao `saveLeadToCRM` e chamada somente apos processamento da IA (linha 1785+). Como CRM-only sai na linha 1009, o lead nunca e criado.

### Correcoes no `whatsapp-webhook/index.ts`

**1. Resolver userId para CRM-only via `emailuser` → `auth.users`**

Apos a linha 740 (`const userId = ...`), adicionar logica:
```
Se userId estiver vazio E instanceConfig.emailuser existir:
  → Buscar auth.users.id pelo email
  → Usar como userId
```

Isso garante que `userId` sempre sera preenchido, pois toda instancia tem `emailuser`.

**2. Criar lead basico no CRM antes do exit CRM-only (linha 1009)**

Antes do `return` do CRM-only, inserir upsert basico em `crm_leads`:
```
- user_id: userId
- whatsapp_number: contactNumber  
- name: contactName
- source: 'whatsapp'
- last_interaction: now()
```

Sem analise de IA (nao tem agente), mas o lead aparece no CRM.

**3. Deploy do webhook**

### Impacto
- Live Chat: sessoes serao criadas corretamente (userId valido)
- CRM: leads serao criados na primeira mensagem
- Conexoes com agente: zero alteracao (userId ja vem de assistantData)
- Apenas `whatsapp-webhook/index.ts` sera editado


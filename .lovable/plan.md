

## Plano: Toggle "IA atende grupos" na conexão WhatsApp + remover Gestão de Grupos

### O que vamos fazer

1. **Adicionar um Switch "IA atende grupos" dentro de cada card de conexão** na página WhatsApp (`src/pages/WhatsApp.tsx`)
   - Um toggle simples (Switch) logo abaixo dos detalhes da conexão, ao lado das configs de voz ElevenLabs
   - Quando ativado: chama `supabase.functions.invoke('group-connection', { body: { action: 'configure_webhook', user_id, enabled: true } })` — mesma lógica que já existe em GroupManagement
   - Quando desativado: mesma chamada com `enabled: false`
   - Visual: ícone Users + "IA responde em grupos" + Switch on/off
   - Só aparece quando a conexão está conectada (tem `whatsappuser`)

2. **Remover a página Gestão de Grupos**
   - Deletar `src/pages/GroupManagement.tsx`
   - Remover rota `/grupos` e lazy import de `App.tsx`
   - Remover qualquer referência no sidebar (já não está lá)

### Arquivos modificados

| Arquivo | Ação |
|---|---|
| `src/pages/WhatsApp.tsx` | Adicionar toggle "IA atende grupos" em cada card de conexão |
| `src/pages/GroupManagement.tsx` | Deletar |
| `src/App.tsx` | Remover rota `/grupos` e lazy import |

### Detalhe técnico

O toggle reutiliza a mesma Edge Function `group-connection` com action `configure_webhook`. A diferença é que agora ele fica embutido no card da conexão WhatsApp existente — sem página separada, sem fluxo de QR code dedicado para grupos. Simples: liga ou desliga.


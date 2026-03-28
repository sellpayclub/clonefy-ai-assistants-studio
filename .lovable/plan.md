

## Plano: Atualizar Changelog + Melhorar explicação do Follow-up na UI

### 1. Atualizar Changelog (`src/pages/Changelog.tsx`)

Adicionar nova entrada no topo da lista `v2.9` (ou adicionar item na v2.8 existente) com:
- "⏱️ Follow-up Automático — ative por conexão e defina o tempo de inatividade para disparo automático de 1 mensagem de reengajamento"

Opção mais limpa: adicionar o item na v2.8 existente (mesma data, 28 de março), já que é a versão atual.

### 2. Melhorar explicação contextual no card do Follow-up (`src/pages/WhatsApp.tsx`)

Expandir o texto explicativo no card amber do follow-up para que o usuário entenda claramente o que acontece:
- Adicionar um bloco de explicação mais detalhado abaixo do input de minutos, tipo um "Como funciona:" com bullets curtos:
  - "Quando ativado, o sistema monitora suas conversas"
  - "Se o bot foi o último a falar e o cliente não respondeu no tempo definido, envia 1 mensagem automática de reengajamento"
  - "Apenas 1 mensagem por conversa — sem spam"
  - "O contador reseta automaticamente quando o cliente responde"

### Arquivos modificados

| Arquivo | Ação |
|---|---|
| `src/pages/Changelog.tsx` | Adicionar item do follow-up na v2.8 |
| `src/pages/WhatsApp.tsx` | Expandir explicação no card amber |


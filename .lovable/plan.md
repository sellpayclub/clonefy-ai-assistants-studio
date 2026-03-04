
## O que o usuário quer vs. o que está implementado

O fluxo JÁ está correto tecnicamente. O `telegram-webhook` responde a **qualquer pessoa** que mandar mensagem pro bot — não só ao dono da conta. Funciona igual ao WhatsApp.

**O problema real não é de código** — é que o usuário não sabe como os clientes dele vão **encontrar e acessar o bot**. No WhatsApp, a instância se conecta ao número do cliente. No Telegram, os clientes precisam de um **link público** para iniciar conversa com o bot.

## O que está faltando na UI

Na página `/telegram`, quando o bot está conectado, não mostramos:
1. **O link público do bot** — `t.me/nomedobot` — que o usuário precisa compartilhar com os clientes
2. **Botão de copiar o link** para facilitar compartilhamento
3. **Explicação clara** de como os clientes acessam o bot

## Plano de mudança (só UI — nenhuma edge function muda)

**Arquivo: `src/pages/Telegram.tsx`**

- No card de cada bot conectado, adicionar:
  - Link clicável `t.me/{bot_username}` com botão de copiar
  - Texto explicativo: "Compartilhe este link com seus clientes para que eles possam conversar com a IA"
  
- Atualizar o card "Como funciona" com instrução clara de como compartilhar o link com clientes

- Adicionar um **Step 4** nos passos de configuração: "Compartilhe o link `t.me/seubot` com seus clientes — qualquer pessoa que acessar esse link poderá conversar com a IA"

Nenhuma mudança de banco, edge function ou lógica necessária. O sistema já responde a qualquer cliente, só precisa deixar claro na UI como o usuário compartilha o acesso com seus clientes.

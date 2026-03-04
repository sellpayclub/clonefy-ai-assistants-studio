
## Análise do fluxo atual — está correto?

Sim, o fluxo está **tecnicamente correto**. Quando você conecta um bot:

1. `telegram-setup` chama `setWebhook` registrando a URL:
   `https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/telegram-webhook?token=SEU_TOKEN`

2. Qualquer pessoa que mandar mensagem pro seu bot no Telegram → Telegram faz POST para essa URL → `telegram-webhook` processa → OpenAI responde → bot responde no Telegram.

**Porém há 1 problema real identificado:** a conversa também aparece no **Live Chat** na plataforma, mas o Live Chat precisa ter o badge "Telegram" exibido corretamente na UI da sessão. Preciso verificar como o `SessionsList` renderiza o campo `source`.

Além disso, há uma coisa importante a comunicar ao usuário de forma clara — o fluxo completo de como funciona — sem necessidade de mudanças de código, apenas confirmação.

**Verificação rápida do SessionsList para badge Telegram:**

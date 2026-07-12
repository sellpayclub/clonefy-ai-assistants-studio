# Corrigir tamanho/scroll do Chat ao Vivo

## Problema
Ao abrir uma conversa com muitas mensagens, a janela do chat cresce indefinidamente e fica impossível de ler. O usuário precisa rolar a página inteira em vez de rolar só dentro do chat, e o campo de digitar some para baixo.

## Causa raiz
A cadeia de flex não está restringindo a altura da área de mensagens:

```text
main (h-screen, overflow-hidden)          -> OK
  div (flex-1 flex overflow-hidden)        -> OK
    div (flex-1 bg-muted/30)               -> FALTA min-h-0 / overflow-hidden
      ChatWindow (h-full flex flex-col)    -> OK
        ScrollArea (flex-1 p-6)            -> FALTA min-h-0  <-- estoura aqui
```

Sem `min-h-0`, um item flex assume altura mínima igual ao conteúdo, então a lista de mensagens empurra o container e "estica" o chat conforme o número de mensagens, em vez de manter altura fixa com scroll interno.

Além disso, o auto-scroll (`scrollRef`) está preso no elemento raiz do `ScrollArea` (que tem `overflow-hidden`), e não no viewport que realmente rola — por isso o scroll automático para a última mensagem não funciona de forma confiável.

## Correção (somente front-end / layout)

### 1. `src/pages/LiveChat.tsx`
- No container da janela de chat (`<div className="flex-1 bg-muted/30">`), adicionar `min-h-0 overflow-hidden` para travar a altura da coluna.

### 2. `src/components/live-chat/ChatWindow.tsx`
- Adicionar `min-h-0` ao container raiz (`h-full flex flex-col`) e à `ScrollArea` das mensagens, garantindo que a lista tenha altura fixa e role internamente.
- Manter header e input com `shrink-0` para ficarem sempre visíveis (o input nunca some para baixo).
- Corrigir o auto-scroll: apontar o ref para o viewport real do `ScrollArea` (elemento com `data-radix-scroll-area-viewport`) em vez do root, para que ele role de fato até a última mensagem ao abrir/receber mensagens.
- Opcional de leitura: limitar a largura da coluna de mensagens (ex.: `max-w-3xl mx-auto`) para conversas longas ficarem mais confortáveis de ler, mantendo o mesmo padrão já aplicado na página de Conversas.

## Resultado esperado
- A janela do chat ocupa sempre a altura da tela (fixa), independente do número de mensagens.
- Rolagem acontece só dentro da lista de mensagens; header e campo de digitar permanecem fixos e visíveis.
- Ao abrir uma conversa, o chat já posiciona na última mensagem automaticamente.

## Observação
Mudança puramente de layout/UX no front-end. Não altera lógica de negócio, Supabase, takeover da IA nem edge functions.
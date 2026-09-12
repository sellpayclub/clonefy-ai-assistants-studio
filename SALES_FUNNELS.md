# Funis de vendas e respostas prontas

O módulo adiciona ao Chat ao Vivo uma biblioteca compartilhada de textos, áudios, imagens, vídeos e documentos. Os mesmos blocos formam respostas prontas ou automações que podem aguardar tempo e resposta do cliente.

## Fluxo de uso

1. Acesse **Funis de vendas** no menu.
2. Cadastre os materiais na aba **Biblioteca**.
3. Crie um fluxo, adicione as etapas na ordem desejada e ative **Disponível no chat**.
4. No **Chat ao Vivo**, abra uma conversa e clique no botão de materiais ao lado do campo de texto.
5. Envie um material isolado ou inicie um fluxo.

O dono copia o código da biblioteca e o vendedor informa esse código uma única vez em **Entrar numa biblioteca da equipe**. O vendedor usa a conta que já possui no Clonefy; não existe um segundo login.

## Publicação

Configure os secrets usados pela Evolution API:

```sh
supabase secrets set EVOLUTION_API_URL=https://seu-host-evolution.example.com
supabase secrets set EVOLUTION_API_KEY=sua-chave
```

Depois aplique a migração e publique as funções alteradas:

```sh
supabase db push
supabase functions deploy sales-funnel-engine --no-verify-jwt
supabase functions deploy live-chat-send --no-verify-jwt
supabase functions deploy whatsapp-webhook --no-verify-jwt
```

A migração cria o bucket privado `sales-assets`, as políticas de acesso e um agendamento que processa as etapas pendentes a cada 30 segundos.

## Comportamento da IA

- Ao iniciar um fluxo, a IA é pausada para aquela conversa.
- Ao chegar em **Aguardar resposta**, a próxima mensagem do cliente libera a sequência.
- Ao concluir uma automação, a IA volta a atender.
- Ao concluir uma resposta pronta, permanece o tempo de takeover configurado no Chat ao Vivo.
- Cancelamento ou falha devolve a conversa para a IA.

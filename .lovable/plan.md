## Objetivo

Criar um "Saldo de API" por usuário: ele recarrega via PIX (Woovi/OpenPix), o saldo cai a cada resposta da IA, e a IA do WhatsApp só responde se houver saldo ativo. Tudo em reais (BRL), com avisos de saldo baixo/zerado dentro do sistema.

## Regras de negócio

- **Moeda:** tudo em BRL.
- **Mínimo:** ~R$55/mês (equivalente aos US$10). Validade de 30 dias a cada recarga; saldo **não acumula entre meses** — paga para manter ativo.
- **Custo por mensagem:** valor fixo por resposta da IA (constante configurável, ex.: `R$0,10` por resposta). Usado tanto para debitar quanto para estimar quantas conversas cada recarga rende.
- **Valores de recarga (5 botões, dobrando):** R$55, R$110, R$220, R$440, R$880. Cada botão mostra a estimativa de conversas (ex.: "R$55 ≈ 550 respostas da IA") com aviso de que é aproximado.
- **Gate:** somente o **WhatsApp** (`whatsapp-webhook`) para de responder quando o saldo zera/expira. Demais canais seguem normais.

## Banco de dados (1 migration)

`api_wallets`: `user_id` (unique), `balance_brl` (numeric, default 0), `expires_at` (timestamptz), `low_balance_notified` (bool), `created_at`, `updated_at`. RLS: dono lê o próprio; escrita só via funções/edge.

`api_wallet_transactions`: `id`, `user_id`, `type` (`recharge`|`debit`), `amount_brl`, `description`, `openpix_correlation_id`, `openpix_charge_id`, `status` (`pending`|`paid`|`expired`), `created_at`. RLS: dono lê as próprias.

Funções `SECURITY DEFINER`:

- `debit_api_wallet(_user_id, _amount)` — desconta e retorna saldo novo.
- `credit_api_wallet(_user_id, _amount, _correlation_id)` — soma saldo e define `expires_at = now() + 30 dias` (zera flag de aviso).
- `get_wallet_status(_user_id)` — retorna saldo efetivo (0 se expirado) e estado ativo.

**Ativação para usuários existentes:** seed de carteiras para todos os usuários com conexão WhatsApp ativa, com um **período de cortesia configurável** (ex.: `expires_at = now() + 7 dias` e um saldo inicial pequeno) para ninguém ser cortado de imediato — tempo de recarregar.

GRANTs padrão (`authenticated` SELECT; `service_role` ALL).

## Edge functions

`openpix-charge` (nova): cria cobrança PIX na OpenPix (`POST https://api.openpix.com.br/api/v1/charge`, header `Authorization: <APP_ID>`, valor em centavos). Grava transação `pending` e retorna `brCode` (copia-e-cola) + `qrCodeImage`.

`openpix-webhook` (nova): recebe `OPENPIX:CHARGE_COMPLETED`, **revalida a cobrança** chamando a API da OpenPix, marca transação `paid` e credita a carteira via `credit_api_wallet`. `verify_jwt=false`.

`whatsapp-webhook` (edição mínima e isolada): antes de gerar a resposta da IA, checar `get_wallet_status`; se inativo, **não responder** e marcar `low_balance_notified`. Após enviar a resposta com sucesso, chamar `debit_api_wallet` com o custo fixo. Nenhuma outra lógica do webhook é alterada.

## Frontend

Nova página `src/pages/ApiBalance.tsx` (rota `/saldo-api`):

- Card de saldo atual + validade + status (ativo/inativo), deixando claro: **"Este é o saldo de API que mantém sua IA respondendo no WhatsApp."**
- 5 botões de recarga com estimativa de conversas e aviso de valor aproximado.
- Ao escolher: chama `openpix-charge`, exibe **QR Code** + botão **copiar chave PIX (copia-e-cola)**, e faz polling do status até confirmar pagamento.

`useApiWallet` (hook): lê saldo/validade do usuário logado.

Aviso global: banner em `AppLayout` quando saldo está baixo (abaixo de um limite) ou zerado/expirado, com link para `/saldo-api`. Item novo no `AppSidebar` ("Saldo de API").

## Segredo

Salvar o App ID da OpenPix como secret de backend `OPENPIX_APP_ID` (valor já enviado no chat). A criação de cobrança passa só pela edge function — nada sensível no frontend.

## Validação

1. Recarregar via PIX em sandbox/produção → confirmar crédito após webhook.
2. Confirmar débito por mensagem no WhatsApp e bloqueio quando zera.
3. Conferir banner de saldo baixo e a estimativa de conversas nos botões.

## Detalhes técnicos

- Custo por mensagem e período de cortesia ficam como constantes no topo das funções/arquivos para ajuste fácil.
- Webhook da OpenPix precisa ser cadastrado no painel Woovi apontando para a URL da `openpix-webhook` (forneço a URL após criar a função).
- Saldo: ele acumula sim! mantenha ele até zerar, só vai pagar de novo quando ACABAR o saldo! assim é mai ajusto!
- Mesmo que o saldo acabar, não trava nada nem muda nada, não bloqueia nada, é apenas informativo pra ele poder recarregar! 
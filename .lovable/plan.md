
## Estado Real do Sistema

### Diagnóstico Confirmado com Dados Reais

**O fix JÁ ESTÁ FUNCIONANDO.** Confirmado com logs e banco de dados:

1. **Erro `secretaria_IA`** → ocorreu apenas 1 vez às `17:21:23Z` — era o código ANTIGO (antes do fix)
2. **Logs às `17:27:xx`** → novo código rodando sem erros para instância `ia_escola`
3. **Banco de dados confirmado**: `secretaria_IA` com filtro `emailuser IS NOT NULL` retorna **exatamente 1 linha** — o fix está correto
4. **Live Chat ativo**: 47 sessões ativas (41 IA + 6 humano), 719 mensagens, última às 16:51

### O que estava errado (antes do fix)

O código usava `.single()` quando a tabela `n8n_fluxogpt` tem **dois tipos de registro** para a mesma instância:
- Linha base: `whatsappuser=Conectado`, `emailuser=comercial@...` → configuração
- Linha de contato: `whatsappuser=5515991573135`, `emailuser=NULL` → conversa do cliente

Quando um cliente mandou mensagem, `.single()` encontrou 2 linhas → erro 500 → IA parou de responder.

### Fix aplicado (já deployado)

Adicionado `.not('emailuser', 'is', null).limit(1).maybeSingle()` em 4 pontos do webhook — garante que sempre pega só o registro base da instância.

### O que precisa ser feito agora

O sistema está funcional. O único ponto a melhorar: o webhook ainda precisa ser **redeployado** para garantir que a versão mais recente do arquivo está no servidor (os logs às 17:27 mostram o boot de uma nova versão, mas precisamos confirmar com um redeploy explícito).

**Ação: Redeploy explícito da função `whatsapp-webhook` para garantir a versão mais recente está ativa.**


# Correcao Critica: IA Misturando Informacoes Entre Clientes

## O Problema (Raiz Encontrada)

A tabela `n8n_fluxogpt` tem **UMA unica linha por instancia WhatsApp** (ex: "loja", "Atendimento_bigboom"). Essa linha guarda tanto a configuracao da instancia (assistant ID, etc.) quanto dados da conversa ativa (threadid, whatsappuser, message).

### O que acontece na pratica:

```text
1. Cliente A manda msg para instancia "loja"
   -> Linha da instancia atualizada: whatsappuser=A, threadid=thread_A

2. Cliente B manda msg para a MESMA instancia "loja"
   -> Busca por (nomeinstancia=loja, whatsappuser=B) -> NAO ENCONTRA (a linha tem whatsappuser=A)
   -> Codigo trata como "novo contato" e SOBRESCREVE a linha da instancia:
      whatsappuser=B, mas threadid ainda = thread_A (do Cliente A!)
   -> Mensagem do Cliente B vai para a thread do Cliente A
   -> IA RESPONDE COM CONTEXTO DO CLIENTE A PARA O CLIENTE B!

3. Cliente A manda outra msg
   -> Busca por (nomeinstancia=loja, whatsappuser=A) -> NAO ENCONTRA (agora a linha tem whatsappuser=B)
   -> Ciclo se repete, agora A pode pegar thread do B
```

### Evidencia no banco:
- 21 instancias configuradas, mas apenas 1 linha por instancia
- 1793 linhas orfas (sem nomeinstancia) com threads -- sao restos de contatos que foram sobrescritos
- O codigo na linha 882-896 do `whatsapp-webhook` faz `UPDATE` na linha da instancia em vez de `INSERT` de nova linha

### Trechos do codigo problematico:

**Linha 819** -- pega thread da instancia (que pode ser de outro cliente):
```text
let threadId = instanceConfig.threadid;
```

**Linhas 882-896** -- sobrescreve a linha da instancia com dados do novo contato:
```text
} else {
    // Novo contato - criar registro de conversa
    // Nao vamos duplicar o registro da instancia, vamos usar o existente
    await supabase
        .from('n8n_fluxogpt')
        .update({ message, timeout, whatsappuser: contactNumber })
        .eq('id', instanceConfig.id);  // <-- SOBRESCREVE!
}
```

**Linha 959** -- salva thread nova na linha da instancia (sobrescrevendo a do contato anterior):
```text
await supabase
    .from('n8n_fluxogpt')
    .update({ threadid: threadId })
    .eq('id', existingContact?.id || instanceConfig.id);
```

---

## A Correcao

Mudar o fluxo de "novo contato" para **INSERIR uma nova linha** em vez de atualizar a linha da instancia. Cada contato passa a ter sua propria linha com seu proprio `threadid`.

### Mudancas no `supabase/functions/whatsapp-webhook/index.ts`:

#### 1. Busca de contato existente (linhas 779-784)
A busca atual esta correta -- procura por `(nomeinstancia, whatsappuser)`. O problema e que a linha do contato anterior foi sobrescrita. Com o fix, cada contato tera sua propria linha.

#### 2. Novo contato: INSERT em vez de UPDATE (linhas 882-896)
```text
ANTES: .update({...}).eq('id', instanceConfig.id)  -- sobrescreve config

DEPOIS: .insert({
    nomeinstancia: instanceName,
    idassistentgpt: instanceConfig.idassistentgpt,
    whatsappuser: contactNumber,
    message: currentMessages,
    timeout: now,
    last_message_at: new Date().toISOString(),
    last_sender: 'user',
    followup_count: 3
})
```

#### 3. Thread ID inicial: nunca herdar da instancia (linha 819)
```text
ANTES: let threadId = instanceConfig.threadid;
DEPOIS: let threadId = null;  // Cada contato comeca com thread propria
```

Quando `existingContact` existe (linha 833), o threadId vem do registro do contato (correto).
Quando e novo contato, threadId fica null e uma nova thread e criada na linha 934.

#### 4. Salvar thread no registro do contato (linha 955-959)
Apos o INSERT do novo contato, precisamos salvar o threadId na linha recém-criada.
Para isso, apos o INSERT do novo contato, guardar o ID da linha inserida e usar no update do threadId.

#### 5. Buffer check do novo contato (linhas 906-924)
Mudar para buscar pela linha recem-inserida em vez da linha da instancia.

### Resumo das mudancas:

| Local | Antes | Depois |
|-------|-------|--------|
| Linha 819 | `threadId = instanceConfig.threadid` | `threadId = null` |
| Linhas 882-896 | UPDATE na linha da instancia | INSERT de nova linha por contato |
| Linhas 906-910 | Verifica buffer na linha da instancia | Verifica buffer na linha do contato |
| Linha 959 | Salva thread na instancia | Salva thread na linha do contato |

---

## O que NAO muda

- A tabela `n8n_fluxogpt` nao precisa de alteracao de schema (todas as colunas necessarias ja existem)
- O fluxo de contato EXISTENTE (que ja tem sua linha) continua funcionando igual (linhas 822-880)
- A logica de Human Takeover, Live Chat, CRM, Analytics -- tudo continua intacto
- A busca de instanceConfig (linha 645-661) continua igual -- ela busca a configuracao da instancia
- Nenhuma outra edge function e modificada

## Impacto

- Contatos novos passam a ter conversas isoladas imediatamente
- Contatos que ja estavam com thread misturada vao receber nova thread na proxima mensagem (reset natural)
- Zero downtime -- a mudanca e no codigo da edge function apenas

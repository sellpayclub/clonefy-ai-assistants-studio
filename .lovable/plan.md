
# Plano: Corrigir Loja WhatsApp (Commerce)

## Problemas e Correcoes

### 1. API Key da Evolution exposta (commerce-ai) - CRITICO
A chave da Evolution API esta hardcoded como fallback no codigo. Deve usar apenas `Deno.env.get()` sem fallback exposto.

**Arquivo:** `supabase/functions/commerce-ai/index.ts` (linhas 56-57)

### 2. ai_selling_points nao incluso no catalogo da IA
O campo `ai_selling_points` existe nos produtos mas nao aparece no catalogo formatado que a IA recebe. A IA nao consegue usar os argumentos de venda configurados pelo usuario.

**Arquivo:** `supabase/functions/commerce-ai/index.ts` (linhas 128-134)
- Adicionar `ai_selling_points` na formatacao do catalogo quando disponivel

### 3. Envio de mensagem manual usa action errada
O `CommerceConversations.tsx` usa `whatsapp-evolution` com `action: 'sendMessage'`, mas deveria enviar diretamente pela Evolution API (ou usar uma action que exista no edge function).

**Arquivo:** `src/pages/CommerceConversations.tsx` (linhas 99-111)
- Criar chamada via `commerce-ai` ou usar a Evolution API diretamente via edge function

### 4. Falta upload de imagem nos produtos
O modal de criacao/edicao de produto nao tem campo para imagem, mas a IA tenta enviar `primary_image_url`. Sem imagem, o comando `[SEND_IMAGE]` nunca funciona.

**Arquivo:** `src/pages/CommerceStore.tsx`
- Adicionar campo de URL de imagem no formulario de produto (input simples para URL)

### 5. Cores hardcoded (green-500)
Varios componentes usam `green-500` em vez dos tokens do tema (`primary`).

**Arquivos:**
- `src/pages/CommerceOrders.tsx` - spinner, header icon
- `src/pages/CommerceConversations.tsx` - spinner, botao enviar
- `src/pages/CommercePaymentSettings.tsx` - spinner, botao salvar
- `src/pages/CommerceConnectWhatsApp.tsx` - spinner, botoes

### 6. Memory leak no polling do QR Code
O `startPolling` no `CommerceConnectWhatsApp.tsx` nao limpa o interval quando o componente desmonta.

**Arquivo:** `src/pages/CommerceConnectWhatsApp.tsx`
- Guardar intervalId em ref e limpar no cleanup do useEffect

## Resumo de Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/commerce-ai/index.ts` | Remover API key hardcoded; incluir ai_selling_points no catalogo |
| `src/pages/CommerceConversations.tsx` | Corrigir envio de mensagem manual; trocar cores |
| `src/pages/CommerceStore.tsx` | Adicionar campo de URL de imagem no produto |
| `src/pages/CommerceOrders.tsx` | Trocar cores hardcoded por tokens primary |
| `src/pages/CommercePaymentSettings.tsx` | Trocar cores hardcoded por tokens primary |
| `src/pages/CommerceConnectWhatsApp.tsx` | Corrigir memory leak do polling; trocar cores |

## Detalhes Tecnicos

### Remocao da API Key (commerce-ai)
```text
ANTES:
  const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY") || '94805bfbb25f77f37a029f5a3dbfe62b';

DEPOIS:
  const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY") || '';
```

### Catalogo com selling points
```text
ANTES:
  `- ${p.name} (R$ ${p.price.toFixed(2)})...
     ${p.short_description || ...}
     ID: ${p.id}`

DEPOIS:
  `- ${p.name} (R$ ${p.price.toFixed(2)})...
     ${p.short_description || ...}
     ${p.ai_selling_points ? `Diferenciais: ${p.ai_selling_points}` : ''}
     ID: ${p.id}`
```

### Campo de imagem no produto
Adicionar input de texto para URL da imagem principal (`primary_image_url`) no formulario de produto, antes do switch Ativo/Destaque.

### Cleanup do polling
Usar `useRef` para armazenar o intervalId e limpar com `useEffect` return cleanup.

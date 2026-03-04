
## Diagnóstico: 2 Problemas Críticos no Chat Flutuante

### Problema 1 — `embed-widget-v2.js` quebrado (CRÍTICO)
Linha 28 referencia `isLovableApp` que **nunca foi definida** no arquivo. Isso causa um `ReferenceError` instantâneo que aborta toda a execução do script — o widget não aparece para NENHUM cliente que usar o código de embed.

```text
console.log('CLONEFY: Inicializando widget', {
    ...
    isLovableApp: isLovableApp   // ← variável não existe!
});
```

### Problema 2 — `WidgetCustomization.tsx` gerando links errados
A página de customização usa `window.location.origin` para gerar o link de teste do chat. Quando um cliente acessa o painel por um domínio customizado, o link gerado aponta para o domínio errado em vez da URL de produção correta.

---

## Plano de Correção

### Arquivo 1: `public/embed-widget-v2.js`
- Remover `isLovableApp: isLovableApp` do console.log (linha 28)
- Essa é a causa raiz que derruba todo o widget

### Arquivo 2: `src/pages/WidgetCustomization.tsx`
- Substituir `${window.location.origin}/embed-chat/...` por `https://clonefy-ai-assistants-studio.lovable.app/embed-chat/...`
- Afeta o campo de input (linha 654), o botão de copiar (linha 661) e o botão "Abrir Chat" (linha 668)

### O que NÃO muda
- `ChatWidget.tsx` — já está com URL fixada corretamente
- `Index.tsx`, `VentasEspanol.tsx`, `MercadoDigital.tsx`, `SectorIASolution.tsx` — já estão usando URL fixada
- `Assistants.tsx` — usa `baseUrl` calculado corretamente
- Nenhuma edge function, banco de dados ou lógica de chat é alterada

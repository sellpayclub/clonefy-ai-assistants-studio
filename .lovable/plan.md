
## Problema

O script `https://scripts.converteai.net/.../sdk.js` foi injetado no `index.html` (linha 28-33), o que faz ele carregar em **todas as páginas** da aplicação. O vídeo em si já está corretamente em `CRMLeads.tsx`, mas o SDK global está poluindo as outras páginas.

## Solução

### 1. Remover o script do `index.html`
Remover as linhas 28-33 do `index.html` (o bloco `<script>` do smartplayer sdk).

### 2. Carregar o script dinamicamente apenas no `CRMLeads.tsx`
Adicionar um `useEffect` que injeta o script do SDK somente quando o componente CRM é montado, e o remove quando desmonta:

```tsx
useEffect(() => {
  const s = document.createElement("script");
  s.src = "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/sdk.js";
  s.async = true;
  s.id = "converteai-sdk";
  if (!document.getElementById("converteai-sdk")) {
    document.head.appendChild(s);
  }
  return () => {
    const existing = document.getElementById("converteai-sdk");
    if (existing) existing.remove();
  };
}, []);
```

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `index.html` | Remover o bloco `<script>` do Converteai SDK (linhas 28-33) |
| `src/pages/CRMLeads.tsx` | Adicionar `useEffect` para carregar o SDK apenas nesta página |

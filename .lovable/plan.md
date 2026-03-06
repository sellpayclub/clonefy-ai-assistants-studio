
## O que fazer

Remover completamente o vídeo e o script do Converteai da página `/crm`.

### Mudanças em `src/pages/CRMLeads.tsx`

- **Remover linhas 30-42**: o `useEffect` que carrega o SDK do Converteai
- **Remover linhas 88-112**: o bloco completo `{/* Video de apresentação do CRM */}` com o iframe

O `index.html` já está limpo — nenhuma alteração necessária lá.

### Arquivo alterado
| Arquivo | Mudança |
|---|---|
| `src/pages/CRMLeads.tsx` | Remover script SDK + bloco do vídeo |

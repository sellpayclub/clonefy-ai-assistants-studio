

## Fix: Botao "Testar Chat" nao funciona

### Problema
O botao "Testar Chat" na pagina Widget Customization abre a URL `/embed-chat?assistant=ID` usando query parameter, mas a rota espera um path parameter: `/embed-chat/:assistantId`. Resultado: a pagina EmbedChat abre sem receber o ID do agente e nao carrega nada.

### Correcao

**Arquivo: `src/pages/WidgetCustomization.tsx` (linha 743)**

Mudar de:
```tsx
window.open(`/embed-chat?assistant=${selectedAssistant}`, '_blank')
```

Para:
```tsx
window.open(`/embed/chat/${selectedAssistant}`, '_blank')
```

Isso usa a rota correta `/embed/chat/:agentId` que o EmbedChat espera via `useParams()`.

---

## Feature futura: Painel de Atendentes (Subcontas)

Sobre a ideia do cliente de criar subcontas para vendedores/atendentes com acesso limitado ao CRM + Chat ao Vivo apenas para agentes especificos — e uma feature excelente mas de fato complexa. Envolve:

- Sistema de convites e autenticacao de atendentes
- Tabela de permissoes (qual atendente acessa qual agente)
- Filtro no Live Chat por agente permitido
- Acesso restrito ao CRM (apenas leads do agente atribuido)
- Interface simplificada para o atendente (sem acesso a configs, billing, etc.)

Recomendo implementar primeiro o fix do botao agora, e planejar essa feature em etapas separadas depois.


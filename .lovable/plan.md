

## Objetivo
Corrigir o espaçamento e layout de TODAS as páginas que ainda estão usando o padrão antigo (com `SidebarProvider` e `AppSidebar` redundantes), garantindo que usem corretamente o `AppLayout` centralizado.

---

## Diagnóstico: Páginas que precisam de correção

Após análise completa, identifiquei **15 páginas** que ainda têm o layout antigo:

### Commerce (4 páginas)
1. `src/pages/CommerceStore.tsx`
2. `src/pages/CommerceOrders.tsx`
3. `src/pages/CommerceConversations.tsx`
4. `src/pages/CommercePaymentSettings.tsx`
5. `src/pages/CommerceConnectWhatsApp.tsx`

### Follow-up (4 páginas)
6. `src/pages/followup/FollowupDashboard.tsx`
7. `src/pages/followup/FollowupCampaignWizard.tsx`
8. `src/pages/followup/FollowupCampaignDetails.tsx`
9. `src/pages/followup/FollowupImportLeads.tsx`
10. `src/pages/followup/FollowupLeadsList.tsx`

### Outros
11. `src/pages/GroupManagement.tsx`
12. `src/pages/BrandingSettings.tsx`
13. `src/pages/WidgetAnalytics.tsx`
14. `src/pages/Calendar.tsx`

### Também o LoadingFallback
15. `src/App.tsx` - Corrigir animação do loading para centralizar corretamente

---

## Padrão correto a ser aplicado

Cada página deve seguir esta estrutura:

```tsx
// ANTES (errado - layout duplicado)
return (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        {/* conteúdo */}
      </main>
    </div>
  </SidebarProvider>
);

// DEPOIS (correto - usa AppLayout)
return (
  <main className="flex-1 flex flex-col h-screen overflow-hidden">
    {/* Header com SidebarTrigger */}
    <div className="p-4 border-b">
      <SidebarTrigger />
      {/* título da página */}
    </div>
    {/* Conteúdo scrollável */}
    <div className="flex-1 overflow-auto p-4">
      {/* conteúdo */}
    </div>
  </main>
);
```

---

## Mudanças por página

### 1. CommerceStore.tsx
- Remover `SidebarProvider` e `AppSidebar`
- Remover `import AppSidebar` e `import { SidebarProvider }`
- Ajustar container para `<main className="flex-1 flex flex-col h-screen overflow-hidden">`
- Adicionar `SidebarTrigger` no header

### 2. CommerceOrders.tsx
- Mesma estrutura acima

### 3. CommerceConversations.tsx
- Mesma estrutura acima

### 4. CommercePaymentSettings.tsx
- Mesma estrutura acima

### 5. CommerceConnectWhatsApp.tsx
- Mesma estrutura acima

### 6. FollowupDashboard.tsx
- Mesma estrutura acima

### 7. FollowupCampaignWizard.tsx
- Mesma estrutura acima

### 8. FollowupCampaignDetails.tsx
- Este já não tem `SidebarProvider` visível no início, preciso verificar a renderização

### 9. FollowupImportLeads.tsx
- Mesma estrutura acima

### 10. FollowupLeadsList.tsx
- Mesma estrutura acima

### 11. GroupManagement.tsx
- Mesma estrutura acima

### 12. BrandingSettings.tsx
- Mesma estrutura acima

### 13. WidgetAnalytics.tsx
- Mesma estrutura acima

### 14. Calendar.tsx
- Mesma estrutura acima

### 15. App.tsx - LoadingFallback
- Corrigir o componente `LoadingFallback` para ter melhor centralização
- Mudar de `min-h-screen` para estrutura que respeite o layout do AppLayout

---

## Detalhes técnicos

### Imports a remover de cada página:
```tsx
// REMOVER:
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
```

### Import a manter/adicionar:
```tsx
// MANTER (se precisar do trigger):
import { SidebarTrigger } from '@/components/ui/sidebar';
```

### Classes CSS padrão para main:
```tsx
// Para páginas com scroll vertical:
<main className="flex-1 flex flex-col h-screen overflow-hidden">
  <div className="border-b p-4">/* header */</div>
  <div className="flex-1 overflow-auto p-4">/* content */</div>
</main>

// Para páginas de chat (2 painéis):
<main className="flex-1 flex flex-col h-screen overflow-hidden">
  <div className="border-b p-4">/* header */</div>
  <div className="flex-1 flex overflow-hidden">/* panels */</div>
</main>
```

---

## Ordem de implementação

1. Primeiro corrigir as **5 páginas Commerce** (mais críticas para o usuário)
2. Depois as **5 páginas Followup**
3. Depois `GroupManagement.tsx`, `BrandingSettings.tsx`, `WidgetAnalytics.tsx`, `Calendar.tsx`
4. Por fim, corrigir o `LoadingFallback` no `App.tsx`

---

## Resultado esperado

- Navegação entre páginas instantânea (sidebar não remonta)
- Espaçamento consistente em todas as páginas
- Animação de loading centralizada corretamente
- Sem barras de rolagem duplicadas
- Layout uniforme em todo o sistema


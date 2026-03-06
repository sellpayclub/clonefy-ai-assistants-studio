
## Summary of Changes Needed

### 1. Block "Follow-up IA" and "Loja WhatsApp" routes for non-admin users

The `AppSidebar.tsx` already has a pattern for admin-only filtering using `user?.email === "personaldann@gmail.com"`. I need to extend this same pattern to block `Follow-up IA` (`/followup`) and `Loja WhatsApp` (`/commerce`) items from the sidebar AND the actual pages.

**Sidebar (`src/components/AppSidebar.tsx`):**
- Add `adminOnly: true` flag to the Follow-up IA and Loja WhatsApp menu items
- Extend `filteredMenuItems` useMemo to also filter out `adminOnly` items for non-admin users

**Route protection (`src/components/AppLayout.tsx`):**
- Add a `RestrictedRoute` wrapper that checks if the current user's email is `personaldann@gmail.com`. If not, redirect to `/dashboard` with a toast explaining the feature is coming soon.
- Wrap `/followup/*` and `/commerce/*` routes with it.

### 2. Replace "Clone"/"Clones" with "Agente"/"Agentes" in pt.ts

The word "Clone/Clones" appears as visible UI text in `src/translations/pt.ts` in several places:
- `hero.createAssistant`: "Criar Meu Primeiro Clone de IA" → "Criar Meu Primeiro Agente de IA"
- `hero.description1`: "Ensine seu Clone a Seguir..." → "Ensine seu Agente a Seguir..."
- `features.salesAgent.description`: "Ensine seu Clone a vender..." → "Ensine seu Agente a vender..."
- `features.multiService.description`: "Seu Clone terá um histórico..." → "Seu Agente terá um histórico..."
- `features.support.description`: "Use seu clone para automatizar..." → "Use seu agente para automatizar..."
- `dashboard.quickActions.startChat.description`: "Teste seus clones de IA..." → "Teste seus agentes de IA..."
- `auth.subtitle`: "Plataforma de Clones de IA para WhatsApp" → "Plataforma de Agentes de IA para WhatsApp"
- `sidebar.agents.title`: "Clones de IA" → "Agentes de IA"
- `nav.assistants`: "Clones de IA" → "Agentes de IA"
- `pricing.plans.basic.features[0]`: "1 Clone de IA" → "1 Agente de IA"
- `pricing.plans.professional.features[0]`: "3 Clones de IA" → "3 Agentes de IA"
- `pricing.plans.enterprise.features[0]`: "Clones ilimitados" → "Agentes ilimitados"

The same in `src/translations/en.ts` for the English equivalents.

**NOTE:** "CLONEFY" brand name, URLs, and technical strings (like `clonefy:config`) are NOT changed — only visible user-facing labels.

---

## Files to Edit

| File | What Changes |
|---|---|
| `src/components/AppSidebar.tsx` | Add `adminOnly` flag to Follow-up IA and Loja WhatsApp items; extend filter logic |
| `src/components/AppLayout.tsx` | Add `RestrictedRoute` component to protect `/followup/*` and `/commerce/*` |
| `src/translations/pt.ts` | Replace "Clone/Clones" with "Agente/Agentes" in visible UI text |
| `src/translations/en.ts` | Replace "Clone/Clones" with "Agent/Agents" in visible UI text |

---

## Technical Detail

**RestrictedRoute** (inside AppLayout.tsx):
```tsx
const RestrictedRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.email !== "personaldann@gmail.com") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};
```

This keeps the feature completely invisible (sidebar hidden) AND unreachable (route blocked) for all non-admin users, while remaining fully accessible to `personaldann@gmail.com`.

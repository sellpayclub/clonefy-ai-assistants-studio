
## O que o usuário quer

Edição dos conteúdos do CRM — tanto das **notas** (editar e deletar) quanto dos dados do lead diretamente no drawer (sem precisar abrir o formulário separado).

---

## Estado atual

- Notas: só tem "adicionar". Sem editar ou deletar.
- Lead data: tem botão ✏️ que abre o `LeadForm` em um Dialog separado — funciona, mas para o usuário é trabalhoso.
- `useCRMLeads.ts`: tem `addNote` mas não tem `updateNote` nem `deleteNote`.
- `crm_lead_notes` RLS: `ALL` para o dono — UPDATE e DELETE já são permitidos no banco.

---

## O que vai mudar

### Arquivo 1 — `src/hooks/useCRMLeads.ts`
Adicionar 2 mutations:
- `updateNote({ id, content })` → UPDATE na `crm_lead_notes`
- `deleteNote(id)` → DELETE na `crm_lead_notes`

### Arquivo 2 — `src/components/crm/LeadNotesSection.tsx`
Para cada nota do usuário (`created_by !== 'ai'`), adicionar ao hover:
- Botão ✏️ → transforma o texto em `<Textarea>` inline com "Salvar" / "Cancelar"
- Botão 🗑️ → confirma e deleta
- Notas da IA ficam somente leitura (sem botões)

Props novas: `onUpdateNote(id, content)` e `onDeleteNote(id)`

### Arquivo 3 — `src/components/crm/LeadDetailsDrawer.tsx`
- Passar as novas props `onUpdateNote` e `onDeleteNote` para `LeadNotesSection`
- Adicionar tipos na interface do componente

### Arquivo 4 — `src/pages/CRMLeads.tsx`
- Conectar `crm.updateNote.mutate` e `crm.deleteNote.mutate` passando para o drawer

---

## Resumo

| Arquivo | Mudança |
|---|---|
| `src/hooks/useCRMLeads.ts` | + `updateNote` + `deleteNote` |
| `src/components/crm/LeadNotesSection.tsx` | UI editar/deletar inline por nota |
| `src/components/crm/LeadDetailsDrawer.tsx` | Passar novas props |
| `src/pages/CRMLeads.tsx` | Conectar mutations no drawer |

Zero alterações em banco, webhooks, ou outros componentes.


## Ideia do Usuário: Botão Flutuante Telegram no Site do Cliente

A ideia é ótima e simples de implementar. O cliente coloca um script no site dele e aparece um botão flutuante azul do Telegram que, ao clicar, abre o link `t.me/seubot` diretamente no Telegram.

### Como vai funcionar

O cliente já tem o `embed-widget-v2.js` para o chat da IA. Vamos criar um segundo script embeddable: **`telegram-widget.js`** — um botão flutuante Telegram que o cliente cola no site com 1 linha de código:

```html
<script src="https://clonefy-ai-assistants-studio.lovable.app/telegram-widget.js?bot=seubot"></script>
```

Ao clicar, abre `https://t.me/seubot` numa nova aba (no mobile abre o app Telegram direto).

### O que será criado

**1. `public/telegram-widget.js`** — script embeddable com:
- Botão fixo azul (`#0088cc`) no canto inferior direito
- Ícone oficial do Telegram em SVG
- Tooltip "Fale conosco no Telegram"
- Ao clicar: abre `https://t.me/{bot}` em nova aba
- Responsivo (mobile e desktop)
- Animação suave de hover/pulse

**2. Seção "Embed no seu site" na página `/telegram`** — para cada bot conectado, exibir:
- Código HTML pronto para copiar (1 linha de script)
- Preview visual do botão que aparecerá no site
- Opções: posição (esquerda/direita), cor customizável via parâmetro

### Parâmetros do script

```
?bot=username          → username do bot (obrigatório)
&position=left/right   → posição do botão (padrão: right)
&color=%230088cc       → cor hex customizada (padrão: azul Telegram)
&tooltip=Texto         → texto do tooltip (padrão: "Fale conosco no Telegram")
```

### Alternativa adicional (bonus)

Além do botão flutuante, exibir também um **botão inline** que o cliente pode colocar dentro do conteúdo do site:

```html
<a href="https://t.me/seubot" class="telegram-btn">💬 Falar no Telegram</a>
<script src=".../telegram-widget.js?bot=seubot&mode=inline"></script>
```

### Arquivos a criar/editar

| Arquivo | Ação |
|---|---|
| `public/telegram-widget.js` | Criar — script embeddable completo |
| `src/pages/Telegram.tsx` | Editar — adicionar seção "Embed no seu site" com código pronto para copiar |

### Visual do botão no site do cliente

```
┌────────────────────────────┐
│  (site do cliente)         │
│                            │
│                            │
│                   ┌──────┐ │
│  ← tooltip        │  ✈  │ │  ← botão azul Telegram
│  "Fale no         └──────┘ │
│   Telegram"                │
└────────────────────────────┘
```

Simples, eficaz e o cliente implementa em 30 segundos colando 1 linha no site.

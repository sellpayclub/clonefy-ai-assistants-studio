# ✅ INSTRUÇÕES PARA DEPLOY - Correção do Sistema de Estilos

## 🎯 O que foi feito

1. ✅ **Código corrigido e enviado para o GitHub** (3 commits)
   - Correção da validação de templates na API
   - Logs detalhados para debug
   - Atualização do URL do widget para clonefy.app
   - Script de configuração do widget

2. ✅ **Widget atualizado** no código
   - `SupportChatWidget.tsx` agora usa `https://clonefy.app/embed-widget-v2.js`

## 📋 Próximos Passos (IMPORTANTE!)

### 1. Executar o Script SQL no Banco de Dados

Execute o arquivo `configure_widget_template.sql` no seu banco de dados:

```bash
# Opção 1: Via psql (se tiver acesso direto)
psql -h [SEU_HOST] -U [SEU_USER] -d [SEU_DATABASE] -f configure_widget_template.sql

# Opção 2: Via Supabase Dashboard
# 1. Acesse https://supabase.com/dashboard
# 2. Selecione seu projeto
# 3. Vá em SQL Editor
# 4. Cole o conteúdo de configure_widget_template.sql
# 5. Clique em RUN
```

**Esse script vai:**
- Configurar o assistente `7a218984-6ada-4581-b1b6-2119b4771260` para usar "Card do Agente"
- Adicionar 3 botões de ação:
  - "Falar com vendas"
  - "Suporte técnico"
  - "Ver demonstração"
- Ativar o indicador de status online

### 2. Deploy da Edge Function (Se usar Supabase)

Se estiver usando Supabase para a API:

```bash
cd supabase
supabase functions deploy widget-config
```

### 3. Fazer Build e Deploy do Frontend

```bash
# Build do projeto
npm run build

# Deploy (exemplo com Vercel, ajuste conforme sua plataforma)
vercel --prod

# OU se usar outro serviço, siga as instruções da sua plataforma
```

### 4. Verificar se Migration foi Executada

Execute o script de verificação:

```bash
# Via psql
psql -h [SEU_HOST] -U [SEU_USER] -d [SEU_DATABASE] -f verify_database.sql

# OU via Supabase Dashboard > SQL Editor
```

Verifique se as colunas `widget_template`, `action_buttons`, etc. existem.

## 🧪 Como Testar Após Deploy

### Teste 1: Verificar no Console da API

```bash
# Testar a API diretamente
curl -X POST https://clonefy.app/supabase/functions/v1/widget-config \
  -H "Content-Type: application/json" \
  -d '{"assistantId": "7a218984-6ada-4581-b1b6-2119b4771260"}' | jq
```

**Deve retornar:**
```json
{
  "success": true,
  "config": {
    "widget_template": "agent_card",
    "action_buttons": [
      {"label": "Falar com vendas", "message": "..."},
      ...
    ],
    ...
  }
}
```

### Teste 2: No Site Clonefy.app

1. Acesse https://clonefy.app
2. Abra o Console do navegador (F12)
3. Procure por logs:
   ```
   === CLONEFY: TEMPLATE DETECTION ===
   Widget Template: agent_card  ← DEVE SER agent_card
   ```

4. **Visualmente você deve ver:**
   - Um card grande no canto da tela
   - Foto/avatar do assistente (se configurado)
   - Nome "Assistente Clonefy"
   - Status "Online agora" com ponto verde
   - 3 botões de ação
   - Não apenas um botão flutuante!

### Teste 3: Limpar Cache do Navegador

**MUITO IMPORTANTE**

```
Chrome/Edge:
Ctrl + Shift + Delete (Windows/Linux)
Cmd + Shift + Delete (Mac)

Selecione "Imagens e arquivos em cache"
Período: "Últimas 24 horas" ou "Tudo"
Clique em "Limpar dados"
```

Depois: `Ctrl + F5` (Windows/Linux) ou `Cmd + Shift + R` (Mac)

## 🔍 Troubleshooting

### Ainda aparece apenas o botão flutuante?

**Diagnosticar:**
1. Abra Console (F12)
2. Procure por `=== CLONEFY: TEMPLATE DETECTION ===`
3. Veja o valor de `Widget Template`

**Se for "classic":**
- ✅ Script SQL não foi executado → Execute `configure_widget_template.sql`
- ✅ Cache do navegador → Limpe conforme instruções acima
- ✅ Build antigo em produção → Faça novo build e deploy

**Se for "agent_card" mas ainda aparece classic:**
- ✅ Problema de cache → Ctrl + Shift + Delete
- ✅ Script embed-widget-v2.js está em cache → Adicione `?v=2` na URL

### Erro na API?

Verifique os logs:
```bash
# Logs da edge function (Supabase)
# Dashboard > Edge Functions > widget-config > Logs

# Procure por:
=== WIDGET CONFIG DEBUG ===
```

## 📦 Arquivos Importantes Criados

1. **configure_widget_template.sql** - Configura o widget com estilo agent_card
2. **verify_database.sql** - Verifica estrutura do banco
3. **test-widget-embed.html** - Página de teste local
4. **WIDGET_STYLE_FIX_GUIDE.md** - Guia completo

## 🎉 Resultado Esperado

Após seguir todos os passos acima, ao acessar https://clonefy.app você verá:

✅ **Card do Agente** no canto da tela  
✅ Avatar/ícone do assistente  
✅ Nome "Assistente Clonefy"  
✅ Status "Online agora" com ponto verde piscando  
✅ 3 botões de ação clicáveis:
   - "Falar com vendas"
   - "Suporte técnico"
   - "Ver demonstração"
✅ Ao clicar em qualquer botão ou na barra de pesquisa, o chat abre

**NÃO deve aparecer apenas:**
❌ Um botão flutuante azul no canto

---

## 💡 Dica Final

Se você quiser testar localmente antes de fazer deploy, use:

```bash
npm run dev
# Abra http://localhost:5173 no navegador
```

E abra o arquivo `test-widget-embed.html` em outro navegador apontando para `http://localhost:5173/embed-widget-v2.js`

---

**Qualquer dúvida, verifique os logs no console do navegador!**

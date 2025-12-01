# 🔧 Correções Implementadas - Sistema de Estilos do Chat

## 📋 Resumo das Alterações

### 1. Melhorias na API de Configuração
**Arquivo:** `supabase/functions/widget-config/index.ts`

**Mudanças:**
- ✅ Adicionada validação explícita de templates válidos
- ✅ Melhorada lógica para aceitar apenas templates válidos: `classic`, `bubble`, `agent_card`, `quick_questions`
- ✅ Logs detalhados para debug em produção

**Impacto:** Garante que apenas templates válidos sejam retornados, evitando que valores NULL ou inválidos quebrem o widget.

### 2. Logs Aprimorados no Embed Script
**Arquivo:** `public/embed-widget-v2.js`

**Mudanças:**
- ✅ Logs detalhados da resposta completa da API
- ✅ Informações sobre detecção de template
- ✅ Dados de configuração disponíveis (botões, perguntas, mensagens)

**Impacto:** Facilita diagnóstico de problemas em produção através do console do navegador.

### 3. Scripts de Diagnóstico
**Arquivos criados:**
- ✅ `verify_database.sql` - Script para verificar estrutura do banco
- ✅ `test-widget-embed.html` - Página de teste para o widget

## 🧪 Como Testar

### Passo 1: Verificar Banco de Dados
```bash
# Conectar ao banco e executar
psql -h [SEU_HOST] -U [SEU_USER] -d [SEU_DATABASE] -f verify_database.sql
```

**O que verificar:**
1. Colunas `widget_template`, `bubble_message`, etc. existem?
2. Registros têm valores válidos para `widget_template`?
3. Algum registro está com NULL ou string vazia?

### Passo 2: Testar a API Diretamente
```bash
# Substituir [ASSISTANT_ID] e [URL_BASE]
curl -X POST https://[URL_BASE]/supabase/functions/v1/widget-config \
  -H "Content-Type: application/json" \
  -d '{"assistantId": "[ASSISTANT_ID]"}' | jq
```

**O que verificar:**
```json
{
  "success": true,
  "config": {
    "widget_template": "agent_card",  // ← Deve ser o template configurado
    "widget_name": "...",
    // ... outras configurações
  }
}
```

### Passo 3: Testar no Navegador

#### 3.1 Usando Link Direto
1. Na interface de personalização, clique em **"Abrir Chat"**
2. Abra Console do Navegador (F12)
3. Procure por: `=== CLONEFY: TEMPLATE DETECTION ===`
4. Verifique se o `Widget Template` está correto

#### 3.2 Usando Página de Teste
1. Abra `test-widget-embed.html` em um navegador
2. Substitua `SEU_ASSISTANT_ID_AQUI` pelo ID real
3. Ajuste o `script.src` se necessário (localhost ou produção)
4. Abra o Console e verifique os logs

### Passo 4: Testar no Site do Cliente

#### 4.1 Atualizar Código Embed
Instrua o cliente a substituir o código embed antigo por:
```html
<!-- Clonefy Chat Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://[SEU_DOMINIO]/embed-widget-v2.js';
    script.dataset.assistantId = '[ASSISTANT_ID]';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
```

#### 4.2 Limpar Cache
**Muito importante!** Instrua o cliente a:
1. Abrir DevTools (F12)
2. Clicar com botão direito no botão de reload
3. Selecionar **"Esvaziar cache e recarregar de forma forçada"**

Ou usar atalho:
- **Windows/Linux:** Ctrl + Shift + Delete
- **Mac:** Cmd + Shift + Delete

## 🐛 Troubleshooting

### Problema: Ainda aparece apenas o botão (classic)

**Diagnóstico:**
1. Abra Console do navegador
2. Procure por `=== CLONEFY: TEMPLATE DETECTION ===`
3. Verifique o valor de `Widget Template`

**Se Widget Template = "classic" mas você configurou outro:**
- ✅ Banco de dados não tem o template salvo
- ✅ Migration não foi executada
- ✅ Valor está NULL no banco

**Solução:**
1. Execute a migration `20251129000001_widget_templates.sql`
2. Salve novamente a configuração na interface
3. Verifique no banco se salvou corretamente

**Se Widget Template = template correto mas aparece classic:**
- ✅ Cache do navegador
- ✅ Script embed antigo em cache

**Solução:**
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Verificar se o script embed tem a versão mais recente
3. Adicionar cache buster ao script: `embed-widget-v2.js?v=2`

### Problema: Template não cria elementos visuais

**Diagnóstico:**
Verifique no console:
```
Has Template Container?: false  // ← Problema aqui
```

**Possíveis causas:**
- JavaScript está sendo bloqueado
- Erro na criação dos elementos
- Conflito com CSS do site

**Solução:**
1. Procurar por erros JavaScript no console
2. Verificar se há bloqueio de Content Security Policy (CSP)
3. Testar em página limpa (test-widget-embed.html)

## 📊 Logs Esperados

### Logs de Sucesso (Agent Card)
```
=== CLONEFY: API RESPONSE ===
Success: true
Full Config: {
  "widget_template": "agent_card",
  "widget_name": "Assistente Virtual",
  ...
}
============================

=== CLONEFY: TEMPLATE DETECTION ===
Widget Template: agent_card
Template Type: string
Is Classic?: false
Is Active?: true
Has Template Container?: false
Bubble Message: Oi! Como posso te ajudar?
Action Buttons: [{label: "...", message: "..."}]
==================================

CLONEFY: Criando elementos do template: {template: "agent_card", ...}
CLONEFY: createAgentCardTemplate chamado
CLONEFY: Card HTML criado
CLONEFY: Template container criado e adicionado ao DOM
```

## 🚀 Deploy

### Supabase Edge Functions
Se você modificou `widget-config/index.ts`:
```bash
cd supabase
supabase functions deploy widget-config
```

### Script Embed
O arquivo `embed-widget-v2.js` é servido diretamente da pasta `public`, então:
- Se está usando Vite/React em desenvolvimento: reinicie o servidor
- Se está em produção: faça build e deploy

### Migration
Se a migration não foi executada:
```bash
# Opção 1: Via Supabase CLI
supabase db push

# Opção 2: Via Dashboard
# Ir em Database > Migrations e executar manualmente
```

## ✅ Checklist Final

Antes de considerar o problema resolvido:

- [ ] Migration executada com sucesso
- [ ] Script SQL de verificação rodado e mostra dados corretos
- [ ] API retorna template correto ao ser testada diretamente
- [ ] Console do navegador mostra logs corretos
- [ ] Widget aparece com o estilo correto em página de teste
- [ ] Widget aparece com o estilo correto no site do cliente
- [ ] Testado em diferentes navegadores (Chrome, Firefox, Safari)
- [ ] Testado em mobile (responsivo)
- [ ] Cache limpo em todos os testes

## 📞 Suporte

Se após todas essas correções o problema persistir, coletar:
1. Screenshots dos logs do console
2. Resultado do script SQL de verificação
3. Resposta da API quando testada diretamente
4. Navegador e versão sendo usada
5. URL do site onde está sendo testado

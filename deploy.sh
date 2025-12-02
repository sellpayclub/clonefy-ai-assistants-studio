#!/bin/bash

# 🚀 Script de Deploy Completo - Clonefy Chat Widget
# Este script faz o deploy de todas as correções para produção

echo "🚀 Iniciando deploy das correções do Chat Widget..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script na raiz do projeto${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Passo 1: Instalando dependências...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependências instaladas${NC}"
echo ""

echo -e "${YELLOW}🔨 Passo 2: Fazendo build do projeto...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build concluído${NC}"
echo ""

echo -e "${YELLOW}📤 Passo 3: Verificando Git...${NC}"
git status
echo ""

echo -e "${GREEN}✅ Deploy preparado!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}📋 PRÓXIMOS PASSOS MANUAIS:${NC}"
echo ""
echo "1️⃣  Deploy das Edge Functions (Supabase):"
echo "   - Acesse: https://supabase.com/dashboard"
echo "   - Vá em: Edge Functions"
echo "   - Faça upload da função 'widget-config'"
echo "   - Arquivo: supabase/functions/widget-config/index.ts"
echo ""
echo "2️⃣  Deploy do Frontend:"
echo "   - Se usa Vercel: vercel --prod"
echo "   - Se usa Netlify: netlify deploy --prod"
echo "   - Ou faça upload da pasta 'dist/' para seu servidor"
echo ""
echo "3️⃣  Limpar cache do navegador:"
echo "   - Chrome/Edge: Ctrl+Shift+Delete (Cmd+Shift+Delete no Mac)"
echo "   - Selecione 'Imagens e arquivos em cache'"
echo "   - Clique em 'Limpar dados'"
echo ""
echo "4️⃣  Testar:"
echo "   - Acesse: https://clonefy.app"
echo "   - Abra o Console (F12)"
echo "   - Procure por: '✅ CLONEFY: Template inicial criado e visível'"
echo "   - Deve aparecer o Card do Agente, não apenas o botão flutuante"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🎉 Build pronto para deploy!${NC}"
echo ""
echo "📁 Pasta de build: ./dist"
echo "📄 Documentação: WIDGET_FIX_DOCUMENTATION.md"
echo ""

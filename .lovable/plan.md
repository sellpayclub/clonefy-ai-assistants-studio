
# Plano: Sistema Whitelabel - Logo e Cores Personalizadas

## Objetivo
Permitir que cada usuário personalize o **logo** e as **cores** do sistema interno (dashboard, sidebar, etc.) para sua própria marca.

---

## Arquitetura da Solução

```text
+------------------+     +---------------------+     +------------------+
|  Nova Página     |     |  Nova Tabela        |     |  Contexto React  |
|  /configuracoes  | --> |  user_branding      | <-- |  BrandingContext |
|  (Settings)      |     |  - logo_light_url   |     |  (global state)  |
+------------------+     |  - logo_dark_url    |     +------------------+
                         |  - primary_color    |              |
                         |  - accent_color     |              v
                         +---------------------+     +------------------+
                                                     |  Componentes     |
                                                     |  - AppSidebar    |
                                                     |  - Auth          |
                                                     +------------------+
```

---

## Escopo da Implementação

### O que será personalizável:
- **Logo modo claro** (exibido no tema light)
- **Logo modo escuro** (exibido no tema dark)
- **Logo ícone** (versão pequena para sidebar colapsada)
- **Cor primária** (botões, links, destaques)
- **Cor de acento** (elementos secundários)

### Onde as mudanças serão aplicadas:
- Sidebar (AppSidebar.tsx)
- Tela de Login (Auth.tsx)
- Variáveis CSS do sistema

---

## Etapas de Implementação

### 1. Criar Tabela no Banco de Dados

Criar nova tabela `user_branding` com as configurações de marca por usuário:

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Chave primária |
| user_id | uuid | FK para auth.users (único) |
| logo_light_url | text | URL do logo para tema claro |
| logo_dark_url | text | URL do logo para tema escuro |
| logo_icon_url | text | Logo pequeno (sidebar colapsada) |
| primary_color | text | Cor primária em formato HSL |
| accent_color | text | Cor de acento em formato HSL |
| company_name | text | Nome da empresa (alt do logo) |
| is_active | boolean | Se usa branding custom |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Data de atualização |

**Políticas RLS:**
- Usuário pode ler/escrever apenas seu próprio registro

---

### 2. Criar Contexto de Branding (BrandingContext)

Novo arquivo: `src/contexts/BrandingContext.tsx`

**Funcionalidades:**
- Carregar configurações do banco ao inicializar
- Armazenar em estado global (React Context)
- Aplicar cores como variáveis CSS dinâmicas
- Fornecer URLs de logo para componentes
- Fallback para valores padrão (logo CLONEFY, cores verdes)

---

### 3. Criar Página de Configurações

Nova página: `src/pages/BrandingSettings.tsx`

**Interface:**
- Seção "Logo da Marca"
  - Upload logo modo claro (usando ImageUpload existente)
  - Upload logo modo escuro
  - Upload logo ícone (pequeno)
  - Preview em tempo real
  
- Seção "Cores do Sistema"
  - Seletor cor primária (usando ColorPicker existente)
  - Seletor cor de acento
  - Preview das cores aplicadas

- Botões:
  - "Salvar Configurações"
  - "Restaurar Padrão"

---

### 4. Adaptar Componentes Existentes

**AppSidebar.tsx:**
```text
Antes: <img src="/lovable-uploads/xxx.png" />
Depois: <img src={branding.logoLightUrl || "/lovable-uploads/xxx.png"} />
```

**Auth.tsx:**
```text
Antes: <img src="/lovable-uploads/xxx.png" />
Depois: <img src={branding.logoLightUrl || "/lovable-uploads/xxx.png"} />
```

**index.css / ThemeProvider:**
```text
Injetar variáveis CSS dinâmicas:
document.documentElement.style.setProperty('--primary', branding.primaryColor)
```

---

### 5. Adicionar Menu de Navegação

Adicionar item "Personalização" no menu lateral (AppSidebar):
- Ícone: Palette ou Brush
- Rota: /configuracoes/branding
- Descrição: "Personalize logo e cores"

---

## Arquivos a Serem Criados/Modificados

### Novos Arquivos:
| Arquivo | Descrição |
|---------|-----------|
| `src/contexts/BrandingContext.tsx` | Contexto global de branding |
| `src/pages/BrandingSettings.tsx` | Página de configurações |
| `src/hooks/useBranding.ts` | Hook para acesso ao contexto |
| `supabase/migrations/xxx_create_user_branding.sql` | Criação da tabela |

### Arquivos Modificados:
| Arquivo | Modificação |
|---------|-------------|
| `src/components/AppSidebar.tsx` | Usar logos do contexto |
| `src/pages/Auth.tsx` | Usar logos do contexto |
| `src/App.tsx` | Adicionar rota e BrandingProvider |
| `src/main.tsx` | Envolver app com BrandingProvider |
| `src/integrations/supabase/types.ts` | Tipos da nova tabela |

---

## Detalhes Técnicos

### Aplicação Dinâmica de Cores

O sistema usará CSS Custom Properties (variáveis CSS) que podem ser alteradas via JavaScript:

```typescript
// No BrandingContext, ao carregar configurações:
const applyColors = (branding: UserBranding) => {
  const root = document.documentElement;
  
  if (branding.primary_color) {
    // Converter hex para HSL se necessário
    root.style.setProperty('--primary', branding.primary_color);
  }
  
  if (branding.accent_color) {
    root.style.setProperty('--accent', branding.accent_color);
  }
};
```

### Fallback para Valores Padrão

Quando o usuário não tem configurações personalizadas:
- **Logos:** Usa os logos padrão do CLONEFY
- **Cores:** Usa as cores definidas no index.css (verde #22c55e)

### Storage de Imagens

As imagens de logo serão armazenadas no Supabase Storage:
- Bucket: `avatars` (existente) ou novo bucket `branding`
- Caminho: `{user_id}/branding/logo_light.png`
- Acesso: Público (para exibição na tela de login)

---

## Limitações e Considerações

1. **Tela de Login:** Como o usuário ainda não está autenticado, a personalização só aparecerá após o primeiro login ou se usar um domínio personalizado (futuro).

2. **Cores HSL:** O sistema atual usa HSL. Se o usuário inserir HEX, será necessário converter.

3. **Cache:** Pode ser necessário forçar refresh após salvar para ver mudanças de cor.

---

## Preview Visual

A página de configurações terá aparência similar à página de Widget Customization existente, com:
- Cards para cada seção
- Preview em tempo real à direita
- Responsivo para mobile

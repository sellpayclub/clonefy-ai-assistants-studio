
# Plano: Salvar Documentos e Imagens no CRM

## Resumo

Implementar sistema para capturar e armazenar **imagens e documentos** (PDF, DOC, DOCX, XLS) enviados pelos clientes via WhatsApp e Chat Widget, com visualização organizada no CRM.

## O Que Sera Feito

### Para o Usuario Final
- Nova aba **"Documentos"** no CRM mostrando todos os arquivos do lead
- Arquivos organizados por tipo (imagem ou documento)
- Botoes para visualizar e baixar arquivos
- Clientes poderao enviar arquivos pelo chat do site (novo botao de anexo)

### Arquitetura

```text
+------------------+     +-------------------+     +------------------+
|  WhatsApp        | --> | whatsapp-webhook  | --> | lead-files       |
|  (Imagem/Doc)    |     |                   |     | (Storage Bucket) |
+------------------+     +-------------------+     +------------------+
                                   |
                                   v
+------------------+     +-------------------+     +------------------+
|  Chat Widget     | --> | widget-chat       | --> | crm_lead_        |
|  (Botao Anexar)  |     | (upload_file)     |     | attachments      |
+------------------+     +-------------------+     +------------------+
                                                           |
                                                           v
                                                  +------------------+
                                                  | LeadDetailsDrawer|
                                                  | (Aba Documentos) |
                                                  +------------------+
```

## Componentes a Criar/Modificar

### 1. Nova Tabela: crm_lead_attachments

Armazena metadados dos arquivos enviados pelos leads.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID | Chave primaria |
| lead_id | UUID | FK para crm_leads |
| user_id | UUID | Dono do lead |
| file_name | TEXT | Nome original do arquivo |
| file_url | TEXT | URL no Storage |
| file_type | TEXT | image ou document |
| mime_type | TEXT | MIME type (image/jpeg, application/pdf) |
| file_size | INTEGER | Tamanho em bytes |
| source | TEXT | whatsapp ou widget |
| ai_description | TEXT | Descricao gerada pela IA (para imagens) |
| created_at | TIMESTAMPTZ | Data de envio |

### 2. Novo Bucket: lead-files

- Estrutura: `{user_id}/{lead_id}/{timestamp}_{filename}`
- Bucket publico para visualizacao no CRM
- RLS para escrita apenas pelo owner

### 3. Modificar: whatsapp-webhook

O webhook ja processa imagens e documentos, mas apenas extrai conteudo. Agora vai:
1. Baixar o arquivo via Evolution API (ja faz)
2. Fazer upload para o bucket `lead-files`
3. Salvar registro em `crm_lead_attachments`
4. Manter o media_url em `live_chat_messages`

### 4. Modificar: widget-chat (Edge Function)

Nova action `upload_file`:
1. Receber arquivo em base64
2. Validar tipo (imagem ou documento)
3. Salvar no bucket `lead-files`
4. Criar registro em `crm_lead_attachments`
5. Retornar URL para exibicao no chat

### 5. Modificar: embed-widget-v2.js

Adicionar:
- Botao de clipe (anexar) ao lado do campo de texto
- Input type="file" escondido
- Preview da imagem antes de enviar
- Conversao para base64 e envio via API
- Tipos aceitos: JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX

### 6. Nova Aba: LeadDetailsDrawer - Documentos

Nova aba "Documentos" com:
- Grade de thumbnails para imagens
- Lista de documentos com icones por tipo (PDF, DOC, XLS)
- Botao para download/visualizacao
- Filtros: Todos, Imagens, Documentos
- Data e fonte (WhatsApp/Site)

## Tipos de Arquivo Suportados

| Tipo | Extensoes | Limite |
|------|-----------|--------|
| Imagens | JPG, PNG, GIF, WEBP | 10MB |
| Documentos | PDF, DOC, DOCX, XLS, XLSX | 20MB |

## Fluxo WhatsApp

```text
Cliente envia foto/PDF --> Evolution API Webhook --> whatsapp-webhook
                                                          |
                              +---------------------------+
                              v
                     Baixa arquivo via API
                              |
                              v
                     Upload para Storage (lead-files)
                              |
                     +--------+--------+
                     v                 v
          crm_lead_attachments   live_chat_messages
          (novo registro)        (media_url atualizado)
```

## Fluxo Widget

```text
Cliente clica anexar --> Seleciona arquivo --> Preview
                                                    |
                              +---------------------+
                              v
                     Converte para base64
                              |
                              v
                     Envia para widget-chat (action: upload_file)
                              |
                              v
                     Upload para Storage (lead-files)
                              |
                     +--------+--------+
                     v                 v
          crm_lead_attachments   live_chat_messages
          (novo registro)        (media_url)
```

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| SQL Migration | Criar | Tabela crm_lead_attachments + bucket lead-files |
| `supabase/functions/whatsapp-webhook/index.ts` | Modificar | Salvar arquivos no storage + tabela attachments |
| `supabase/functions/widget-chat/index.ts` | Modificar | Nova action upload_file |
| `public/embed-widget-v2.js` | Modificar | Botao de anexar arquivo no chat |
| `src/components/crm/LeadDetailsDrawer.tsx` | Modificar | Nova aba Documentos |
| `src/hooks/useLeadAttachments.ts` | Criar | Hook para gerenciar anexos do lead |

## Interface do Usuario

### Widget de Chat (Site)
- Novo botao de clipe ao lado do campo de texto
- Ao clicar, abre seletor de arquivos
- Preview da imagem antes de enviar
- Indicador de upload em progresso
- Icone do arquivo anexado na mensagem

### CRM - Aba Documentos
- Grid responsivo com cards
- Imagens: thumbnail clicavel para expandir
- Documentos: icone + nome + botao download
- Badge indicando fonte (WhatsApp/Site)
- Data de envio formatada

## Seguranca

- RLS: Usuario so ve anexos dos seus leads
- Validacao de MIME type no backend
- Limite de tamanho por tipo de arquivo
- Sanitizacao de nomes de arquivo

## Proximos Passos (Apos Aprovacao)

1. Criar migracao SQL (tabela + bucket + policies)
2. Atualizar whatsapp-webhook para salvar arquivos
3. Adicionar action upload_file no widget-chat
4. Implementar botao de anexo no embed-widget-v2.js
5. Criar hook useLeadAttachments
6. Adicionar aba Documentos no LeadDetailsDrawer

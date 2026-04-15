
Objetivo: fazer o agente salvar mesmo com material grande e fazer a base de conhecimento realmente funcionar com seus 3 documentos/transcrições.

Diagnóstico confirmado
- O erro ao salvar não é aleatório: o `openai-assistants` está enviando `instructions` grandes demais para a OpenAI. Nos logs, houve update com 455.270 caracteres, acima do limite de 256.000.
- A base de conhecimento hoje está incompleta: os arquivos são enviados para a API de Files, mas não estão sendo vinculados ao assistant com `file_search`/vector store. Então “subir o arquivo” não significa que o agente está usando o conteúdo.
- Existe um agravante: ao subir arquivos, o sistema injeta nomes/URLs desses arquivos dentro de `instructions` via trigger SQL, inchando ainda mais o prompt e piorando o problema.
- No fluxo de criação, os arquivos entram só depois que o agente é criado, mas sem sincronização real do assistant com esses arquivos.

Plano de implementação

1. Corrigir a arquitetura do prompt
- Manter `instructions` apenas para comportamento, função e regras do agente.
- Bloquear no frontend e no edge function prompts longos demais com mensagem clara:
  - “Transcrição/documentos longos devem ir para a Base de Conhecimento, não no campo de instruções.”
- Adicionar contador de caracteres + alerta antes de salvar.

2. Fazer a base de conhecimento funcionar de verdade
- Atualizar `supabase/functions/openai-assistants/index.ts` para:
  - criar/usar um vector store por agente;
  - adicionar os `openai_file_id` dos documentos ao vector store;
  - atualizar o assistant com `file_search` + `tool_resources`.
- Sincronizar isso em 3 momentos:
  - após criar agente;
  - após upload de arquivo;
  - após remover arquivo.
- Reaproveitar a coluna `metadata` do assistant para guardar `vector_store_id`, evitando nova tabela.

3. Parar de inchar as instruções com arquivos
- Fazer uma pequena migration para remover/desativar o trecho que adiciona arquivos de conhecimento dentro de `instructions`.
- Manter mídia separada se necessário, mas conhecimento não deve mais ser copiado para o prompt.

4. Unificar o fluxo de upload
- Hoje há lógica duplicada em:
  - `src/pages/Assistants.tsx`
  - `src/components/AssistantKnowledgeUpload.tsx`
  - `src/hooks/useAssistantKnowledgeFiles.ts`
- Vou consolidar esse fluxo para que criação, edição e uploads posteriores usem a mesma sincronização com a OpenAI.

5. Melhorar a mensagem de erro
- Em vez de toast genérico “Edge Function returned a non-2xx”, mostrar o motivo real:
  - prompt grande demais;
  - arquivo não vinculado;
  - tipo de arquivo inválido;
  - falha no processamento do documento.

6. Hardening para documentos “difíceis”
- Se seus PDFs forem escaneados/imagem, adicionar fallback de extração/OCR para gerar texto utilizável antes de indexar.
- Isso entra como reforço para casos em que o arquivo sobe, mas a resposta continua ruim.

Arquivos previstos
- `supabase/functions/openai-assistants/index.ts`
- `supabase/functions/web-scraper/index.ts`
- `src/pages/Assistants.tsx`
- `src/components/AssistantKnowledgeUpload.tsx`
- `src/hooks/useAssistantKnowledgeFiles.ts`
- migration SQL para desativar o trigger/função que injeta conhecimento em `instructions`

Resultado esperado
- Você poderá manter o prompt principal enxuto.
- As 3 documentações/transcrições irão para a base de conhecimento corretamente.
- O agente deixará de falhar ao salvar por excesso de texto.
- As respostas passarão a usar os arquivos enviados de forma muito mais confiável.

Observação importante
- Para o seu caso, o correto não é “colocar os 3 documentos no prompt”.
- O correto é: prompt curto + documentos/transcrição na base de conhecimento indexada.

Validação após implementar
- Testar salvar agente com instruções curtas e transcrição longa enviada como arquivo.
- Testar upload dos 3 documentos.
- Fazer perguntas específicas cujo conteúdo só existe nesses arquivos.
- Confirmar que o agente responde com base neles sem estourar limite de instruções.

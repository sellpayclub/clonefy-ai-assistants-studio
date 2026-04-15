

## Revisao: Status da Implementacao

### O que esta funcionando corretamente
1. **Edge function `openai-assistants`**: Logica de vector store, sync, file_search, limite de 200k caracteres - tudo OK
2. **Frontend `Assistants.tsx`**: Contador de caracteres com alerta visual, mensagem de erro especifica - OK
3. **`AssistantKnowledgeUpload.tsx`**: Sync automatico do vector store apos upload/delete - OK
4. **Migration SQL**: Funcao `update_assistant_instructions_with_files` atualizada para ignorar knowledge files - OK

### Problema encontrado: Trigger orfao
O trigger `update_assistant_instructions_knowledge_trigger` ainda esta ativo na tabela `assistant_knowledge_files`. Isso significa que toda vez que um arquivo de conhecimento e inserido/atualizado/deletado, o trigger dispara a funcao que reconstroi a secao de arquivos nas instructions (mesmo que agora so injete midia, o trigger ainda faz um UPDATE desnecessario no campo `instructions` do assistente, o que pode causar conflito com o texto que o usuario acabou de salvar).

### Plano de correcao (1 migration)
Criar uma migration SQL para dropar o trigger orfao:

```sql
DROP TRIGGER IF EXISTS update_assistant_instructions_knowledge_trigger ON assistant_knowledge_files;
```

Isso remove o unico problema restante. Nenhuma outra alteracao necessaria - o resto da implementacao esta correto e funcional.

### Arquivos
| Arquivo | Acao |
|---|---|
| Migration SQL | Dropar trigger orfao `update_assistant_instructions_knowledge_trigger` |


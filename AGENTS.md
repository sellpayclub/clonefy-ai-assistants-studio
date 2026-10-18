# Architecture rules
- All agent document upload and deletion flows use `src/lib/knowledge-files.ts` so storage keys, error handling and search indexing cannot diverge between creation and editing.
- Vector store synchronization must check indexing completion and propagate failures before confirming that documents are ready for the Responses API.
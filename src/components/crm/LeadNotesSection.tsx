import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, User, Sparkles, Send, Pencil, Trash2, Check, X } from 'lucide-react';
import type { LeadNote } from '@/hooks/useCRMLeads';

interface LeadNotesSectionProps {
  notes: LeadNote[];
  onAddNote: (content: string) => void;
  onUpdateNote?: (id: string, content: string) => void;
  onDeleteNote?: (id: string) => void;
  isLoading?: boolean;
}

export function LeadNotesSection({ notes, onAddNote, onUpdateNote, onDeleteNote, isLoading }: LeadNotesSectionProps) {
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onAddNote(content.trim());
    setContent('');
  };

  const handleStartEdit = (note: LeadNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim() || !editingId) return;
    onUpdateNote?.(editingId, editContent.trim());
    setEditingId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta nota?')) {
      onDeleteNote?.(id);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
        <MessageSquare className="h-4 w-4" /> Notas e Anotações
      </h4>

      {/* Add note */}
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Adicionar anotação sobre este lead..."
          className="min-h-[60px] text-sm resize-none"
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
        />
        <Button size="icon" onClick={handleSubmit} disabled={!content.trim() || isLoading} className="shrink-0 self-end">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Notes timeline */}
      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="flex gap-3 group">
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                note.created_by === 'ai' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {note.created_by === 'ai' ? <Sparkles className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium">
                    {note.created_by === 'ai' ? 'IA' : 'Você'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(note.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>

                  {/* Edit/Delete buttons — only for user notes */}
                  {note.created_by !== 'ai' && editingId !== note.id && (
                    <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onUpdateNote && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleStartEdit(note)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                      {onDeleteNote && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="min-h-[60px] text-sm resize-none"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.ctrlKey) handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-7 gap-1 text-xs" onClick={handleSaveEdit} disabled={!editContent.trim()}>
                        <Check className="h-3 w-3" /> Salvar
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={handleCancelEdit}>
                        <X className="h-3 w-3" /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{note.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-4">
          Nenhuma anotação ainda. Use o campo acima para adicionar.
        </p>
      )}
    </div>
  );
}

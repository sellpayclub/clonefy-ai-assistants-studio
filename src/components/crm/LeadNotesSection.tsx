import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, User, Sparkles, Send } from 'lucide-react';
import type { LeadNote } from '@/hooks/useCRMLeads';

interface LeadNotesSectionProps {
  notes: LeadNote[];
  onAddNote: (content: string) => void;
  isLoading?: boolean;
}

export function LeadNotesSection({ notes, onAddNote, isLoading }: LeadNotesSectionProps) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onAddNote(content.trim());
    setContent('');
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
            <div key={note.id} className="flex gap-3">
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
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{note.content}</p>
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

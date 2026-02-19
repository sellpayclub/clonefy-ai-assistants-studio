import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { PipelineStage } from '@/hooks/useCRMLeads';

interface PipelineSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: PipelineStage[];
  onCreateStage: (stage: Partial<PipelineStage>) => void;
  onUpdateStage: (stage: Partial<PipelineStage> & { id: string }) => void;
  onDeleteStage: (id: string) => void;
}

export function PipelineSettings({ open, onOpenChange, stages, onCreateStage, onUpdateStage, onDeleteStage }: PipelineSettingsProps) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onCreateStage({ name: newName.trim(), color: newColor, sort_order: stages.length });
    setNewName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Pipeline</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {stages.map(stage => (
            <div key={stage.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="color"
                value={stage.color}
                onChange={e => onUpdateStage({ id: stage.id, color: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0"
              />
              <Input
                value={stage.name}
                onChange={e => onUpdateStage({ id: stage.id, name: e.target.value })}
                className="h-8 text-sm flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDeleteStage(stage.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0" />
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nova etapa..."
            className="h-8 text-sm flex-1"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim()} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

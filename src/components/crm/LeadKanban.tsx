import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Phone, Calendar, Flame, Thermometer, Snowflake } from 'lucide-react';
import type { Lead, PipelineStage } from '@/hooks/useCRMLeads';

interface LeadKanbanProps {
  leads: Lead[];
  stages: PipelineStage[];
  onMoveLead: (leadId: string, stage: string) => void;
  onLeadClick: (lead: Lead) => void;
}

export function LeadKanban({ leads, stages, onMoveLead, onLeadClick }: LeadKanbanProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const getLeadsForStage = (stageName: string) =>
    leads.filter(l => (l.pipeline_stage || 'novo') === stageName.toLowerCase());

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Flame className="h-3 w-3 text-red-500" />;
    if (score >= 40) return <Thermometer className="h-3 w-3 text-orange-400" />;
    return <Snowflake className="h-3 w-3 text-blue-400" />;
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
      {stages.map(stage => {
        const stageLeads = getLeadsForStage(stage.name);
        const isOver = dragOverStage === stage.name.toLowerCase();

        return (
          <div
            key={stage.id}
            className={`flex-shrink-0 w-[260px] rounded-lg border transition-colors ${
              isOver ? 'border-primary bg-primary/5' : 'border-border/50 bg-muted/20'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOverStage(stage.name.toLowerCase()); }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={e => {
              e.preventDefault();
              setDragOverStage(null);
              if (draggedLeadId) {
                onMoveLead(draggedLeadId, stage.name.toLowerCase());
                setDraggedLeadId(null);
              }
            }}
          >
            {/* Column header */}
            <div className="p-3 border-b border-border/40 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: stage.color }} />
              <span className="text-sm font-semibold truncate">{stage.name}</span>
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">{stageLeads.length}</Badge>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 min-h-[100px]">
              {stageLeads.map(lead => (
                <Card
                  key={lead.id}
                  draggable
                  onDragStart={() => setDraggedLeadId(lead.id)}
                  onDragEnd={() => { setDraggedLeadId(null); setDragOverStage(null); }}
                  onClick={() => onLeadClick(lead)}
                  className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                    draggedLeadId === lead.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {lead.name ? lead.name[0].toUpperCase() : '#'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{lead.name || 'Desconhecido'}</p>
                    </div>
                    {getScoreIcon(lead.lead_score || 0)}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5">
                    <Phone className="h-2.5 w-2.5" />
                    <span className="truncate">{lead.whatsapp_number}</span>
                  </div>

                  {lead.tags && lead.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0">{tag}</Badge>
                      ))}
                      {lead.tags.length > 2 && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">+{lead.tags.length - 2}</Badge>
                      )}
                    </div>
                  )}

                  {lead.last_interaction && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5">
                      <Calendar className="h-2.5 w-2.5" />
                      {new Date(lead.last_interaction).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </div>
                  )}
                </Card>
              ))}

              {stageLeads.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Arraste leads aqui
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

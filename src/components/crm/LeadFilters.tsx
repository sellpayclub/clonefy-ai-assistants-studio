import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, RotateCcw } from 'lucide-react';
import { TagInput } from './TagInput';
import type { LeadFilters as Filters, PipelineStage } from '@/hooks/useCRMLeads';

interface LeadFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
  pipelineStages: PipelineStage[];
  allTags: string[];
}

export function LeadFilters({ filters, onChange, onReset, pipelineStages, allTags }: LeadFiltersProps) {
  const hasActiveFilters = filters.pipelineStage || filters.scoreRange !== 'all' || filters.source || filters.tags.length > 0 || filters.urgency;

  const update = (key: keyof Filters, value: any) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/40">
      {/* Pipeline Stage */}
      <Select value={filters.pipelineStage || '_all'} onValueChange={v => update('pipelineStage', v === '_all' ? null : v)}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="Etapa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Todas etapas</SelectItem>
          {pipelineStages.map(s => (
            <SelectItem key={s.id} value={s.name.toLowerCase()}>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Score */}
      <Select value={filters.scoreRange} onValueChange={v => update('scoreRange', v)}>
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue placeholder="Score" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos scores</SelectItem>
          <SelectItem value="hot">🔥 Quente (80+)</SelectItem>
          <SelectItem value="warm">🌡️ Morno (40-79)</SelectItem>
          <SelectItem value="cold">❄️ Frio (0-39)</SelectItem>
        </SelectContent>
      </Select>

      {/* Source */}
      <Select value={filters.source || '_all'} onValueChange={v => update('source', v === '_all' ? null : v)}>
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue placeholder="Fonte" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Todas fontes</SelectItem>
          <SelectItem value="whatsapp">WhatsApp</SelectItem>
          <SelectItem value="widget">Site</SelectItem>
          <SelectItem value="prospeccao">Prospecção</SelectItem>
        </SelectContent>
      </Select>

      {/* Urgency */}
      <Select value={filters.urgency || '_all'} onValueChange={v => update('urgency', v === '_all' ? null : v)}>
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue placeholder="Urgência" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Todas</SelectItem>
          <SelectItem value="imediata">🚨 Imediata</SelectItem>
          <SelectItem value="alta">⚡ Alta</SelectItem>
          <SelectItem value="média">⏳ Média</SelectItem>
          <SelectItem value="baixa">📅 Baixa</SelectItem>
        </SelectContent>
      </Select>

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} className="h-8 text-xs gap-1">
          <RotateCcw className="h-3 w-3" /> Limpar
        </Button>
      )}
    </div>
  );
}

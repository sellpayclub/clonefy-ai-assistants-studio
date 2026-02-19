import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagInput } from './TagInput';
import type { Lead, PipelineStage } from '@/hooks/useCRMLeads';

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Lead>) => void;
  lead?: Lead | null;
  pipelineStages: PipelineStage[];
  allTags: string[];
  isLoading?: boolean;
}

export function LeadForm({ open, onOpenChange, onSubmit, lead, pipelineStages, allTags, isLoading }: LeadFormProps) {
  const isEdit = !!lead;

  const buildForm = () => ({
    name: lead?.name || '',
    whatsapp_number: lead?.whatsapp_number || '',
    email: lead?.email || '',
    company: lead?.company || '',
    position: lead?.position || '',
    address: lead?.address || '',
    cpf_cnpj: lead?.cpf_cnpj || '',
    tags: lead?.tags || [],
    pipeline_stage: lead?.pipeline_stage || 'novo',
    status: lead?.status || 'aberto',
    lead_score: lead?.lead_score || 0,
    urgency_level: lead?.urgency_level || 'baixa',
  });

  const [form, setForm] = useState(buildForm);

  // Reset form when lead changes or dialog opens
  useEffect(() => {
    if (open) setForm(buildForm());
  }, [open, lead?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<Lead> = {
      name: form.name || null,
      whatsapp_number: form.whatsapp_number,
      email: form.email || null,
      company: form.company || null,
      position: form.position || null,
      address: form.address || null,
      cpf_cnpj: form.cpf_cnpj || null,
      tags: form.tags.length > 0 ? form.tags : null,
      pipeline_stage: form.pipeline_stage,
      status: form.status,
      lead_score: form.lead_score,
      urgency_level: form.urgency_level,
    };
    if (isEdit) data.id = lead!.id;
    onSubmit(data);
  };

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Nome do contato" />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp *</Label>
              <Input value={form.whatsapp_number} onChange={e => update('whatsapp_number', e.target.value)} placeholder="5511999999999" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Input value={form.company} onChange={e => update('company', e.target.value)} placeholder="Nome da empresa" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Input value={form.position} onChange={e => update('position', e.target.value)} placeholder="Cargo / Função" />
            </div>
            <div className="space-y-1.5">
              <Label>CPF/CNPJ</Label>
              <Input value={form.cpf_cnpj} onChange={e => update('cpf_cnpj', e.target.value)} placeholder="Documento" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Endereço</Label>
            <Input value={form.address} onChange={e => update('address', e.target.value)} placeholder="Endereço completo" />
          </div>

          {/* Pipeline & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Etapa do Pipeline</Label>
              <Select value={form.pipeline_stage} onValueChange={v => update('pipeline_stage', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {pipelineStages.map(s => (
                    <SelectItem key={s.id} value={s.name.toLowerCase()}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                  {pipelineStages.length === 0 && <SelectItem value="novo">Novo</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Urgência</Label>
              <Select value={form.urgency_level} onValueChange={v => update('urgency_level', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">📅 Baixa</SelectItem>
                  <SelectItem value="média">⏳ Média</SelectItem>
                  <SelectItem value="alta">⚡ Alta</SelectItem>
                  <SelectItem value="imediata">🚨 Imediata</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <TagInput tags={form.tags} onChange={t => update('tags', t)} suggestions={allTags} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !form.whatsapp_number}>
              {isLoading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

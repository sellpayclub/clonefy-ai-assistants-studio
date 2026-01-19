import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit, Building2, Target, Mic, Link2, AlertTriangle } from "lucide-react";

interface CampaignData {
  name: string;
  description: string;
  business_name: string;
  business_description: string;
  value_proposition: string;
  tone_of_voice: string;
  common_objections: any[];
  important_links: any[];
}

interface CampaignEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  initialData: CampaignData;
  onSave: (data: CampaignData) => void;
}

const CampaignEditModal = ({
  open,
  onOpenChange,
  campaignId,
  initialData,
  onSave,
}: CampaignEditModalProps) => {
  const [data, setData] = useState<CampaignData>(initialData);
  const [newObjection, setNewObjection] = useState("");
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('followup_campaigns')
        .update({
          name: data.name,
          description: data.description,
          business_name: data.business_name,
          business_description: data.business_description,
          value_proposition: data.value_proposition,
          tone_of_voice: data.tone_of_voice,
          common_objections: data.common_objections,
          important_links: data.important_links,
        })
        .eq('id', campaignId);

      if (error) throw error;

      onSave(data);
      toast({ title: "Dados da campanha atualizados! ✅" });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ title: "Erro ao salvar dados", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addObjection = () => {
    if (newObjection.trim()) {
      setData(prev => ({
        ...prev,
        common_objections: [...(prev.common_objections || []), newObjection.trim()]
      }));
      setNewObjection("");
    }
  };

  const removeObjection = (index: number) => {
    setData(prev => ({
      ...prev,
      common_objections: prev.common_objections.filter((_, i) => i !== index)
    }));
  };

  const addLink = () => {
    if (newLink.title.trim() && newLink.url.trim()) {
      setData(prev => ({
        ...prev,
        important_links: [...(prev.important_links || []), { ...newLink }]
      }));
      setNewLink({ title: "", url: "" });
    }
  };

  const removeLink = (index: number) => {
    setData(prev => ({
      ...prev,
      important_links: prev.important_links.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Editar Dados da Campanha
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do seu negócio para melhorar as mensagens da IA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Básico */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-blue-500" />
              Informações Básicas
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Nome da Campanha</Label>
                <Input
                  value={data.name}
                  onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Campanha de Vendas Q1"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Nome do Negócio</Label>
                <Input
                  value={data.business_name}
                  onChange={(e) => setData(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="Ex: Minha Empresa Ltda"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição do Negócio</Label>
                <Textarea
                  value={data.business_description}
                  onChange={(e) => setData(prev => ({ ...prev, business_description: e.target.value }))}
                  placeholder="Descreva o que sua empresa faz, produtos/serviços oferecidos..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição da Campanha</Label>
                <Textarea
                  value={data.description}
                  onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Objetivo desta campanha de follow-up..."
                  className="min-h-[60px]"
                />
              </div>
            </div>
          </div>

          {/* Proposta de Valor */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-green-500" />
              Proposta de Valor
            </div>
            
            <div className="space-y-2">
              <Textarea
                value={data.value_proposition}
                onChange={(e) => setData(prev => ({ ...prev, value_proposition: e.target.value }))}
                placeholder="Qual o principal benefício que você oferece? O que te diferencia?"
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Tom de Voz */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mic className="h-4 w-4 text-purple-500" />
              Tom de Voz
            </div>
            
            <div className="space-y-2">
              <Input
                value={data.tone_of_voice}
                onChange={(e) => setData(prev => ({ ...prev, tone_of_voice: e.target.value }))}
                placeholder="Ex: Profissional e amigável, Formal, Casual e descontraído..."
              />
            </div>
          </div>

          {/* Objeções Comuns */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Objeções Comuns
            </div>
            
            <div className="space-y-2">
              {(data.common_objections || []).map((obj: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                  <span className="flex-1 text-sm">{obj}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeObjection(idx)}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newObjection}
                  onChange={(e) => setNewObjection(e.target.value)}
                  placeholder="Ex: Está muito caro..."
                  onKeyDown={(e) => e.key === 'Enter' && addObjection()}
                />
                <Button variant="outline" onClick={addObjection}>
                  Adicionar
                </Button>
              </div>
            </div>
          </div>

          {/* Links Importantes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link2 className="h-4 w-4 text-cyan-500" />
              Links Importantes
            </div>
            
            <div className="space-y-2">
              {(data.important_links || []).map((link: { title: string; url: string }, idx: number) => (
                <div key={idx} className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                  <span className="flex-1 text-sm">
                    <strong>{link.title}:</strong> {link.url}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeLink(idx)}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newLink.title}
                  onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título (ex: Site)"
                  className="w-1/3"
                />
                <Input
                  value={newLink.url}
                  onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="URL (ex: https://...)"
                  className="flex-1"
                />
                <Button variant="outline" onClick={addLink}>
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignEditModal;

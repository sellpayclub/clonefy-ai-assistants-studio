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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, Clock, Calendar, Zap, Shield } from "lucide-react";

interface CampaignSettings {
  max_followups: number;
  min_interval_minutes: number;
  max_daily_messages: number;
  start_hour: number;
  end_hour: number;
  working_days: number[];
  random_delay_seconds: number;
}

interface CampaignSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  initialSettings: CampaignSettings;
  onSave: (settings: CampaignSettings) => void;
}

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CampaignSettingsModal = ({
  open,
  onOpenChange,
  campaignId,
  initialSettings,
  onSave,
}: CampaignSettingsModalProps) => {
  const [settings, setSettings] = useState<CampaignSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('followup_campaigns')
        .update({
          max_followups: settings.max_followups,
          min_interval_minutes: settings.min_interval_minutes,
          max_daily_messages: settings.max_daily_messages,
          start_hour: settings.start_hour,
          end_hour: settings.end_hour,
          working_days: settings.working_days,
          random_delay_seconds: settings.random_delay_seconds,
        })
        .eq('id', campaignId);

      if (error) throw error;

      onSave(settings);
      toast({ title: "Configurações salvas! ✅" });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ title: "Erro ao salvar configurações", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    if (settings.working_days.includes(day)) {
      setSettings(prev => ({
        ...prev,
        working_days: prev.working_days.filter(d => d !== day)
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        working_days: [...prev.working_days, day].sort()
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configurações da Campanha
          </DialogTitle>
          <DialogDescription>
            Ajuste os parâmetros de disparo e horários de funcionamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Limites */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-orange-500" />
              Limites Anti-Spam
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Máx. Follow-ups por Lead</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.max_followups}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    max_followups: parseInt(e.target.value) || 3
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Máx. Mensagens/Dia</Label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.max_daily_messages}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    max_daily_messages: parseInt(e.target.value) || 100
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Intervalos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4 text-blue-500" />
              Intervalos
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Intervalo Mínimo (minutos)</Label>
                <Input
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.min_interval_minutes}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    min_interval_minutes: parseInt(e.target.value) || 30
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Tempo mínimo entre mensagens para o mesmo lead
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Delay Aleatório (segundos)</Label>
                <Input
                  type="number"
                  min="0"
                  max="300"
                  value={settings.random_delay_seconds}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    random_delay_seconds: parseInt(e.target.value) || 0
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Variação aleatória para parecer mais humano
                </p>
              </div>
            </div>
          </div>

          {/* Horário de Funcionamento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-green-500" />
              Horário de Funcionamento
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Hora Inicial</Label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={settings.start_hour}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    start_hour: parseInt(e.target.value) || 8
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Hora Final</Label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={settings.end_hour}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    end_hour: parseInt(e.target.value) || 20
                  }))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Mensagens só serão enviadas entre {settings.start_hour}h e {settings.end_hour}h
            </p>
          </div>

          {/* Dias da Semana */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-purple-500" />
              Dias Ativos
            </div>
            
            <div className="flex gap-2">
              {dayNames.map((day, idx) => (
                <Button
                  key={idx}
                  variant={settings.working_days.includes(idx) ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => toggleDay(idx)}
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignSettingsModal;

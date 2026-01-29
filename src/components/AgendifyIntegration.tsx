import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, XCircle, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { useAgendifyConfig } from '@/hooks/useAgendifyConfig';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AgendifyIntegrationProps {
  assistantId: string;
  session: any;
  onConfigChange?: (enabled: boolean) => void;
}

export const AgendifyIntegration = ({ assistantId, session, onConfigChange }: AgendifyIntegrationProps) => {
  const {
    config,
    loading,
    testing,
    loadConfig,
    saveConfig,
    disableConfig,
    testConnection,
    isConfigured,
  } = useAgendifyConfig(assistantId, session);

  const [tenantId, setTenantId] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('https://agendamento-agendify.com');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (assistantId && session) {
      loadConfig();
    }
  }, [assistantId, session, loadConfig]);

  useEffect(() => {
    if (config) {
      setTenantId(config.tenant_id || '');
      setApiBaseUrl(config.api_base_url || 'https://agendamento-agendify.com');
      setIsEnabled(config.is_active);
    }
  }, [config]);

  const handleSave = async () => {
    if (!tenantId.trim()) {
      return;
    }
    const success = await saveConfig(tenantId.trim(), apiBaseUrl.trim());
    if (success && onConfigChange) {
      onConfigChange(true);
    }
  };

  const handleToggle = async (checked: boolean) => {
    setIsEnabled(checked);
    if (!checked && config) {
      await disableConfig();
      if (onConfigChange) {
        onConfigChange(false);
      }
    }
  };

  const handleTest = async () => {
    await testConnection();
  };

  return (
    <Card className="border-2 border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Integração Agendify
                {isConfigured && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Conecte ao sistema de agendamentos Agendify
              </CardDescription>
            </div>
          </div>
          <Switch 
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>
      </CardHeader>

      {isEnabled && (
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Para obter seu Tenant ID, acesse{' '}
              <a 
                href="https://agendamento-agendify.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium underline hover:no-underline"
              >
                Agendify Dashboard
              </a>
              {' '}&gt; Configurações &gt; Desenvolvedor
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="tenant-id">Tenant ID (UUID)</Label>
            <Input
              id="tenant-id"
              placeholder="Ex: 123e4567-e89b-12d3-a456-426614174000"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              UUID único da sua conta no Agendify
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-url">URL da API (opcional)</Label>
            <Input
              id="api-url"
              placeholder="https://agendamento-agendify.com"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Altere apenas se usar uma instância personalizada do Agendify
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleSave}
              disabled={loading || !tenantId.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configuração'
              )}
            </Button>
            
            {isConfigured && (
              <Button 
                variant="outline"
                onClick={handleTest}
                disabled={testing}
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
            )}
          </div>

          {isConfigured && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Funcionalidades habilitadas:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Listar serviços
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Verificar horários
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Criar agendamentos
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Cancelar agendamentos
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Buscar profissionais
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Buscar clientes
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

import { useEffect, useState } from 'react';
import {
  Building2,
  Download,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Sparkles,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useProspeccao, exportCompaniesToCsv } from '@/hooks/useProspeccao';
import {
  BRAZILIAN_UFS,
  DEFAULT_LEAD_LIMIT,
  LEAD_LIMIT_OPTIONS,
  PROSPECT_CATEGORY_GROUPS,
  type LeadLimit,
  type ProspectCompany,
} from '@/lib/prospeccao/constants';
import { useQueryClient } from '@tanstack/react-query';
import { ProspectOutreachModal } from '@/components/prospeccao/ProspectOutreachModal';

function formatPhoneDisplay(phone: string | null) {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 12) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
  }
  if (digits.length >= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  return phone;
}

function formatCnpjDisplay(cnpj: string) {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

const Prospeccao = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const prospeccao = useProspeccao();

  const [ramo, setRamo] = useState('beleza_completo');
  const [maxLeads, setMaxLeads] = useState<LeadLimit>(DEFAULT_LEAD_LIMIT);
  const [uf, setUf] = useState('');
  const [municipioCodigo, setMunicipioCodigo] = useState('');
  const [municipioNome, setMunicipioNome] = useState('');
  const [municipios, setMunicipios] = useState<{ id: string; nome: string }[]>([]);
  const [municipiosLoading, setMunicipiosLoading] = useState(false);
  const [contemCelular, setContemCelular] = useState(true);
  const [contemEmail, setContemEmail] = useState(false);
  const [page, setPage] = useState(0);
  const [companies, setCompanies] = useState<ProspectCompany[]>([]);
  const [searchMeta, setSearchMeta] = useState<{ total: number; totalPages: number; provider: string } | null>(null);
  const [enrichingCnpj, setEnrichingCnpj] = useState<string | null>(null);
  const [cddKeyInput, setCddKeyInput] = useState(prospeccao.apiKeys.casaDosDados || '');
  const [resolvingAction, setResolvingAction] = useState(false);
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [outreachCompanies, setOutreachCompanies] = useState<ProspectCompany[]>([]);

  useEffect(() => {
    setCddKeyInput(prospeccao.apiKeys.casaDosDados || '');
  }, [prospeccao.apiKeys.casaDosDados]);

  useEffect(() => {
    if (!uf) {
      setMunicipios([]);
      setMunicipioCodigo('');
      setMunicipioNome('');
      return;
    }

    setMunicipiosLoading(true);
    prospeccao.fetchMunicipios(uf)
      .then(list => {
        setMunicipios(list);
        setMunicipioCodigo('');
        setMunicipioNome('');
      })
      .catch(err => {
        toast({
          title: 'Erro ao carregar cidades',
          description: err.message,
          variant: 'destructive',
        });
      })
      .finally(() => setMunicipiosLoading(false));
  }, [uf]);

  const canSearch = !!ramo && !!uf && !!municipioCodigo && !!municipioNome;

  const searchParams = {
    ramo,
    uf,
    municipioCodigo,
    municipioNome,
    limit: 50,
    maxLeads,
    contemCelular,
    contemEmail,
  };

  const effectiveTotal = searchMeta
    ? Math.min(searchMeta.total, maxLeads)
    : 0;

  const runSearch = async (targetPage: number, resetSelection: boolean) => {
    if (!canSearch) return;

    if (resetSelection) prospeccao.resetSelection();

    try {
      const result = await prospeccao.search.mutateAsync({
        ...searchParams,
        page: targetPage,
      });

      setCompanies(result.companies);
      prospeccao.mergeIntoCache(result.companies);
      prospeccao.updateSearchContext({ ...searchParams, page: targetPage }, result);
      setSearchMeta({
        total: result.total,
        totalPages: result.totalPages,
        provider: result.provider,
      });
      setPage(targetPage);
    } catch (err: any) {
      toast({
        title: 'Erro na busca',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleSearchNew = () => runSearch(0, true);
  const handlePageChange = (targetPage: number) => runSearch(targetPage, false);

  const handleExport = async () => {
    if (prospeccao.selectedCount === 0) {
      exportCompaniesToCsv(companies);
      toast({
        title: 'Exportação concluída',
        description: `${companies.length} empresa(s) da página exportada(s).`,
      });
      return;
    }
    await resolveAndRun('export');
  };

  const resolveAndRun = async (
    action: 'export' | 'import' | 'outreach',
  ) => {
    if (prospeccao.selectedCount === 0) {
      toast({ title: 'Selecione ao menos uma empresa', variant: 'destructive' });
      return;
    }

    setResolvingAction(true);
    try {
      const { companies: resolved, truncated } = await prospeccao.resolveSelectedCompanies();
      if (!resolved.length) {
        toast({ title: 'Nenhuma empresa encontrada na seleção', variant: 'destructive' });
        return;
      }

      if (truncated) {
        toast({
          title: `Limite de ${maxLeads} empresas`,
          description: `Foram carregadas ${resolved.length} empresas (máximo da sua busca).`,
        });
      }

      if (action === 'export') {
        exportCompaniesToCsv(resolved);
        toast({
          title: 'Exportação concluída',
          description: `${resolved.length} empresa(s) exportada(s).`,
        });
      } else if (action === 'import') {
        const result = await prospeccao.importLeads.mutateAsync({
          companies: resolved,
          ramo,
          cidade: municipioNome,
        });
        queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
        toast({
          title: 'Importação concluída',
          description: `${result.imported} lead(s) importado(s), ${result.skipped} ignorado(s).`,
        });
      } else {
        setOutreachCompanies(resolved);
        setOutreachOpen(true);
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao resolver seleção',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setResolvingAction(false);
    }
  };

  const handleEnrich = async (company: ProspectCompany) => {
    const canEnrich =
      prospeccao.config?.hasGeckoApi || !!prospeccao.apiKeys.casaDosDados;
    if (!canEnrich) {
      toast({
        title: 'API não configurada',
        description: 'Informe sua chave Casa dos Dados para buscar contatos do CNPJ.',
        variant: 'destructive',
      });
      return;
    }

    setEnrichingCnpj(company.cnpj);
    try {
      const { enrichment } = await prospeccao.enrich.mutateAsync(company.cnpj);
      const updated = {
        ...company,
        ...enrichment,
        telefone: enrichment.telefone || company.telefone,
        email: enrichment.email || company.email,
        socioPrincipal: enrichment.socioPrincipal || company.socioPrincipal,
        hasPhone: enrichment.hasPhone ?? company.hasPhone,
        enriched: true,
      };
      setCompanies(prev =>
        prev.map(c => (c.cnpj === company.cnpj ? updated : c)),
      );
      prospeccao.mergeIntoCache([updated]);
      toast({ title: 'Contato enriquecido com sucesso' });
    } catch (err: any) {
      toast({
        title: 'Erro no enriquecimento',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setEnrichingCnpj(null);
    }
  };

  const isBusy =
    resolvingAction ||
    prospeccao.resolvingSelection ||
    prospeccao.search.isPending;

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden space-y-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Prospecção Local
          </h1>
          <p className="text-muted-foreground text-sm">
            Empresas reais da Receita Federal — CNPJ, sócio, telefone e e-mail cadastrados
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chave API de CNPJ</CardTitle>
          <CardDescription>
            Necessária para buscar dados da Receita Federal (não Google Maps).{' '}
            <a
              href="https://portal.casadosdados.com.br/plataforma/api/chave"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Obter chave Casa dos Dados
            </a>{' '}
            (200 consultas grátis para teste).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Input
            type="password"
            placeholder="Cole sua api-key da Casa dos Dados"
            value={cddKeyInput}
            onChange={e => setCddKeyInput(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={() => {
              prospeccao.saveApiKeys({ ...prospeccao.apiKeys, casaDosDados: cddKeyInput.trim() });
              toast({ title: 'Chave salva nesta sessão' });
            }}
          >
            Salvar chave
          </Button>
        </CardContent>
      </Card>

      {!prospeccao.configLoading && !prospeccao.config?.configured && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>API de CNPJ necessária</AlertTitle>
          <AlertDescription>
            Informe sua chave da Casa dos Dados acima. A GeckoAPI sozinha não faz busca por
            CNAE/cidade — ela só enriquece CNPJs individuais.
          </AlertDescription>
        </Alert>
      )}

      {prospeccao.config?.configured && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>
            Fonte: Receita Federal via {prospeccao.config.provider === 'casadosdados' ? 'Casa dos Dados' : 'BuscaLead'}
          </AlertTitle>
          <AlertDescription>
            Retorna CNPJ, razão social, nome do sócio, telefone e e-mail cadastrados na Receita.
            Nem toda empresa tem telefone no CNPJ — use o filtro &quot;Só com celular&quot;.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de busca</CardTitle>
          <CardDescription>
            Selecione a categoria, localização e quantidade de leads antes de buscar (cada resultado consome crédito da API)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2 lg:col-span-2">
              <Label>Categoria de negócio</Label>
              <Select value={ramo} onValueChange={setRamo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {PROSPECT_CATEGORY_GROUPS.map(group => (
                    <SelectGroup key={group.id}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado (UF)</Label>
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_UFS.map(sigla => (
                    <SelectItem key={sigla} value={sigla}>
                      {sigla}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cidade</Label>
              <Select
                value={municipioCodigo}
                onValueChange={id => {
                  setMunicipioCodigo(id);
                  const m = municipios.find(x => x.id === id);
                  setMunicipioNome(m?.nome || '');
                }}
                disabled={!uf || municipiosLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={municipiosLoading ? 'Carregando...' : 'Selecione a cidade'} />
                </SelectTrigger>
                <SelectContent>
                  {municipios.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade de leads</Label>
              <Select
                value={String(maxLeads)}
                onValueChange={v => setMaxLeads(Number(v) as LeadLimit)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_LIMIT_OPTIONS.map(n => (
                    <SelectItem key={n} value={String(n)}>
                      Até {n} leads
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Limite máximo por busca — economiza créditos da Casa dos Dados
              </p>
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label>Filtros de contato</Label>
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <Switch id="celular" checked={contemCelular} onCheckedChange={setContemCelular} />
                  <Label htmlFor="celular" className="font-normal cursor-pointer">
                    Só com celular
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="email" checked={contemEmail} onCheckedChange={setContemEmail} />
                  <Label htmlFor="email" className="font-normal cursor-pointer">
                    Só com e-mail
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSearchNew}
            disabled={!canSearch || prospeccao.search.isPending || !prospeccao.config?.configured}
            className="gap-2"
          >
            {prospeccao.search.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Buscar empresas
          </Button>
        </CardContent>
      </Card>

      {companies.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Resultados</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {municipioNome}, {uf}
                  {searchMeta && (
                    <Badge variant="secondary" className="ml-2">
                      {searchMeta.total.toLocaleString('pt-BR')} no total
                      {searchMeta.total > maxLeads && (
                        <> · buscando até {maxLeads}</>
                      )}
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={isBusy}
                  onClick={handleExport}
                >
                  {isBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Exportar CSV ({prospeccao.selectedCount || 'todas'})
                </Button>
                <Button
                  size="sm"
                  className="gap-1"
                  disabled={!prospeccao.selectedCount || isBusy || prospeccao.importLeads.isPending}
                  onClick={() => resolveAndRun('import')}
                >
                  {prospeccao.importLeads.isPending || isBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Importar CRM ({prospeccao.selectedCount})
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                  disabled={!prospeccao.selectedCount || isBusy}
                  onClick={() => resolveAndRun('outreach')}
                >
                  {isBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MessageCircle className="h-3.5 w-3.5" />
                  )}
                  Disparar WhatsApp ({prospeccao.selectedCount})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {prospeccao.selectedCount > 0 && (
              <div className="px-4 py-2 bg-primary/5 border-b text-sm flex flex-wrap items-center gap-2">
                {prospeccao.showSelectAllBanner(companies) && searchMeta ? (
                  <span>
                    <strong>{companies.length}</strong> selecionada(s) nesta página.{' '}
                    <button
                      type="button"
                      className="text-primary underline font-medium"
                      onClick={prospeccao.selectAllAcrossPages}
                    >
                      Selecionar até {effectiveTotal.toLocaleString('pt-BR')} leads
                    </button>
                  </span>
                ) : (
                  <span>
                    <strong>{prospeccao.selectedCount.toLocaleString('pt-BR')}</strong> selecionada(s)
                  </span>
                )}
                {prospeccao.selectionMode === 'all' && (
                  <Badge variant="secondary">Todas as páginas</Badge>
                )}
                <button
                  type="button"
                  className="text-muted-foreground underline ml-auto text-xs"
                  onClick={prospeccao.clearSelection}
                >
                  Limpar seleção
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={prospeccao.isAllPageSelected(companies)}
                        onCheckedChange={() => prospeccao.toggleSelectAllPage(companies)}
                      />
                    </TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Sócio</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map(company => (
                    <TableRow key={company.cnpj}>
                      <TableCell>
                        <Checkbox
                          checked={prospeccao.isCompanySelected(company.cnpj)}
                          onCheckedChange={() => prospeccao.toggleSelection(company)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {company.nomeFantasia || company.razaoSocial}
                        </div>
                        {company.nomeFantasia && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {company.razaoSocial}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                          {company.endereco}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {formatCnpjDisplay(company.cnpj)}
                      </TableCell>
                      <TableCell>
                        {company.telefone ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-green-600" />
                            {formatPhoneDisplay(company.telefone)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sem telefone</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.email ? (
                          <span className="flex items-center gap-1 text-xs truncate max-w-[160px]">
                            <Mail className="h-3 w-3" />
                            {company.email}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">
                        {company.socioPrincipal || '—'}
                      </TableCell>
                      <TableCell>
                        {!company.hasPhone && (prospeccao.config?.hasGeckoApi || prospeccao.apiKeys.casaDosDados) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 gap-1"
                            onClick={() => handleEnrich(company)}
                            disabled={enrichingCnpj === company.cnpj}
                          >
                            {enrichingCnpj === company.cnpj ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        {company.enriched && (
                          <Badge variant="outline" className="text-[10px]">+</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {searchMeta && searchMeta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Página {page + 1} de {searchMeta.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0 || prospeccao.search.isPending}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= searchMeta.totalPages - 1 || prospeccao.search.isPending}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ProspectOutreachModal
        open={outreachOpen}
        onOpenChange={setOutreachOpen}
        companies={outreachCompanies}
        isLocalMode={prospeccao.isLocalMode}
        getCampaignStatus={prospeccao.getCampaignStatus}
        processQueueDev={prospeccao.processQueueDev}
        onStart={async params => {
          const result = await prospeccao.startOutreach.mutateAsync({
            companies: outreachCompanies,
            messageTemplate: params.messageTemplate,
            whatsappInstance: params.whatsappInstance,
            delaySeconds: params.delaySeconds,
            importToCrm: params.importToCrm,
            searchContext: prospeccao.searchContext,
          });
          queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
          return result;
        }}
      />
    </main>
  );
};

export default Prospeccao;

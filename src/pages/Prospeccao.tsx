import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Download,
  Loader2,
  MapPin,
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
  SelectItem,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useProspeccao, exportCompaniesToCsv } from '@/hooks/useProspeccao';
import {
  BRAZILIAN_UFS,
  RAMO_OPTIONS,
  type ProspectCompany,
  type RamoNegocio,
} from '@/lib/prospeccao/constants';
import { useQueryClient } from '@tanstack/react-query';

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
  if (cnpj.startsWith('gplace_')) return 'Google Maps';
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

const Prospeccao = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const prospeccao = useProspeccao();

  const [ramo, setRamo] = useState<RamoNegocio>('beleza_completo');
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

  const handleSearch = async (targetPage = 0) => {
    if (!canSearch) return;

    try {
      const result = await prospeccao.search.mutateAsync({
        ramo,
        uf,
        municipioCodigo,
        municipioNome,
        page: targetPage,
        limit: 50,
        contemCelular,
        contemEmail,
      });

      setCompanies(result.companies);
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

  const selectedCompanies = useMemo(
    () => prospeccao.getSelectedCompanies(companies),
    [companies, prospeccao.selectedIds],
  );

  const handleImport = async () => {
    if (!selectedCompanies.length) {
      toast({ title: 'Selecione ao menos uma empresa', variant: 'destructive' });
      return;
    }

    try {
      const result = await prospeccao.importLeads.mutateAsync({
        companies: selectedCompanies,
        ramo,
        cidade: municipioNome,
      });

      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });

      toast({
        title: 'Importação concluída',
        description: `${result.imported} lead(s) importado(s), ${result.skipped} ignorado(s).`,
      });

      if (result.errors.length) {
        console.warn('Import errors:', result.errors);
      }
    } catch (err: any) {
      toast({
        title: 'Erro na importação',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleEnrich = async (company: ProspectCompany) => {
    if (!prospeccao.config?.hasGeckoApi) {
      toast({
        title: 'GeckoAPI não configurada',
        description: 'Configure GECKOAPI_API_KEY para enriquecer contatos.',
        variant: 'destructive',
      });
      return;
    }

    setEnrichingCnpj(company.cnpj);
    try {
      const { enrichment } = await prospeccao.enrich.mutateAsync(company.cnpj);
      setCompanies(prev =>
        prev.map(c =>
          c.cnpj === company.cnpj
            ? {
                ...c,
                ...enrichment,
                telefone: enrichment.telefone || c.telefone,
                email: enrichment.email || c.email,
                socioPrincipal: enrichment.socioPrincipal || c.socioPrincipal,
                hasPhone: enrichment.hasPhone ?? c.hasPhone,
                enriched: true,
              }
            : c,
        ),
      );
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
            Busque empresas por ramo e cidade com dados de CNPJ e contato
          </p>
        </div>
      </div>

      {prospeccao.isLocalMode && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Modo local ativo</AlertTitle>
          <AlertDescription>
            Busca via GeckoAPI + Google Maps. Importação direta no CRM.
          </AlertDescription>
        </Alert>
      )}

      {!prospeccao.configLoading && !prospeccao.config?.configured && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>API não configurada</AlertTitle>
          <AlertDescription>
            Configure <code>BUSCALEAD_API_KEY</code> ou <code>CASA_DOS_DADOS_API_KEY</code> nas
            variáveis de ambiente do Supabase para habilitar a busca.
          </AlertDescription>
        </Alert>
      )}

      {prospeccao.config?.configured && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>API conectada: {prospeccao.config.provider}</AlertTitle>
          <AlertDescription>
            Dados provenientes do cadastro da Receita Federal. Telefones podem estar desatualizados.
            {prospeccao.config.hasGeckoApi && ' Enriquecimento GeckoAPI disponível.'}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de busca</CardTitle>
          <CardDescription>
            Selecione o ramo de negócio e a localização para encontrar empresas ativas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Ramo de negócio</Label>
              <Select value={ramo} onValueChange={v => setRamo(v as RamoNegocio)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ramo" />
                </SelectTrigger>
                <SelectContent>
                  {RAMO_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
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
            onClick={() => handleSearch(0)}
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
                      {searchMeta.total.toLocaleString('pt-BR')} empresas
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => exportCompaniesToCsv(selectedCompanies.length ? selectedCompanies : companies)}
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar CSV
                </Button>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={handleImport}
                  disabled={!selectedCompanies.length || prospeccao.importLeads.isPending}
                >
                  {prospeccao.importLeads.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Importar para CRM ({selectedCompanies.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={companies.length > 0 && prospeccao.selectedIds.size === companies.length}
                        onCheckedChange={() => prospeccao.toggleSelectAll(companies)}
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
                          checked={prospeccao.selectedIds.has(company.cnpj)}
                          onCheckedChange={() => prospeccao.toggleSelection(company.cnpj)}
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
                        {!company.hasPhone && prospeccao.config?.hasGeckoApi && (
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
                    onClick={() => handleSearch(page - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= searchMeta.totalPages - 1 || prospeccao.search.isPending}
                    onClick={() => handleSearch(page + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
};

export default Prospeccao;

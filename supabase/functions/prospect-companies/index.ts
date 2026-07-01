import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isAdminEmail } from "../_shared/admin.ts";
import { getCnaesForCategory } from "../_shared/prospect-categories.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-casa-dos-dados-api-key, x-buscalead-api-key",
};

interface ProspectCompany {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  telefone: string | null;
  email: string | null;
  endereco: string;
  cidade: string;
  uf: string;
  socioPrincipal: string | null;
  cnae: string | null;
  cnaeDescricao: string | null;
  situacao: string;
  hasPhone: boolean;
  enriched?: boolean;
  dataSource?: "cnpj" | "google_maps";
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function resolveKeys(req: Request) {
  return {
    buscalead:
      req.headers.get("x-buscalead-api-key") ||
      Deno.env.get("BUSCALEAD_API_KEY") ||
      null,
    casadosdados:
      req.headers.get("x-casa-dos-dados-api-key") ||
      Deno.env.get("CASA_DOS_DADOS_API_KEY") ||
      null,
    gecko: Deno.env.get("GECKOAPI_API_KEY") || null,
    preferred: Deno.env.get("PROSPECT_API_PROVIDER") || null,
  };
}

function getSearchProvider(keys: {
  buscalead: string | null;
  casadosdados: string | null;
  preferred: string | null;
}): "buscalead" | "casadosdados" | null {
  const preferred = keys.preferred?.toLowerCase();
  if (preferred === "buscalead" && keys.buscalead) return "buscalead";
  if (preferred === "casadosdados" && keys.casadosdados) return "casadosdados";
  if (keys.buscalead) return "buscalead";
  if (keys.casadosdados) return "casadosdados";
  return null;
}

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return digits;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

function normalizePhone(ddd?: string | null, phone?: string | null): string | null {
  if (!phone) return null;
  const digits = `${ddd || ""}${phone}`.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function buildAddress(parts: {
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
}): string {
  return [
    parts.logradouro,
    parts.numero,
    parts.bairro,
    parts.municipio,
    parts.uf,
    parts.cep,
  ]
    .filter(Boolean)
    .join(", ");
}

async function searchBuscaLead(params: {
  cnaes: string[];
  uf: string;
  municipioCodigo: string;
  page: number;
  limit: number;
  contemCelular: boolean;
  contemEmail: boolean;
  apiKey: string;
}): Promise<{ companies: ProspectCompany[]; total: number; totalPages: number }> {
  const apiKey = params.apiKey;
  const filters: Record<string, unknown> = {
    cnae_fiscal_principal: params.cnaes,
    estado: [params.uf.toUpperCase()],
    municipio: [params.municipioCodigo],
    situacao_cadastral: ["01"],
  };
  if (params.contemCelular) filters.contem_celular = true;
  if (params.contemEmail) filters.contem_email = true;

  const response = await fetch("https://api.buscalead.com/v1/empresas/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filters,
      page: params.page,
      limit: params.limit,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`BuscaLead: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const companies: ProspectCompany[] = (data.results || []).map((item: any) => {
    const phone = normalizePhone(item.ddd_1, item.telefone_1);
    const socio = item.empresa?.socios?.[0]?.nome_socio || null;
    return {
      cnpj: item.cnpj_completo?.replace(/\D/g, "") || "",
      razaoSocial: item.empresa?.razao_social || item.nome_fantasia || "",
      nomeFantasia: item.nome_fantasia || "",
      telefone: phone,
      email: item.correio_eletronico || null,
      endereco: buildAddress({
        logradouro: item.logradouro,
        numero: item.numero,
        bairro: item.bairro,
        municipio: item.municipio_ref?.descricao,
        uf: item.uf,
        cep: item.cep,
      }),
      cidade: item.municipio_ref?.descricao || "",
      uf: item.uf || "",
      socioPrincipal: socio,
      cnae: item.cnae_fiscal_principal || null,
      cnaeDescricao: item.cnae_principal_ref?.descricao || null,
      situacao: item.situacao_cadastral === "01" ? "ATIVA" : item.situacao_cadastral,
      hasPhone: !!phone,
      dataSource: "cnpj",
    };
  });

  return {
    companies,
    total: data.total || 0,
    totalPages: data.totalPages || 1,
  };
}

async function searchCasaDosDados(params: {
  cnaes: string[];
  uf: string;
  municipioNome: string;
  page: number;
  limit: number;
  contemCelular: boolean;
  contemEmail: boolean;
  apiKey: string;
}): Promise<{ companies: ProspectCompany[]; total: number; totalPages: number }> {
  const apiKey = params.apiKey;
  const body = {
    codigo_atividade_principal: params.cnaes,
    incluir_atividade_secundaria: true,
    uf: [params.uf.toLowerCase()],
    municipio: [params.municipioNome.toLowerCase()],
    situacao_cadastral: ["ATIVA"],
    mais_filtros: {
      com_telefone: params.contemCelular || undefined,
      somente_celular: params.contemCelular || undefined,
      com_email: params.contemEmail || undefined,
    },
    pagina: params.page + 1,
    limite: Math.min(params.limit, 100),
  };

  const response = await fetch(
    "https://api.casadosdados.com.br/v5/cnpj/pesquisa?tipo_resultado=completo",
    {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Casa dos Dados: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const cnpjs = data.cnpjs || data.data?.cnpjs || [];
  const total = data.total || cnpjs.length;
  const limit = Math.min(params.limit, 100);

  const companies: ProspectCompany[] = cnpjs.map((item: any) => {
    const contatos = item.contato || item.contatos || {};
    const telList = contatos.telefones || item.contato_telefonico || [];
    const emailList = contatos.emails || item.contato_email || [];
    const firstPhone = telList[0];
    const phone = firstPhone
      ? normalizePhone(firstPhone.ddd, firstPhone.numero || firstPhone.completo)
      : null;
    const email = emailList[0]?.email || emailList[0] || null;
    const socio = item.quadro_societario?.[0]?.nome || null;
    const end = item.endereco || {};

    return {
      cnpj: (item.cnpj || "").replace(/\D/g, ""),
      razaoSocial: item.razao_social || "",
      nomeFantasia: item.nome_fantasia || "",
      telefone: phone,
      email: typeof email === "string" ? email : email?.email || null,
      endereco: buildAddress({
        logradouro: end.logradouro,
        numero: end.numero,
        bairro: end.bairro,
        municipio: end.municipio,
        uf: end.uf,
        cep: end.cep,
      }),
      cidade: end.municipio || "",
      uf: (end.uf || params.uf).toUpperCase(),
      socioPrincipal: socio,
      cnae: item.codigo_atividade_principal || item.atividade_principal?.codigo || null,
      cnaeDescricao:
        item.descricao_atividade_principal || item.atividade_principal?.descricao || null,
      situacao: item.situacao_cadastral?.situacao_cadastral || "ATIVA",
      hasPhone: !!phone,
      dataSource: "cnpj",
    };
  });

  const enrichedCompanies = await enrichCompaniesWithCnpjDetails(companies, apiKey);

  return {
    companies: enrichedCompanies,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function fetchCasaDosDadosDetail(cnpj: string, apiKey: string) {
  const clean = cnpj.replace(/\D/g, "");
  const response = await fetch(`https://api.casadosdados.com.br/v4/cnpj/${clean}`, {
    headers: { "api-key": apiKey },
  });
  if (!response.ok) return null;
  return await response.json();
}

async function enrichCompaniesWithCnpjDetails(
  companies: ProspectCompany[],
  apiKey: string,
): Promise<ProspectCompany[]> {
  const enriched: ProspectCompany[] = [];
  for (const company of companies) {
    if (company.telefone && company.email) {
      enriched.push({ ...company, dataSource: "cnpj" });
      continue;
    }
    const detail = await fetchCasaDosDadosDetail(company.cnpj, apiKey);
    if (!detail) {
      enriched.push({ ...company, dataSource: "cnpj" });
      continue;
    }
    const telList = detail.contato_telefonico || [];
    const emailList = detail.contato_email || [];
    const firstPhone = telList[0];
    const phone = company.telefone ||
      (firstPhone
        ? normalizePhone(firstPhone.ddd, firstPhone.numero || firstPhone.completo)
        : null);
    const email = company.email || emailList[0]?.email || null;
    const socio = company.socioPrincipal || detail.quadro_societario?.[0]?.nome || null;
    enriched.push({
      ...company,
      telefone: phone,
      email,
      socioPrincipal: socio,
      hasPhone: !!phone,
      dataSource: "cnpj",
    });
  }
  return enriched;
}

async function enrichWithGecko(cnpj: string): Promise<Partial<ProspectCompany>> {
  const apiKey = Deno.env.get("GECKOAPI_API_KEY");
  if (!apiKey) {
    throw new Error("GECKOAPI_API_KEY não configurada");
  }

  const cleanCnpj = cnpj.replace(/\D/g, "");
  const response = await fetch("https://api.geckoapi.com.br/v1/extract", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: `https://casadosdados.com.br/solucao/cnpj/${cleanCnpj}`,
      target: "casadosdados.com.br",
      type: "pdp",
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GeckoAPI: ${response.status} - ${errText}`);
  }

  const payload = await response.json();
  const item = payload.data || payload;
  const telList = item.contato_telefonico || [];
  const emailList = item.contato_email || [];
  const firstPhone = telList[0];
  const phone = firstPhone
    ? normalizePhone(firstPhone.ddd, firstPhone.numero || firstPhone.completo)
    : null;

  return {
    telefone: phone,
    email: emailList[0]?.email || null,
    socioPrincipal: item.quadro_societario?.[0]?.nome || null,
    hasPhone: !!phone,
    enriched: true,
  };
}

async function listEstados() {
  const response = await fetch(
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
  );
  if (!response.ok) throw new Error("Falha ao carregar estados");
  const data = await response.json();
  return data.map((e: any) => ({ sigla: e.sigla, nome: e.nome, id: e.id }));
}

async function listMunicipios(uf: string) {
  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
  );
  if (!response.ok) throw new Error("Falha ao carregar municípios");
  const data = await response.json();
  return data.map((m: any) => ({
    id: String(m.id),
    nome: m.nome,
  }));
}

async function importLeads(
  userId: string,
  companies: ProspectCompany[],
  meta: { ramo: string; cidade: string },
) {
  const { data: existingLeads } = await supabase
    .from("crm_leads")
    .select("cpf_cnpj, whatsapp_number")
    .eq("user_id", userId);

  const existingCnpjs = new Set(
    (existingLeads || [])
      .map((l) => l.cpf_cnpj?.replace(/\D/g, ""))
      .filter(Boolean),
  );

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  const existingPhones = new Set(
    (existingLeads || [])
      .map((l) => l.whatsapp_number?.replace(/\D/g, ""))
      .filter(Boolean),
  );

  for (const company of companies) {
    const cleanCnpj = company.cnpj.replace(/\D/g, "");
    if (cleanCnpj.length !== 14) {
      skipped++;
      continue;
    }

    if (existingCnpjs.has(cleanCnpj)) {
      skipped++;
      continue;
    }

    const whatsappNumber = company.telefone
      ? company.telefone.replace(/\D/g, "")
      : `prospeccao_${cleanCnpj}`;

    if (existingPhones.has(whatsappNumber)) {
      skipped++;
      continue;
    }

    const tagSlug = `${meta.ramo}-${meta.cidade}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const leadData = {
      user_id: userId,
      name: company.nomeFantasia || company.razaoSocial || "Empresa",
      company: company.razaoSocial,
      whatsapp_number: whatsappNumber,
      email: company.email,
      cpf_cnpj: cleanCnpj.length === 14 ? formatCnpj(cleanCnpj) : null,
      address: company.endereco,
      source: "prospeccao",
      pipeline_stage: "novo",
      lead_score: company.hasPhone ? 30 : 10,
      status: "aberto",
      intent_summary: company.cnaeDescricao
        ? `Prospecção CNPJ: ${company.cnaeDescricao}`
        : "Lead prospectado por CNPJ (Receita Federal)",
      tags: ["prospeccao", "cnpj", tagSlug].filter(Boolean),
      last_interaction: new Date().toISOString(),
      custom_fields: {
        socio_principal: company.socioPrincipal,
        cnae: company.cnae,
        cidade: company.cidade,
        uf: company.uf,
        enriched: company.enriched || false,
        data_source: "cnpj",
      },
    };

    const { error } = await supabase.from("crm_leads").insert(leadData);
    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        skipped++;
      } else {
        errors.push(`${company.cnpj}: ${error.message}`);
      }
    } else {
      imported++;
      if (cleanCnpj) existingCnpjs.add(cleanCnpj);
      existingPhones.add(whatsappNumber);
    }
  }

  return { imported, skipped, errors };
}

async function fetchAllPages(params: {
  searchProvider: "buscalead" | "casadosdados";
  cnaes: string[];
  uf: string;
  municipioCodigo?: string;
  municipioNome?: string;
  contemCelular: boolean;
  contemEmail: boolean;
  keys: { buscalead: string | null; casadosdados: string | null };
  maxResults: number;
  excludedCnpjs: Set<string>;
}): Promise<{ companies: ProspectCompany[]; total: number; fetched: number; truncated: boolean }> {
  const allCompanies: ProspectCompany[] = [];
  const seenCnpjs = new Set<string>();
  let page = 0;
  let total = 0;
  const limit = 100;

  while (allCompanies.length < params.maxResults) {
    let result;
    if (params.searchProvider === "buscalead") {
      result = await searchBuscaLead({
        cnaes: params.cnaes,
        uf: params.uf,
        municipioCodigo: params.municipioCodigo!,
        page,
        limit,
        contemCelular: params.contemCelular,
        contemEmail: params.contemEmail,
        apiKey: params.keys.buscalead!,
      });
    } else {
      result = await searchCasaDosDados({
        cnaes: params.cnaes,
        uf: params.uf,
        municipioNome: params.municipioNome!,
        page,
        limit,
        contemCelular: params.contemCelular,
        contemEmail: params.contemEmail,
        apiKey: params.keys.casadosdados!,
      });
    }

    total = result.total;
    if (!result.companies.length) break;

    for (const company of result.companies) {
      if (params.excludedCnpjs.has(company.cnpj)) continue;
      if (seenCnpjs.has(company.cnpj)) continue;
      seenCnpjs.add(company.cnpj);
      allCompanies.push(company);
      if (allCompanies.length >= params.maxResults) break;
    }

    page++;
    if (page >= result.totalPages) break;
  }

  return {
    companies: allCompanies,
    total,
    fetched: allCompanies.length,
    truncated: total > allCompanies.length,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Não autorizado" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: "Token inválido" }, 401);
    }

    if (!isAdminEmail(user.email)) {
      return jsonResponse({ error: "Prospecção disponível apenas para administradores" }, 403);
    }

    const { action, ...data } = await req.json();
    const keys = resolveKeys(req);
    const searchProvider = getSearchProvider(keys);

    switch (action) {
      case "get_config": {
        return jsonResponse({
          provider: searchProvider,
          dataSource: searchProvider ? "cnpj" : null,
          hasGeckoApi: !!keys.gecko,
          configured: !!searchProvider,
        });
      }

      case "list_estados": {
        const estados = await listEstados();
        return jsonResponse({ estados });
      }

      case "list_municipios": {
        const municipios = await listMunicipios(data.uf);
        return jsonResponse({ municipios });
      }

      case "search": {
        if (!searchProvider) {
          return jsonResponse({
            error:
              "Configure uma API de CNPJ: Casa dos Dados ou BuscaLead. Obtenha em portal.casadosdados.com.br ou buscalead.com.",
          }, 503);
        }

        const ramo = data.ramo as string;
        const cnaes = getCnaesForCategory(ramo);
        if (!cnaes) {
          return jsonResponse({ error: "Categoria de negócio inválida" }, 400);
        }

        const page = Number(data.page) || 0;
        const maxLeads = Math.min(Number(data.maxLeads) || 200, 200);
        const pageSize = Math.min(Math.min(Number(data.limit) || 50, 100), maxLeads);
        const offset = page * pageSize;
        if (offset >= maxLeads) {
          return jsonResponse({
            companies: [],
            page,
            total: 0,
            totalPages: 0,
            provider: searchProvider,
            dataSource: "cnpj",
            maxLeads,
          });
        }
        const limit = Math.min(pageSize, maxLeads - offset);
        const contemCelular = data.contemCelular !== false;
        const contemEmail = !!data.contemEmail;

        let result;
        if (searchProvider === "buscalead") {
          if (!data.municipioCodigo) {
            return jsonResponse({ error: "Código IBGE do município é obrigatório" }, 400);
          }
          result = await searchBuscaLead({
            cnaes,
            uf: data.uf,
            municipioCodigo: data.municipioCodigo,
            page,
            limit,
            contemCelular,
            contemEmail,
            apiKey: keys.buscalead!,
          });
        } else {
          result = await searchCasaDosDados({
            cnaes,
            uf: data.uf,
            municipioNome: data.municipioNome,
            page,
            limit,
            contemCelular,
            contemEmail,
            apiKey: keys.casadosdados!,
          });
        }

        const cappedTotal = Math.min(result.total, maxLeads);
        const totalPages = Math.max(1, Math.ceil(cappedTotal / pageSize));

        return jsonResponse({
          companies: result.companies.slice(0, limit),
          page,
          total: result.total,
          totalPages,
          provider: searchProvider,
          dataSource: "cnpj",
          maxLeads,
          cappedTotal,
        });
      }

      case "fetch_all_pages": {
        if (!searchProvider) {
          return jsonResponse({
            error:
              "Configure uma API de CNPJ: Casa dos Dados ou BuscaLead.",
          }, 503);
        }

        const ramo = data.ramo as string;
        const cnaes = getCnaesForCategory(ramo);
        if (!cnaes) {
          return jsonResponse({ error: "Categoria de negócio inválida" }, 400);
        }
        const contemCelular = data.contemCelular !== false;
        const contemEmail = !!data.contemEmail;
        const maxResults = Math.min(Number(data.maxResults) || 200, 200);
        const excludedCnpjs = new Set<string>(
          (data.excludedCnpjs as string[] | undefined) || [],
        );

        const result = await fetchAllPages({
          searchProvider,
          cnaes,
          uf: data.uf,
          municipioCodigo: data.municipioCodigo,
          municipioNome: data.municipioNome,
          contemCelular,
          contemEmail,
          keys,
          maxResults,
          excludedCnpjs,
        });

        return jsonResponse({
          companies: result.companies,
          total: result.total,
          fetched: result.fetched,
          truncated: result.truncated,
          provider: searchProvider,
          dataSource: "cnpj",
        });
      }

      case "enrich_cnpj": {
        const cleanCnpj = String(data.cnpj).replace(/\D/g, "");
        if (cleanCnpj.length !== 14) {
          return jsonResponse({ error: "CNPJ inválido para enriquecimento" }, 400);
        }
        if (keys.casadosdados) {
          const detail = await fetchCasaDosDadosDetail(cleanCnpj, keys.casadosdados);
          if (detail) {
            const telList = detail.contato_telefonico || [];
            const emailList = detail.contato_email || [];
            const firstPhone = telList[0];
            const phone = firstPhone
              ? normalizePhone(firstPhone.ddd, firstPhone.numero || firstPhone.completo)
              : null;
            return jsonResponse({
              enrichment: {
                telefone: phone,
                email: emailList[0]?.email || null,
                socioPrincipal: detail.quadro_societario?.[0]?.nome || null,
                hasPhone: !!phone,
                enriched: true,
              },
            });
          }
        }
        const enrichment = await enrichWithGecko(cleanCnpj);
        return jsonResponse({ enrichment });
      }

      case "import_leads": {
        const companies = (data.companies || []) as ProspectCompany[];
        if (!companies.length) {
          return jsonResponse({ error: "Nenhuma empresa selecionada" }, 400);
        }
        const result = await importLeads(user.id, companies, {
          ramo: data.ramo || "prospeccao",
          cidade: data.cidade || "",
        });
        return jsonResponse(result);
      }

      default:
        return jsonResponse({ error: "Ação inválida" }, 400);
    }
  } catch (error) {
    console.error("prospect-companies error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Erro interno" },
      500,
    );
  }
});

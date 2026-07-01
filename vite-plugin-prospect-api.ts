import type { Plugin } from "vite";
import { loadEnv } from "vite";
import {
  RAMO_CNAE_MAP,
  getSearchProvider,
  mapCnpjRecord,
  normalizePhone,
  parseCnpjContacts,
} from "./src/lib/prospeccao/cnpj-search";

function resolveKeys(
  env: Record<string, string>,
  headers: Record<string, string | undefined>,
) {
  return {
    buscalead: headers["x-buscalead-api-key"] || env.BUSCALEAD_API_KEY || null,
    casadosdados: headers["x-casa-dos-dados-api-key"] || env.CASA_DOS_DADOS_API_KEY || null,
    gecko: env.GECKOAPI_API_KEY || null,
    preferred: env.PROSPECT_API_PROVIDER || null,
  };
}

async function readBody(req: import("http").IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function fetchCasaDosDadosDetail(cnpj: string, apiKey: string) {
  const clean = cnpj.replace(/\D/g, "");
  const response = await fetch(`https://api.casadosdados.com.br/v4/cnpj/${clean}`, {
    headers: { "api-key": apiKey },
  });
  if (!response.ok) return null;
  return response.json();
}

async function searchCasaDosDados(
  apiKey: string,
  params: {
    cnaes: string[];
    uf: string;
    municipioNome: string;
    page: number;
    limit: number;
    contemCelular: boolean;
    contemEmail: boolean;
  },
) {
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
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw new Error(`Casa dos Dados: ${response.status} - ${await response.text()}`);
  }

  const data = await response.json();
  const cnpjs = data.cnpjs || [];
  const total = data.total || cnpjs.length;
  const limit = Math.min(params.limit, 100);

  let companies = cnpjs.map((item: any) =>
    mapCnpjRecord(item, params.uf, params.municipioNome),
  );

  companies = await Promise.all(
    companies.map(async (company: any) => {
      if (company.telefone) return company;
      const detail = await fetchCasaDosDadosDetail(company.cnpj, apiKey);
      if (!detail) return company;
      const contacts = parseCnpjContacts(detail);
      return {
        ...company,
        telefone: contacts.phone,
        email: contacts.email,
        socioPrincipal: contacts.socio || company.socioPrincipal,
        hasPhone: !!contacts.phone,
      };
    }),
  );

  return {
    companies,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    provider: "casadosdados",
    dataSource: "cnpj",
  };
}

async function searchBuscaLead(
  apiKey: string,
  params: {
    cnaes: string[];
    uf: string;
    municipioCodigo: string;
    page: number;
    limit: number;
    contemCelular: boolean;
    contemEmail: boolean;
  },
) {
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
    body: JSON.stringify({ filters, page: params.page, limit: params.limit }),
  });

  if (!response.ok) {
    throw new Error(`BuscaLead: ${response.status} - ${await response.text()}`);
  }

  const data = await response.json();
  const companies = (data.results || []).map((item: any) => {
    const phone = normalizePhone(item.ddd_1, item.telefone_1);
    return {
      cnpj: item.cnpj_completo?.replace(/\D/g, "") || "",
      razaoSocial: item.empresa?.razao_social || item.nome_fantasia || "",
      nomeFantasia: item.nome_fantasia || "",
      telefone: phone,
      email: item.correio_eletronico || null,
      endereco: [item.logradouro, item.numero, item.bairro, item.municipio_ref?.descricao, item.uf]
        .filter(Boolean)
        .join(", "),
      cidade: item.municipio_ref?.descricao || "",
      uf: item.uf || "",
      socioPrincipal: item.empresa?.socios?.[0]?.nome_socio || null,
      cnae: item.cnae_fiscal_principal || null,
      cnaeDescricao: item.cnae_principal_ref?.descricao || null,
      situacao: "ATIVA",
      hasPhone: !!phone,
      dataSource: "cnpj" as const,
    };
  });

  return {
    companies,
    total: data.total || 0,
    totalPages: data.totalPages || 1,
    provider: "buscalead",
    dataSource: "cnpj",
  };
}

async function handleAction(
  env: Record<string, string>,
  headers: Record<string, string | undefined>,
  body: Record<string, unknown>,
) {
  const keys = resolveKeys(env, headers);
  const searchProvider = getSearchProvider(keys);
  const action = body.action as string;

  switch (action) {
    case "get_config":
      return {
        provider: searchProvider,
        dataSource: searchProvider ? "cnpj" : null,
        hasGeckoApi: !!keys.gecko,
        configured: !!searchProvider,
      };
    case "list_estados": {
      const res = await fetch(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
      );
      const data = await res.json();
      return { estados: data.map((e: any) => ({ sigla: e.sigla, nome: e.nome, id: e.id })) };
    }
    case "list_municipios": {
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${body.uf}/municipios?orderBy=nome`,
      );
      const data = await res.json();
      return { municipios: data.map((m: any) => ({ id: String(m.id), nome: m.nome })) };
    }
    case "search": {
      if (!searchProvider) {
        throw new Error(
          "Informe sua chave API de CNPJ (Casa dos Dados ou BuscaLead) no campo acima da busca.",
        );
      }
      const ramo = body.ramo as string;
      const cnaes = RAMO_CNAE_MAP[ramo];
      if (!cnaes) throw new Error("Ramo inválido");

      const page = Number(body.page) || 0;
      const limit = Math.min(Number(body.limit) || 50, 100);
      const params = {
        cnaes,
        uf: body.uf as string,
        municipioNome: body.municipioNome as string,
        municipioCodigo: body.municipioCodigo as string,
        page,
        limit,
        contemCelular: body.contemCelular !== false,
        contemEmail: !!body.contemEmail,
      };

      const result =
        searchProvider === "buscalead"
          ? await searchBuscaLead(keys.buscalead!, params)
          : await searchCasaDosDados(keys.casadosdados!, params);

      return { ...result, page };
    }
    case "fetch_all_pages": {
      if (!searchProvider) {
        throw new Error(
          "Informe sua chave API de CNPJ (Casa dos Dados ou BuscaLead) no campo acima da busca.",
        );
      }
      const ramo = body.ramo as string;
      const cnaes = RAMO_CNAE_MAP[ramo];
      if (!cnaes) throw new Error("Ramo inválido");

      const maxResults = Math.min(Number(body.maxResults) || 500, 500);
      const excludedCnpjs = new Set<string>(
        (body.excludedCnpjs as string[] | undefined) || [],
      );
      const params = {
        cnaes,
        uf: body.uf as string,
        municipioNome: body.municipioNome as string,
        municipioCodigo: body.municipioCodigo as string,
        contemCelular: body.contemCelular !== false,
        contemEmail: !!body.contemEmail,
      };

      const allCompanies: Record<string, unknown>[] = [];
      const seenCnpjs = new Set<string>();
      let page = 0;
      let total = 0;
      const limit = 100;

      while (allCompanies.length < maxResults) {
        const pageParams = { ...params, page, limit };
        const result =
          searchProvider === "buscalead"
            ? await searchBuscaLead(keys.buscalead!, pageParams)
            : await searchCasaDosDados(keys.casadosdados!, pageParams);

        total = result.total;
        if (!result.companies.length) break;

        for (const company of result.companies) {
          if (excludedCnpjs.has(company.cnpj)) continue;
          if (seenCnpjs.has(company.cnpj)) continue;
          seenCnpjs.add(company.cnpj);
          allCompanies.push(company);
          if (allCompanies.length >= maxResults) break;
        }

        page++;
        if (page >= result.totalPages) break;
      }

      return {
        companies: allCompanies,
        total,
        fetched: allCompanies.length,
        truncated: total > allCompanies.length,
        provider: searchProvider,
        dataSource: "cnpj",
      };
    }
    case "enrich_cnpj": {
      const cleanCnpj = String(body.cnpj).replace(/\D/g, "");
      if (keys.casadosdados) {
        const detail = await fetchCasaDosDadosDetail(cleanCnpj, keys.casadosdados);
        if (detail) {
          const contacts = parseCnpjContacts(detail);
          return {
            enrichment: {
              telefone: contacts.phone,
              email: contacts.email,
              socioPrincipal: contacts.socio,
              hasPhone: !!contacts.phone,
              enriched: true,
            },
          };
        }
      }
      if (!keys.gecko) throw new Error("Configure Casa dos Dados ou GeckoAPI para enriquecer");
      const response = await fetch("https://api.geckoapi.com.br/v1/extract", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${keys.gecko}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: `https://casadosdados.com.br/solucao/cnpj/${cleanCnpj}`,
          target: "casadosdados.com.br",
          type: "pdp",
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const payload = await response.json();
      const item = payload.data || payload;
      const contacts = parseCnpjContacts(item);
      return {
        enrichment: {
          telefone: contacts.phone,
          email: contacts.email,
          socioPrincipal: contacts.socio,
          hasPhone: !!contacts.phone,
          enriched: true,
        },
      };
    }
    default:
      throw new Error(`Ação não suportada localmente: ${action}`);
  }
}

export function prospectApiPlugin(): Plugin {
  return {
    name: "prospect-api-dev",
    configureServer(server) {
      const env = {
        ...loadEnv("development", process.cwd(), ""),
        ...loadEnv("development", process.cwd(), "VITE_"),
      };

      server.middlewares.use("/api/prospect-companies", async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader(
          "Access-Control-Allow-Headers",
          "authorization, content-type, x-casa-dos-dados-api-key, x-buscalead-api-key",
        );
        res.setHeader("Content-Type", "application/json");

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        try {
          const body = await readBody(req);
          const headers: Record<string, string | undefined> = {
            "x-casa-dos-dados-api-key": req.headers["x-casa-dos-dados-api-key"] as string,
            "x-buscalead-api-key": req.headers["x-buscalead-api-key"] as string,
          };
          const result = await handleAction(env, headers, body);
          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } catch (error) {
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Erro interno",
            }),
          );
        }
      });
    },
  };
}

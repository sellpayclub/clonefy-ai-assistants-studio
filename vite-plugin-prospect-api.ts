import type { Plugin } from "vite";
import { loadEnv } from "vite";

const RAMO_KEYWORD_MAP: Record<string, string> = {
  estetica: "clinica de estetica",
  salao: "salao de beleza",
  estetica_medica: "clinica estetica medica",
  beleza_completo: "salao de beleza estetica",
};

function normalizeGeckoPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function getProvider(env: Record<string, string>) {
  const configured = env.PROSPECT_API_PROVIDER?.toLowerCase();
  if (configured === "buscalead" && env.BUSCALEAD_API_KEY) return "buscalead";
  if (configured === "casadosdados" && env.CASA_DOS_DADOS_API_KEY) return "casadosdados";
  if (configured === "gecko" && env.GECKOAPI_API_KEY) return "gecko";
  if (env.BUSCALEAD_API_KEY) return "buscalead";
  if (env.CASA_DOS_DADOS_API_KEY) return "casadosdados";
  if (env.GECKOAPI_API_KEY) return "gecko";
  return null;
}

async function readBody(req: import("http").IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function searchGeckoPlaces(
  env: Record<string, string>,
  params: {
    ramo: string;
    uf: string;
    municipioNome: string;
    page: number;
    limit: number;
    contemCelular: boolean;
  },
) {
  const apiKey = env.GECKOAPI_API_KEY!;
  const keyword = RAMO_KEYWORD_MAP[params.ramo] || params.ramo;
  const address = `${params.municipioNome}, ${params.uf}, Brasil`;

  const response = await fetch("https://api.geckoapi.com.br/v1/extract", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target: "google.com", type: "places", keyword, address }),
  });

  if (!response.ok) {
    throw new Error(`GeckoAPI Places: ${response.status} - ${await response.text()}`);
  }

  const payload = await response.json();
  const items = payload.data?.items || [];
  const pageSize = Math.min(params.limit, 50);
  const start = params.page * pageSize;
  const slice = items.slice(start, start + pageSize);

  const companies = slice
    .map((item: any) => {
      const phone = normalizeGeckoPhone(item.phone);
      return {
        cnpj: item.placeId ? `gplace_${item.placeId}` : `gmaps_${item.id}`,
        razaoSocial: item.name || "",
        nomeFantasia: item.name || "",
        telefone: phone,
        email: null,
        endereco: item.address || "",
        cidade: item.city || params.municipioNome,
        uf: params.uf.toUpperCase(),
        socioPrincipal: null,
        cnae: (item.categories || [])[0] || null,
        cnaeDescricao: (item.categories || []).join(", ") || keyword,
        situacao: "ATIVA",
        hasPhone: !!phone,
      };
    })
    .filter((c: any) => !params.contemCelular || c.hasPhone);

  return {
    companies,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    provider: "gecko",
  };
}

async function handleAction(env: Record<string, string>, body: Record<string, unknown>) {
  const action = body.action as string;

  switch (action) {
    case "get_config": {
      const provider = getProvider(env);
      return {
        provider,
        hasGeckoApi: !!env.GECKOAPI_API_KEY,
        configured: !!provider,
      };
    }
    case "list_estados": {
      const res = await fetch(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
      );
      const data = await res.json();
      return {
        estados: data.map((e: any) => ({ sigla: e.sigla, nome: e.nome, id: e.id })),
      };
    }
    case "list_municipios": {
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${body.uf}/municipios?orderBy=nome`,
      );
      const data = await res.json();
      return {
        municipios: data.map((m: any) => ({ id: String(m.id), nome: m.nome })),
      };
    }
    case "search": {
      const provider = getProvider(env);
      if (!provider) {
        throw new Error("Configure GECKOAPI_API_KEY no .env.local");
      }
      if (provider !== "gecko") {
        throw new Error("Modo local suporta apenas GeckoAPI. Use Supabase em produção.");
      }
      const page = Number(body.page) || 0;
      const limit = Math.min(Number(body.limit) || 50, 100);
      const result = await searchGeckoPlaces(env, {
        ramo: body.ramo as string,
        uf: body.uf as string,
        municipioNome: body.municipioNome as string,
        page,
        limit,
        contemCelular: body.contemCelular !== false,
      });
      return { ...result, page };
    }
    case "enrich_cnpj": {
      if (String(body.cnpj).startsWith("gplace_")) {
        return { enrichment: {} };
      }
      const apiKey = env.GECKOAPI_API_KEY;
      if (!apiKey) throw new Error("GECKOAPI_API_KEY não configurada");
      const cleanCnpj = String(body.cnpj).replace(/\D/g, "");
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
      if (!response.ok) throw new Error(await response.text());
      const payload = await response.json();
      const item = payload.data || payload;
      const tel = item.contato_telefonico?.[0];
      const phone = tel
        ? normalizeGeckoPhone(`${tel.ddd || ""}${tel.numero || tel.completo || ""}`)
        : null;
      return {
        enrichment: {
          telefone: phone,
          email: item.contato_email?.[0]?.email || null,
          socioPrincipal: item.quadro_societario?.[0]?.nome || null,
          hasPhone: !!phone,
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
        res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
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
          const result = await handleAction(env, body);
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

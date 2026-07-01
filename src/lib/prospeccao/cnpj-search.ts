import type { ProspectCompany } from './constants';

export const RAMO_CNAE_MAP: Record<string, string[]> = {
  estetica: ['9602502'],
  salao: ['9602501'],
  estetica_medica: ['8630503'],
  beleza_completo: ['9602501', '9602502'],
};

export function normalizePhone(ddd?: string | null, phone?: string | null): string | null {
  if (!phone) return null;
  const digits = `${ddd || ''}${phone}`.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.startsWith('55') ? digits : `55${digits}`;
}

export function buildAddress(parts: {
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
}): string {
  return [parts.logradouro, parts.numero, parts.bairro, parts.municipio, parts.uf, parts.cep]
    .filter(Boolean)
    .join(', ');
}

export function parseCnpjContacts(item: any): {
  phone: string | null;
  email: string | null;
  socio: string | null;
} {
  const telList = item.contato_telefonico || item.contato?.telefones || item.contatos?.telefones || [];
  const emailList = item.contato_email || item.contato?.emails || item.contatos?.emails || [];
  const firstPhone = telList[0];
  const phone = firstPhone
    ? normalizePhone(firstPhone.ddd, firstPhone.numero || firstPhone.completo)
    : null;
  const rawEmail = emailList[0];
  const email = typeof rawEmail === 'string' ? rawEmail : rawEmail?.email || null;
  const socio =
    item.quadro_societario?.[0]?.nome ||
    item.quadro_societario?.[0]?.nome_socio ||
    item.socios?.[0]?.nome_socio ||
    null;
  return { phone, email, socio };
}

export function mapCnpjRecord(item: any, fallbackUf: string, fallbackCity: string): ProspectCompany {
  const { phone, email, socio } = parseCnpjContacts(item);
  const end = item.endereco || {};
  const cnpj = (item.cnpj || item.cnpj_completo || '').replace(/\D/g, '');

  return {
    cnpj,
    razaoSocial: item.razao_social || item.empresa?.razao_social || '',
    nomeFantasia: item.nome_fantasia || '',
    telefone: phone,
    email,
    endereco: buildAddress({
      logradouro: end.logradouro || item.logradouro,
      numero: end.numero || item.numero,
      bairro: end.bairro || item.bairro,
      municipio: end.municipio || item.municipio_ref?.descricao,
      uf: end.uf || item.uf,
      cep: end.cep || item.cep,
    }),
    cidade: end.municipio || item.municipio_ref?.descricao || fallbackCity,
    uf: (end.uf || item.uf || fallbackUf).toUpperCase(),
    socioPrincipal: socio,
    cnae: item.codigo_atividade_principal || item.cnae_fiscal_principal || item.atividade_principal?.codigo || null,
    cnaeDescricao:
      item.descricao_atividade_principal ||
      item.cnae_principal_ref?.descricao ||
      item.atividade_principal?.descricao ||
      null,
    situacao:
      item.situacao_cadastral?.situacao_cadastral ||
      (item.situacao_cadastral === '01' ? 'ATIVA' : item.situacao_cadastral) ||
      'ATIVA',
    hasPhone: !!phone,
    dataSource: 'cnpj',
  };
}

export function getSearchProvider(keys: {
  buscalead?: string | null;
  casadosdados?: string | null;
  preferred?: string | null;
}): 'buscalead' | 'casadosdados' | null {
  const preferred = keys.preferred?.toLowerCase();
  if (preferred === 'buscalead' && keys.buscalead) return 'buscalead';
  if (preferred === 'casadosdados' && keys.casadosdados) return 'casadosdados';
  if (keys.buscalead) return 'buscalead';
  if (keys.casadosdados) return 'casadosdados';
  return null;
}

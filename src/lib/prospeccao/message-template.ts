import type { ProspectCompany } from './constants';

const VARIABLE_MAP: Record<string, (c: ProspectCompany) => string> = {
  nome: c => c.socioPrincipal || c.nomeFantasia || c.razaoSocial || 'Cliente',
  empresa: c => c.nomeFantasia || c.razaoSocial || 'sua empresa',
  cidade: c => c.cidade || '',
  uf: c => c.uf || '',
  socio: c => c.socioPrincipal || '',
  cnpj: c => c.cnpj || '',
};

export const DEFAULT_OUTREACH_TEMPLATE =
  'Olá {nome}! Vi a {empresa} em {cidade} e gostaria de conversar sobre uma parceria. Podemos falar?';

export function renderMessageTemplate(
  template: string,
  company: ProspectCompany,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const resolver = VARIABLE_MAP[key.toLowerCase()];
    return resolver ? resolver(company) : `{${key}}`;
  });
}

export function hasValidPhone(company: ProspectCompany): boolean {
  const digits = (company.telefone || '').replace(/\D/g, '');
  return digits.length >= 11;
}

export function formatWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

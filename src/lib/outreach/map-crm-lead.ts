import type { Lead } from '@/hooks/useCRMLeads';
import type { ProspectCompany } from '@/lib/prospeccao/constants';
import { hasValidPhone } from '@/lib/prospeccao/message-template';

/** Extrai número WhatsApp real, ignorando placeholders do CRM. */
export function cleanLeadPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith('widget_')) return null;

  let digits = raw.replace(/\D/g, '');
  if (raw.startsWith('prospeccao_')) {
    digits = raw.replace(/^prospeccao_/, '').replace(/\D/g, '');
  }

  if (digits.length < 10) return null;
  return digits.startsWith('55') ? digits : `55${digits}`;
}

export function crmLeadToProspectCompany(lead: Lead): ProspectCompany {
  const cf = (lead.custom_fields || {}) as Record<string, string | undefined>;
  const phone = cleanLeadPhone(lead.whatsapp_number);
  const cnpjDigits = lead.cpf_cnpj?.replace(/\D/g, '') || '';

  return {
    cnpj: cnpjDigits.length === 14 ? cnpjDigits : `crm-${lead.id}`,
    razaoSocial: lead.company || lead.name || 'Empresa',
    nomeFantasia: lead.name || lead.company || '',
    telefone: phone,
    email: lead.email,
    endereco: lead.address || '',
    cidade: cf.cidade || '',
    uf: cf.uf || '',
    socioPrincipal: cf.socio_principal || lead.name || '',
    cnae: cf.cnae || null,
    cnaeDescricao: null,
    situacao: 'ATIVA',
    hasPhone: !!phone && phone.replace(/\D/g, '').length >= 11,
  };
}

export function isCrmLeadCallable(lead: Lead): boolean {
  return hasValidPhone(crmLeadToProspectCompany(lead));
}

export function mapCallableCrmLeads(leads: Lead[]): ProspectCompany[] {
  return leads.filter(isCrmLeadCallable).map(crmLeadToProspectCompany);
}

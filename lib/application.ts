import { slugify, type Tenant } from './model';

export type ApplicationBrand = {
  checkoutPriceCents?: number;
  webhook?: string;
  name: string;
  color: string;
  secondaryColor: string;
  domain?: string;
  logo?: string;
};

export function validateApplicationBrand(value: unknown): ApplicationBrand {
  if (!value || typeof value !== 'object')
    throw Error('Informe o nome e a paleta da plataforma.');
  const input = value as Record<string, unknown>;
  if (
    typeof input.name !== 'string' ||
    !input.name.trim() ||
    input.name.trim().length > 100
  )
    throw Error('O nome deve ter entre 1 e 100 caracteres.');
  if (typeof input.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(input.color))
    throw Error('Informe uma cor principal no formato #RRGGBB.');
  const secondaryColor = input.secondaryColor ?? '#ffffff';
  if (
    input.checkoutPriceCents !== undefined &&
    (!Number.isSafeInteger(input.checkoutPriceCents) ||
      Number(input.checkoutPriceCents) <= 0 ||
      Number(input.checkoutPriceCents) > 100000000)
  )
    throw Error('Informe um valor válido para o checkout.');
  if (input.webhook !== undefined) {
    if (typeof input.webhook !== 'string' || input.webhook.length > 2048)
      throw Error('Webhook inválido.');
    if (input.webhook) {
      try {
        const u = new URL(input.webhook);
        if (u.protocol !== 'https:' || u.username || u.password) throw Error();
      } catch {
        throw Error('O webhook deve ser uma URL HTTPS.');
      }
    }
  }
  if (
    typeof secondaryColor !== 'string' ||
    !/^#[0-9a-f]{6}$/i.test(secondaryColor)
  )
    throw Error('Informe uma cor secundária no formato #RRGGBB.');
  return {
    ...(input.checkoutPriceCents !== undefined
      ? { checkoutPriceCents: Number(input.checkoutPriceCents) }
      : {}),
    ...(input.webhook !== undefined
      ? { webhook: String(input.webhook).trim() }
      : {}),
    name: input.name.trim(),
    color: input.color.toLowerCase(),
    secondaryColor: secondaryColor.toLowerCase(),
    ...(input.domain !== undefined
      ? { domain: validatePlatformDomain(input.domain) }
      : {}),
    ...(input.logo !== undefined
      ? { logo: validatePlatformLogo(input.logo) }
      : {}),
  };
}

export function validatePlatformDomain(value: unknown) {
  if (typeof value !== 'string') throw Error('Informe um domínio válido.');
  const domain = value.trim().toLowerCase();
  if (!domain) return '';
  if (
    domain.length > 253 ||
    !domain.includes('.') ||
    !domain
      .split('.')
      .every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
    /^\d+(\.\d+){3}$/.test(domain)
  )
    throw Error(
      'Use apenas o domínio, como plataforma.com.br, sem https ou caminhos.',
    );
  return domain;
}
export function validatePlatformLogo(value: unknown) {
  if (
    typeof value !== 'string' ||
    (value !== '' && !/^\/api\/media\/[a-f0-9-]{36}$/i.test(value))
  )
    throw Error('Envie uma logo válida pelo formulário.');
  return value;
}

export function createApplication(value: unknown, tenants: Tenant[]): Tenant {
  const brand = validateApplicationBrand(value);
  const base = slugify(brand.name) || 'plataforma';
  let slug = base;
  let suffix = 2;
  while (tenants.some((tenant) => tenant.slug === slug))
    slug = `${base.slice(0, 40)}-${suffix++}`;
  return {
    ...brand,
    id: crypto.randomUUID(),
    slug,
    admin: '',
    email: '',
    logo: '',
    favicon: '',
    status: 'active',
    domain: '',
    connections: [],
    allowedBots: [],
    users: [],
    font: 'Inter',
    darkMode: true,
    loginTemplate: 'split',
    created: new Date().toISOString(),
  };
}

export function updateApplication(tenant: Tenant, value: unknown): Tenant {
  return { ...tenant, ...validateApplicationBrand(value) };
}

export function publicBranding(tenant: Tenant) {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    color: tenant.color,
    secondaryColor: tenant.secondaryColor || '#ffffff',
    font: tenant.font || 'Inter',
    logo: tenant.logo || '',
    favicon: tenant.favicon || tenant.logo || '',
    darkMode: tenant.darkMode !== false,
    loginTemplate: 'split',
  };
}

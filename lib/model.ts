import { validateDesign, type CheckoutDesign } from './checkout-design';

export type TenantUserRole = 'admin' | 'operator' | 'finance' | 'support';
export type TenantUserStatus = 'active' | 'invited' | 'suspended';

export type TenantUser = {
  id: string;
  name: string;
  email: string;
  role: TenantUserRole;
  status: TenantUserStatus;
  created: string;
};

export type LoginTemplate =
  | 'split'
  | 'centered'
  | 'hero'
  | 'glassmorphism'
  | 'minimal';

export type Tenant = {
  phone?: string;
  checkoutPriceCents?: number;
  webhook?: string;
  clientCount?: number;
  id: string;
  name: string;
  slug: string;
  admin: string;
  email: string;
  color: string;
  secondaryColor?: string;
  font?: string;
  darkMode?: boolean;
  logo: string;
  favicon?: string;
  loginTemplate?: LoginTemplate;
  status: 'active' | 'suspended';
  domain: string;
  connections: string[];
  allowedBots?: string[];
  created: string;
  users?: TenantUser[];
};

export type Review = { id: string; name: string; text: string; rating: number };
export type Checkout = {
  paymentMethods?: ('pix' | 'boleto' | 'card')[];
  id: string;
  tenantId: string;
  name: string;
  title: string;
  subtitle: string;
  price: number;
  color: string;
  background: string;
  button: string;
  banner: string;
  mobileBanner: string;
  benefits: string;
  metaTitle: string;
  metaDescription: string;
  pixel: string;
  analytics: string;
  upsell: boolean;
  upsellTitle: string;
  upsellPrice: number;
  bump: boolean;
  bumpTitle: string;
  bumpPrice: number;
  reviews: Review[];
  showReviews: boolean;
  notifications: boolean;
  notificationEmail: string;
  published: boolean;
  publishedData?: string;
  updated: string;
  sections: string[];
  design?: CheckoutDesign;
};
export type TradingBotDefinition = {
  id: string;
  name: string;
  category: string;
  protocol: string;
  description: string;
  recommended: boolean;
};

export const availableBots: TradingBotDefinition[] = [
  {
    id: 'mt5-ea',
    name: 'MetaTrader 5 Expert Advisor (EA)',
    category: 'Execução Algorítmica',
    protocol: 'MQL5 Bridge / DLL Socket',
    description:
      'Execução automatizada de ordens via Expert Advisors diretamente nas contas MT5 das corretoras conectadas.',
    recommended: true,
  },
  {
    id: 'tradingview-webhooks',
    name: 'TradingView Webhook Automator',
    category: 'Sinais & Alertas',
    protocol: 'HTTPS REST / JSON Webhooks',
    description:
      'Disparo instantâneo de ordens a partir de alertas de indicadores e estratégias do Pine Script no TradingView.',
    recommended: true,
  },
  {
    id: 'ctrader-open-api',
    name: 'cTrader Open API Bot',
    category: 'API Direta',
    protocol: 'Protobuf / WebSocket FIX',
    description:
      'Conexão de altíssima velocidade para cBot e algoritmos em C# com roteamento direto para cTrader.',
    recommended: false,
  },
  {
    id: 'copy-trading-engine',
    name: 'Engine de Copy Trading Master',
    category: 'Espelhamento de Contas',
    protocol: 'Internal Zero-Latency Sync',
    description:
      'Espelhamento proporcional de operações de uma conta mestre para múltiplas contas de clientes finais.',
    recommended: true,
  },
  {
    id: 'grid-dca-bot',
    name: 'Grid & DCA Automator',
    category: 'Estratégia de Grade',
    protocol: 'REST Engine TradingPro',
    description:
      'Gerenciador de grade de ordens e preço médio (Dollar Cost Averaging) com controle de drawdown.',
    recommended: false,
  },
  {
    id: 'hft-fix-api',
    name: 'HFT / FIX Protocol 4.4',
    category: 'Alta Frequência',
    protocol: 'FIX Protocol / TCP Socket',
    description:
      'Interface institucional dedicada para negociação em microssegundos com acesso direto ao book das corretoras.',
    recommended: false,
  },
];

export type PlatformSettings = {
  tenantPriceCents?: number;
  telegramUrl?: string;
  enabledProviders?: string[];
  supportEmail?: string;
  defaultPlan?: string;
  allowedBots: string[];
  masterDomain: string;
  maintenanceMode: boolean;
  maxUploadBytes: number;
  rateLimitPerMinute: number;
  platformFeePercent: number;
};

export const defaultPlatformSettings: PlatformSettings = {
  allowedBots: [
    'mt5-ea',
    'tradingview-webhooks',
    'copy-trading-engine',
    'grid-dca-bot',
  ],
  masterDomain: '',
  maintenanceMode: false,
  maxUploadBytes: 409600,
  rateLimitPerMinute: 120,
  platformFeePercent: 2.5,
};

export type State = {
  tickets?: SupportTicket[];
  purchaseLinks?: PurchaseLink[];
  demoVersion?: number;
  billing?: BillingRecord[];
  tenants: Tenant[];
  checkouts: Checkout[];
  activity: { id: string; text: string; time: string }[];
  settings?: PlatformSettings;
};
export type PurchaseLink = { id: string; amountCents: number; created: string };
export type SupportTicket = {
  id: string;
  tenantId: string;
  subject: string;
  message: string;
  created: string;
  status: 'open' | 'answered' | 'closed';
  replies: {
    id: string;
    message: string;
    created: string;
    emailStatus: 'pending' | 'sent' | 'failed';
  }[];
};
export type BillingRecord = {
  id: string;
  tenantId: string;
  plan: string;
  amountCents: number;
  due: string;
  status: 'pending' | 'paid' | 'canceled';
};
export type Session = {
  role: 'admin' | 'tenant';
  tenantId?: string;
  email: string;
  revision: number;
  state: State;
};
export const providers = ['XGlobal', 'Bybit', 'Admiral', 'XR'];
function requireStrings(value: unknown, keys: string[]) {
  if (!value || typeof value !== 'object') throw Error('Formulário inválido.');
  for (const key of keys) {
    const item = (value as Record<string, unknown>)[key];
    if (typeof item !== 'string' || item.length > 5000)
      throw Error(`Campo inválido: ${key}`);
  }
}
export const money = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    n,
  );
export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
export function newCheckout(tenant: Tenant): Checkout {
  return {
    id: crypto.randomUUID(),
    tenantId: tenant.id,
    name: 'Plano Pro',
    title: 'Dê o próximo passo nas suas operações',
    subtitle: 'Tecnologia e controle para a sua jornada no mercado.',
    price: 197,
    color: tenant.color,
    background: '#ffffff',
    button: 'Continuar para pagamento',
    banner: '',
    mobileBanner: '',
    benefits: 'Acesso à plataforma\nConexões habilitadas\nSuporte da operação',
    metaTitle: `Plano Pro | ${tenant.name}`,
    metaDescription: '',
    pixel: '',
    analytics: '',
    upsell: false,
    upsellTitle: 'Mentoria individual',
    upsellPrice: 97,
    bump: false,
    bumpTitle: 'Material complementar',
    bumpPrice: 29,
    showReviews: false,
    reviews: [],
    notifications: false,
    notificationEmail: tenant.email,
    published: false,
    updated: new Date().toISOString(),
    sections: ['benefits', 'reviews', 'bump'],
  };
}
export function mockCheckouts(tenant: Tenant): Checkout[] {
  const base1 = newCheckout(tenant);
  base1.name = 'Robô Scalper MT5 - Licença Anual';
  base1.title = 'Automatize suas operações com precisão institucional';
  base1.subtitle =
    'Execução algorítmica de alta frequência com gestão de risco integrada.';
  base1.price = 497;
  base1.published = true;
  base1.benefits =
    'Execução automática 24/5 sem delay\nSetup de stop móvel e breakeven\nConexão direta com Bybit e Admiral\nAtualizações e suporte VIP vitalício';
  base1.bump = true;
  base1.bumpTitle = 'Planilha de Gestão Avançada de Lote';
  base1.bumpPrice = 47;
  const snap1 = { ...base1 };
  base1.publishedData = JSON.stringify(snap1);

  const base2 = newCheckout(tenant);
  base2.id = crypto.randomUUID();
  base2.name = 'Mentoria VIP + Sala ao Vivo';
  base2.title = 'Opere lado a lado com especialistas todos os dias';
  base2.subtitle =
    'Acompanhamento diário no pregão ao vivo com análise de contexto e fluxo.';
  base2.price = 997;
  base2.published = true;
  base2.benefits =
    'Acesso diário à sala de operações ao vivo\nAnálise de macroeconomia e fluxo matinal\nGrupo fechado no Discord com traders seniores\nFeedback semanal individual das suas ordens';
  base2.bump = true;
  base2.bumpTitle = 'Guia de Psicologia e Disciplina no Trading';
  base2.bumpPrice = 37;
  const snap2 = { ...base2 };
  base2.publishedData = JSON.stringify(snap2);

  const base3 = newCheckout(tenant);
  base3.id = crypto.randomUUID();
  base3.name = 'Indicador Smart Flow Pro';
  base3.title = 'Identifique a absorção institucional antes do movimento';
  base3.subtitle =
    'Indicador técnico proprietário com coloração automática de candles.';
  base3.price = 197;
  base3.published = false;
  base3.benefits =
    'Coloração de candles por volume institucional\nAlertas sonoros e notificações no Telegram\nCompatível com MT5 e TradingView';

  return [base1, base2, base3];
}

export function mockActivities(): { id: string; text: string; time: string }[] {
  const now = Date.now();
  return [
    {
      id: crypto.randomUUID(),
      text: 'Checkout "Robô Scalper MT5 - Licença Anual" publicado online com sucesso',
      time: new Date(now - 1000 * 60 * 15).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      text: 'Apontamento CNAME verificado com sucesso para cname.whitelabel.local',
      time: new Date(now - 1000 * 60 * 65).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      text: 'Snapshot automático diário gerado e verificado (SHA-256 válido)',
      time: new Date(now - 1000 * 60 * 180).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      text: 'Conexão com corretora Bybit liberada para a operação',
      time: new Date(now - 1000 * 60 * 360).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      text: 'Checkout "Mentoria VIP + Sala ao Vivo" configurado e publicado',
      time: new Date(now - 1000 * 60 * 720).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      text: 'Identidade visual e logotipo da marca atualizados',
      time: new Date(now - 1000 * 60 * 1440).toISOString(),
    },
  ];
}

export function initialState(email: string): State {
  const t: Tenant = {
    id: crypto.randomUUID(),
    name: 'GoTrade',
    slug: 'gotrade',
    admin: 'Administrador',
    email,
    color: '#4fbb83',
    logo: '',
    status: 'active',
    domain: '',
    connections: ['Bybit', 'Admiral', 'XGlobal'],
    created: new Date().toISOString(),
    users: [
      {
        id: crypto.randomUUID(),
        name: 'Administrador',
        email,
        role: 'admin',
        status: 'active',
        created: new Date().toISOString(),
      },
    ],
  };
  return {
    tenants: [t],
    checkouts: mockCheckouts(t),
    activity: mockActivities(),
    settings: defaultPlatformSettings,
  };
}
export function getTenantUsers(tenant: Tenant): TenantUser[] {
  if (tenant.users && tenant.users.length > 0) {
    return tenant.users;
  }
  if (!tenant.email) return [];
  return [
    {
      id: `${tenant.id}-primary`,
      name: tenant.admin || 'Administrador',
      email: tenant.email,
      role: 'admin',
      status: 'active',
      created: tenant.created || new Date().toISOString(),
    },
  ];
}
export function validImage(url: string) {
  return (
    typeof url === 'string' &&
    (!url ||
      /^https:\/\//i.test(url) ||
      /^\/api\/media\/[a-f0-9-]{36}$/.test(url))
  );
}
export function validateTenant(t: Tenant) {
  if (
    t.phone !== undefined &&
    (typeof t.phone !== 'string' ||
      t.phone.length > 25 ||
      !/^[+0-9(). -]+$/.test(t.phone) ||
      !/^\d{10,15}$/.test(t.phone.replace(/\D/g, '')))
  )
    throw Error('Informe um telefone válido.');
  requireStrings(t, [
    'id',
    'name',
    'slug',
    'admin',
    'email',
    'color',
    'logo',
    'domain',
  ]);
  if (!/^[a-f0-9-]{36}$/.test(t.id) || !!t.email !== !!t.admin.trim())
    throw Error('Administrador ou identificação inválida.');
  if (
    !t ||
    !t.name?.trim() ||
    t.name.length > 100 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t.slug) ||
    (t.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email)) ||
    !/^#[0-9a-f]{6}$/i.test(t.color) ||
    (t.secondaryColor !== undefined &&
      !/^#[0-9a-f]{6}$/i.test(t.secondaryColor)) ||
    !validImage(t.logo) ||
    (t.favicon && !validImage(t.favicon)) ||
    !['active', 'suspended'].includes(t.status) ||
    !Array.isArray(t.connections) ||
    t.connections.some((p) => !providers.includes(p))
  )
    throw Error('Revise nome, slug, e-mail e identidade da operação.');
  if (
    t.domain &&
    !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(t.domain)
  )
    throw Error('Informe um domínio válido, sem https://.');
}
export function validateCheckout(c: Checkout) {
  if (
    c.paymentMethods !== undefined &&
    (!Array.isArray(c.paymentMethods) ||
      !c.paymentMethods.length ||
      c.paymentMethods.length > 3 ||
      new Set(c.paymentMethods).size !== c.paymentMethods.length ||
      c.paymentMethods.some((m) => !['pix', 'boleto', 'card'].includes(m)))
  )
    throw Error('Selecione pelo menos uma forma de pagamento válida.');
  if (c?.design) validateDesign(c.design);
  requireStrings(c, [
    'id',
    'tenantId',
    'name',
    'title',
    'subtitle',
    'color',
    'background',
    'button',
    'banner',
    'mobileBanner',
    'benefits',
    'metaTitle',
    'metaDescription',
    'pixel',
    'analytics',
    'upsellTitle',
    'bumpTitle',
    'notificationEmail',
  ]);
  if (
    !/^[a-f0-9-]{36}$/.test(c.id) ||
    !/^[a-f0-9-]{36}$/.test(c.tenantId) ||
    !c.button.trim()
  )
    throw Error('Identificação ou botão inválido.');
  for (const k of ['upsell', 'bump', 'showReviews', 'notifications'] as const)
    if (typeof c[k] !== 'boolean') throw Error('Configuração inválida.');
  if (
    !c ||
    !c.name?.trim() ||
    !c.title?.trim() ||
    !Number.isFinite(c.price) ||
    c.price <= 0 ||
    c.price > 1000000 ||
    !/^#[0-9a-f]{6}$/i.test(c.color) ||
    !/^#[0-9a-f]{6}$/i.test(c.background) ||
    !validImage(c.banner) ||
    !validImage(c.mobileBanner)
  )
    throw Error('Revise título, preço e imagens do checkout.');
  if (c.pixel && !/^\d{5,30}$/.test(c.pixel))
    throw Error('O Meta Pixel deve conter apenas números (5 a 30 dígitos).');
  if (c.analytics && !/^G-[A-Z0-9]+$/.test(c.analytics))
    throw Error('Informe um ID GA4 no formato G-XXXXXXXX.');
  if (
    !Array.isArray(c.reviews) ||
    c.reviews.length > 20 ||
    c.reviews.some(
      (r) =>
        !r.name?.trim() ||
        !r.text?.trim() ||
        !Number.isInteger(r.rating) ||
        r.rating < 1 ||
        r.rating > 5,
    )
  )
    throw Error('Revise as avaliações.');
  for (const k of ['upsellPrice', 'bumpPrice'] as const)
    if (!Number.isFinite(c[k]) || c[k] < 0)
      throw Error('Preço adicional inválido.');
  if (
    c.notifications &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.notificationEmail)
  )
    throw Error('Informe o e-mail das notificações.');
  if (
    !Array.isArray(c.sections) ||
    c.sections.length !== 3 ||
    new Set(c.sections).size !== 3 ||
    c.sections.some((s) => !['benefits', 'reviews', 'bump'].includes(s))
  )
    throw Error('Ordem de blocos inválida.');
}


import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from '@playwright/test';
import { createApplication } from '../../lib/application';
import type { Session, Tenant } from '../../lib/model';
const origin = 'http://127.0.0.1:5174';
async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill('admin@example.test');
  await page
    .getByLabel('Senha', { exact: true })
    .fill(process.env.TEST_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Tenants', exact: true }),
  ).toBeVisible();
}
async function state(api: APIRequestContext): Promise<Session> {
  const response = await api.get('/api/workspace');
  expect(response.status()).toBe(200);
  return response.json();
}
async function save(
  api: APIRequestContext,
  session: Session,
  action: string,
  value: unknown,
) {
  return api.post('/api/workspace', {
    headers: { origin },
    data: { action, value, revision: session.revision },
  });
}
async function seedTenant(
  api: APIRequestContext,
  name: string,
): Promise<Tenant> {
  const session = await state(api);
  const tenant = {
    ...createApplication(
      { name, color: '#6366f1', secondaryColor: '#22d3ee' },
      session.state.tenants,
    ),
    admin: 'Ana',
    email: `${crypto.randomUUID()}@example.test`,
    connections: ['Bybit'],
  };
  expect((await save(api, session, 'tenant', tenant)).status()).toBe(200);
  return tenant;
}

test('tenant navigation, invitation, integrations and authorized branding updates', async ({
  page,
  browser,
}) => {
  await login(page);
  const tenant = await seedTenant(page.request, 'Tenant Permissões');
  const other = await seedTenant(page.request, 'Outra Plataforma');
  const response = await page.request.post('/api/auth/invite', {
    headers: { origin },
    data: { tenantId: tenant.id },
  });
  expect(response.status()).toBe(200);
  const invitation = await response.json();
  const context = await browser.newContext({ baseURL: origin });
  const tenantPage = await context.newPage();
  await tenantPage.goto(invitation.url);
  await tenantPage
    .getByLabel('Crie uma senha', { exact: true })
    .fill('Tenant-Password-Test-2026');
  await tenantPage.getByRole('button', { name: 'Ativar conta' }).click();
  await expect(
    tenantPage.getByRole('heading', { name: 'Plataforma', exact: true }),
  ).toBeVisible();
  const nav = tenantPage.getByRole('navigation', { name: 'Menu principal' });
  await expect(nav.getByRole('link')).toHaveCount(4);
  await expect(
    nav.getByRole('link', { name: 'Conexões', exact: true }),
  ).toBeVisible();
  await expect(
    nav.getByRole('link', { name: 'Plataforma', exact: true }),
  ).toBeVisible();
  await expect(
    nav.getByRole('link', { name: 'Configurações', exact: true }),
  ).toBeVisible();
  await expect(
    tenantPage.getByRole('button', { name: 'Novo tenant' }),
  ).toHaveCount(0);
  await nav.getByRole('link', { name: 'Conexões', exact: true }).click();
  await expect(
    tenantPage.getByRole('heading', { name: 'Bybit', exact: true }),
  ).toBeVisible();
  await tenantPage.evaluate(() => {
    (window as unknown as { navigationMarker: string }).navigationMarker =
      'persistent';
  });
  await nav.getByRole('link', { name: 'Plataforma', exact: true }).click();
  expect(
    await tenantPage.evaluate(
      () =>
        (window as unknown as { navigationMarker: string }).navigationMarker,
    ),
  ).toBe('persistent');
  await expect(
    tenantPage.locator('.demo-switcher,.gt-account,.gt-role'),
  ).toHaveCount(0);
  await tenantPage
    .getByLabel('Nome da plataforma', { exact: true })
    .fill('Minha Marca');
  await tenantPage.getByLabel('Cor principal', { exact: true }).fill('#e53935');
  await tenantPage.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(
    tenantPage.getByRole('status').filter({ hasText: 'Alterações salvas.' }),
  ).toBeVisible();
  await tenantPage.reload();
  await expect(
    tenantPage.getByLabel('Nome da plataforma', { exact: true }),
  ).toHaveValue('Minha Marca');
  await tenantPage.setViewportSize({ width: 390, height: 844 });
  expect(
    await tenantPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await tenantPage.screenshot({
    path: 'outputs/gotrade-tenant-mobile.png',
    fullPage: true,
  });
  const session = await state(context.request);
  expect(session.state.activity).toEqual([]);
  expect(
    (await context.request.get('/api/backup?action=download')).status(),
  ).toBe(410);
  expect(
    (
      await save(context.request, session, 'tenant', session.state.tenants[0])
    ).status(),
  ).toBe(403);
  expect(session.state.tenants).toHaveLength(1);
  expect(
    (
      await save(context.request, session, 'applicationBranding', {
        id: other.id,
        name: 'Intrusão',
        color: '#123456',
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await save(context.request, session, 'tenant', {
        ...other,
        id: crypto.randomUUID(),
      })
    ).status(),
  ).toBe(403);
  const result = await save(context.request, session, 'applicationBranding', {
    id: tenant.id,
    name: 'Minha Marca',
    color: '#e53935',
    connections: ['XR'],
    email: 'other@example.test',
  });
  expect(result.status()).toBe(200);
  const updated = (await result.json()).state.tenants[0];
  expect(updated.connections).toEqual(['Bybit']);
  expect(updated.email).toBe(tenant.email);
  expect(
    (
      await save(context.request, session, 'applicationBranding', {
        id: tenant.id,
        name: 'Stale',
        color: '#123456',
      })
    ).status(),
  ).toBe(409);
  await nav.getByRole('link', { name: 'Configurações', exact: true }).click();
  await expect(
    tenantPage.getByRole('heading', { name: 'Minha conta', exact: true }),
  ).toBeVisible();
  await tenantPage
    .getByLabel('Nova senha', { exact: true })
    .fill('Tenant-New-Password-2026');
  await tenantPage
    .getByLabel('Confirmar nova senha', { exact: true })
    .fill('Tenant-New-Password-2026');
  await tenantPage
    .getByRole('button', { name: 'Salvar alterações', exact: true })
    .click();
  await expect(
    tenantPage.getByRole('status').filter({ hasText: 'Dados atualizados.' }),
  ).toBeVisible();
  await tenantPage.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(tenantPage).toHaveURL(/\/login/);
  await tenantPage.getByLabel('E-mail', { exact: true }).fill(tenant.email);
  await tenantPage
    .getByLabel('Senha', { exact: true })
    .fill('Tenant-New-Password-2026');
  await tenantPage.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    tenantPage.getByRole('heading', { name: 'Plataforma', exact: true }),
  ).toBeVisible();
  const nextEmail = crypto.randomUUID() + '@example.test';
  const duplicate = await context.request.post('/api/auth/profile', {
    headers: { origin },
    data: { email: 'admin@example.test' },
  });
  expect(duplicate.status()).toBe(409);
  const changed = await context.request.post('/api/auth/profile', {
    headers: { origin },
    data: { email: nextEmail },
  });
  expect(changed.status()).toBe(200);
  const changedSession = await state(context.request);
  expect(changedSession.email).toBe(nextEmail);
  expect(changedSession.state.tenants[0].email).toBe(nextEmail);
  expect(changedSession.state.tenants).toHaveLength(1);
  await tenantPage.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(tenantPage).toHaveURL(/\/login/);
  await tenantPage.getByLabel('E-mail', { exact: true }).fill(nextEmail);
  await tenantPage
    .getByLabel('Senha', { exact: true })
    .fill('Tenant-New-Password-2026');
  await tenantPage.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    tenantPage.getByRole('heading', { name: 'Plataforma', exact: true }),
  ).toBeVisible();
  await context.close();
});

test('public platforms load persisted palettes, isolate tabs and reject invalid or suspended identities', async ({
  page,
  browser,
}) => {
  await login(page);
  const first = await seedTenant(page.request, 'Marca Azul');
  const second = await seedTenant(page.request, 'Marca Verde');
  let session = await state(page.request);
  expect(
    (
      await save(page.request, session, 'applicationBranding', {
        id: second.id,
        name: second.name,
        color: '#96d600',
        secondaryColor: '#ffffff',
      })
    ).status(),
  ).toBe(200);
  const context = await browser.newContext({ baseURL: origin });
  const a = await context.newPage();
  const b = await context.newPage();
  const errors: string[] = [];
  a.on('pageerror', (e) => errors.push(e.message));
  b.on('pageerror', (e) => errors.push(e.message));
  await a.goto(`/prototipo?tenant=${first.id}`);
  await b.goto(`/prototipo?tenant=${second.id}`);
  await expect(a).toHaveTitle(new RegExp(first.name));
  await expect(b).toHaveTitle(new RegExp(second.name));
  await expect(
    a.locator('.tp-auth-brand').getByText(first.name, { exact: true }).first(),
  ).toBeVisible();
  expect(
    await a.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--brand-primary')
        .trim(),
    ),
  ).toBe('#6366f1');
  expect(
    await b.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--brand-primary')
        .trim(),
    ),
  ).toBe('#96d600');
  session = await state(page.request);
  expect(
    (
      await save(page.request, session, 'applicationBranding', {
        id: first.id,
        name: 'Marca Roxa',
        color: '#a855f7',
      })
    ).status(),
  ).toBe(200);
  await a.reload();
  await expect(a).toHaveTitle(/Marca Roxa/);
  await b.reload();
  await expect(b).toHaveTitle(new RegExp(second.name));
  await a.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(a).toHaveURL(new RegExp(`tenant=${first.id}`));
  await a.reload();
  await expect(a).toHaveTitle(/Marca Roxa/);
  const publicBrand = await context.request.get(
    `/api/branding?tenant=${first.id}`,
  );
  expect(publicBrand.status()).toBe(200);
  expect((await publicBrand.json()).email).toBeUndefined();
  expect(
    (
      await context.request.get(`/api/branding?tenant=${crypto.randomUUID()}`)
    ).status(),
  ).toBe(404);
  expect((await context.request.get('/api/auth/quick-login')).status()).toBe(
    404,
  );
  expect(
    (await context.request.get(`/checkout/${crypto.randomUUID()}`)).status(),
  ).toBe(404);
  session = await state(page.request);
  const current = session.state.tenants.find((t) => t.id === first.id)!;
  expect(
    (
      await save(page.request, session, 'tenant', {
        ...current,
        status: 'suspended',
      })
    ).status(),
  ).toBe(200);
  expect(
    (await context.request.get(`/api/branding?tenant=${first.id}`)).status(),
  ).toBe(403);
  await a.reload();
  await expect(a.getByRole('alert')).toContainText('suspensa');
  expect(errors).toEqual([]);
  await context.close();
});

test('Rotas diretas e fallbacks preservam o destino e o status', async ({
  request,
}) => {
  const id = crypto.randomUUID();
  const direct = await request.get('/prototipo/app/history?tenant=' + id);
  expect(direct.status()).toBe(200);
  expect(direct.headers()['content-type']).toContain('text/html');
  const legacy = await request.get('/app/history?tenant=' + id, {
    maxRedirects: 0,
  });
  expect(legacy.status()).toBe(307);
  expect(legacy.headers().location).toContain(
    '/prototipo/app/history?tenant=' + id,
  );
  const missing = await request.get('/prototipo/assets/missing.js');
  expect(missing.status()).toBe(404);
  expect(missing.headers()['content-type'] || '').not.toContain('text/html');
  const unknown = await request.get('/pagina-inexistente');
  expect(unknown.status()).toBe(404);
  expect(await unknown.text()).toContain('Página não encontrada');
});

test('tenant modal shows overview, access and connection permissions', async ({
  page,
}) => {
  await login(page);
  const t = await seedTenant(page.request, 'Modal 360');
  const s = await state(page.request);
  expect(
    (
      await save(page.request, s, 'billing', {
        id: crypto.randomUUID(),
        tenantId: t.id,
        plan: 'Licença',
        amountCents: 300000,
        due: '2026-10-01',
        status: 'paid',
      })
    ).status(),
  ).toBe(200);
  await page.reload();
  await page.getByLabel('Buscar tenants').fill(t.name);
  await page.getByRole('button', { name: `Opções de ${t.name}` }).click();
  const d = page.getByRole('dialog');
  await expect(d).toContainText(t.email);
  await expect(page.locator('.gt-admin-overview button')).toHaveCount(0);
  await expect(page.getByText('Gerenciar acesso', { exact: true })).toHaveCount(
    0,
  );
  await expect(
    d.getByRole('button', { name: 'Pagamentos', exact: true }),
  ).toHaveCount(0);
  await d.getByRole('button', { name: 'Acesso e conexões' }).click();
  await d.getByLabel('Adicionar conexão').selectOption('XGlobal');
  await expect(d.locator('.gt-connection-box')).toContainText('XGlobal');
  await d.getByLabel('Status do tenant').selectOption('suspended');
  await d.getByRole('button', { name: 'Salvar tenant' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Alterações salvas' }),
  ).toBeVisible();
  expect(
    (await page.request.get(`/api/branding?tenant=${t.id}`)).status(),
  ).toBe(403);
  await d.getByLabel('Status do tenant').selectOption('active');
  await d.getByRole('button', { name: 'Salvar tenant' }).click();
  await expect
    .poll(async () =>
      (await page.request.get(`/api/branding?tenant=${t.id}`)).status(),
    )
    .toBe(200);
  expect(
    (await state(page.request)).state.tenants.find((x) => x.id === t.id)
      ?.connections,
  ).toContain('XGlobal');
  await page.screenshot({
    path: 'outputs/gotrade-modal-360.png',
    fullPage: true,
  });
  await d.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/tenants$/);
});

test('settings and new tenant form persist; legacy checkout price stays protected', async ({
  page,
  browser,
}) => {
  await login(page);
  await page
    .getByRole('button', { name: 'Configurações', exact: true })
    .click();
  await expect(page.getByLabel('Plano sugerido')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Minha conta' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Configuração de conexões' }),
  ).toHaveCount(0);
  await expect(page.getByLabel('Valor para ser tenant (R$)')).toHaveCount(0);
  const prefs = await state(page.request);
  expect(
    (
      await save(page.request, prefs, 'settings', {
        ...prefs.state.settings,
        enabledProviders: ['XGlobal', 'Bybit', 'Admiral'],
        supportEmail: '',
        telegramUrl: '',
        tenantPriceCents: 399990,
      })
    ).status(),
  ).toBe(200);
  await page.reload();
  await page.getByRole('button', { name: 'Tenants', exact: true }).click();
  await page.getByRole('button', { name: 'Novo tenant', exact: true }).click();
  const modal = page.getByRole('dialog');
  const email = crypto.randomUUID() + '@example.test';
  await expect(
    modal.getByRole('button', { name: 'Gerar link de contratação' }),
  ).toHaveCount(0);
  await modal.getByLabel('Nome', { exact: true }).fill('Camila Teste');
  await modal.getByLabel('E-mail', { exact: true }).fill(email);
  await modal.getByLabel('Telefone', { exact: true }).fill('(11) 99999-9999');
  await modal
    .getByLabel('Nome da plataforma', { exact: true })
    .fill('Camila Trade');
  await modal
    .getByRole('button', { name: 'Criar tenant', exact: true })
    .click();
  await expect(modal).toHaveCount(0);
  await page.reload();
  const created = (await state(page.request)).state.tenants.find(
    (t) => t.email === email,
  )!;
  expect(created.name).toBe('Camila Trade');
  expect(created.admin).toBe('Camila Teste');
  expect(created.phone).toBe('(11) 99999-9999');
  await page.getByRole('button', { name: 'Opções de Camila Trade' }).click();
  await expect(modal).toContainText('(11) 99999-9999');
  await modal.getByRole('button', { name: 'Close' }).click();
  const current = await state(page.request);
  expect(
    (
      await save(page.request, current, 'tenant', {
        ...created,
        phone: 'inválido',
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await save(page.request, current, 'tenant', {
        ...created,
        id: crypto.randomUUID(),
        slug: 'outro-tenant',
      })
    ).status(),
  ).toBe(400);
  const legacy = await save(page.request, current, 'purchaseLink', {});
  expect(legacy.status()).toBe(200);
  const link = (await legacy.json()).state.purchaseLinks[0];
  const url = origin + '/contratar/' + link.id;
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await buyer.goto(url + '?valor=1');
  await expect(
    buyer.getByRole('heading', { name: 'Sua plataforma começa aqui' }),
  ).toBeVisible();
  await expect(buyer.locator('.gt-order-total')).toContainText('3.999,90');
  await buyer.getByLabel('Nome completo').fill('Camila Teste');
  await buyer.getByLabel('E-mail', { exact: true }).fill('camila@example.test');
  await buyer.getByLabel('Nome da plataforma').fill('Camila Trade');
  await buyer.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(
    buyer.getByRole('heading', { name: 'Revise sua contratação' }),
  ).toBeVisible();
  await expect(buyer.locator('dl')).toContainText('Camila Trade');
  await buyer.screenshot({
    path: 'outputs/gotrade-contratacao.png',
    fullPage: true,
  });
  expect(
    (
      await ctx.request.get(
        origin + '/contratar/' + crypto.randomUUID() + '?valor=300000',
      )
    ).status(),
  ).toBe(404);
  await ctx.close();
});

test('tenant finance is isolated, read-only and navigates without reloading', async ({
  page,
  browser,
}) => {
  await login(page);
  const t = await seedTenant(page.request, 'Financeiro Tenant');
  const other = await seedTenant(page.request, 'Financeiro Outro');
  for (const [tenantId, plan, amountCents, status] of [
    [t.id, 'Minha licença', 14990, 'paid'],
    [t.id, 'Minha pendência', 9900, 'pending'],
    [other.id, 'Cobrança privada', 89000, 'paid'],
  ] as const) {
    expect(
      (
        await save(page.request, await state(page.request), 'billing', {
          id: crypto.randomUUID(),
          tenantId,
          plan,
          amountCents,
          due: '2099-12-01',
          status,
        })
      ).status(),
    ).toBe(200);
  }
  await page.reload();
  const adminNav = page.getByRole('navigation', { name: 'Menu principal' });
  await expect(adminNav.getByRole('button')).toHaveCount(2);
  await expect(adminNav.getByText(/Suporte|Pagamentos|Financeiro/)).toHaveCount(
    0,
  );
  await page.goto('/tenants?section=payments');
  await expect(
    page.getByRole('heading', { name: 'Tenants', exact: true }),
  ).toBeVisible();
  const invite = await page.request.post('/api/auth/invite', {
    headers: { origin },
    data: { tenantId: t.id },
  });
  const ctx = await browser.newContext({ baseURL: origin });
  const p = await ctx.newPage();
  await p.goto((await invite.json()).url);
  await p.getByLabel('Crie uma senha').fill('Tenant-Password-2026');
  await p.getByRole('button', { name: 'Ativar conta' }).click();
  await expect(
    p.getByRole('heading', { name: 'Plataforma', exact: true }),
  ).toBeVisible();
  await expect(p.locator('.gt-static-preview img')).toBeVisible();
  await expect(p.locator('.gt-live-preview iframe')).toHaveCount(0);
  await p.evaluate(() => {
    (window as unknown as { marker: string }).marker = 'same-document';
  });
  const nav = p.getByRole('navigation', { name: 'Menu principal' });
  await expect(nav.getByRole('link', { name: 'Suporte' })).toHaveCount(0);
  await nav.getByRole('link', { name: 'Financeiro' }).click();
  expect(
    await p.evaluate(() => (window as unknown as { marker: string }).marker),
  ).toBe('same-document');
  await expect(p.locator('.gt-loading')).toHaveCount(0);
  await expect(p.locator('tbody')).toContainText('Minha licença');
  await expect(p.locator('tbody')).not.toContainText('Cobrança privada');
  await expect(p.locator('.gt-admin-overview')).toContainText('149,90');
  await p.getByLabel('Filtrar pagamentos').selectOption('pending');
  await expect(p.locator('tbody tr')).toHaveCount(1);
  await expect(p.locator('tbody')).toContainText('Minha pendência');
  await p.reload();
  await expect(
    p.getByRole('heading', { name: 'Financeiro', exact: true }),
  ).toBeVisible();
  const session = await state(ctx.request);
  expect(session.state.billing?.length).toBe(2);
  expect(session.state.billing?.every((r) => r.tenantId === t.id)).toBe(true);
  expect(
    (
      await save(ctx.request, session, 'billing', {
        ...session.state.billing![0],
        status: 'canceled',
      })
    ).status(),
  ).toBe(403);
  await p.getByRole('link', { name: 'Configurações', exact: true }).click();
  await expect(p.getByRole('heading', { name: 'Minha conta' })).toBeVisible();
  await expect(p.locator('.gt-account-settings')).toHaveCount(1);
  await p.goto('/support');
  await expect(
    p.getByRole('heading', { name: 'Plataforma', exact: true }),
  ).toBeVisible();
  await p.goto('/finance');
  await p.screenshot({
    path: 'outputs/gotrade-tenant-finance.png',
    fullPage: true,
  });
  await ctx.close();
});

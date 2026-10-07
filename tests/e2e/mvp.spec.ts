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

test('admin manages tenants, edits platform identity and reloads saved data', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await expect(
    page.getByText('TradingPro White Label', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText('Central de gerenciamento', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Checkouts', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Novo tenant', exact: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome da operação').fill('Alpha Visual');
  await dialog.getByLabel('Nome do responsável').fill('Ana');
  await dialog
    .getByLabel('E-mail do responsável')
    .fill(`${crypto.randomUUID()}@example.test`);
  await dialog.getByRole('button', { name: 'Criar tenant' }).click();
  await expect(
    page.getByRole('heading', { name: 'Plataforma', exact: true }),
  ).toBeVisible();
  await page
    .getByLabel('Nome da plataforma', { exact: true })
    .fill('Alpha Atualizada');
  await page.getByLabel('Cor principal', { exact: true }).fill('#6366f1');
  const preview = page.frameLocator('iframe[title="Prévia do protótipo"]');
  await expect(preview.locator('canvas').first()).toBeVisible();
  await expect(
    preview.getByText('Alpha Atualizada', { exact: true }).first(),
  ).toBeVisible();
  await expect
    .poll(async () =>
      preview
        .locator('html')
        .evaluate((element) =>
          getComputedStyle(element).getPropertyValue('--brand-primary').trim(),
        ),
    )
    .toBe('#6366f1');
  await expect(preview.locator('[data-tour="bot-start"]')).toHaveCSS(
    'background-color',
    'rgb(74, 222, 128)',
  );
  await expect(
    preview.getByText(/^(COMPRA|BUY)$/, { exact: true }).first(),
  ).toHaveCSS('color', 'rgb(74, 222, 128)');
  await expect(
    preview.getByText('WIN (+$20.00)', { exact: true }).first(),
  ).toHaveCSS('color', 'rgb(74, 222, 128)');
  expect(
    (await state(page.request)).state.tenants.some(
      (t) => t.name === 'Alpha Visual',
    ),
  ).toBe(true);
  await expect(page.locator('.gt-eyebrow')).toHaveCount(0);
  await expect(page.locator('.gt-footer')).toHaveCount(0);
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Alterações salvas.' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'outputs/gotrade-admin-platform.png',
    fullPage: true,
  });
  const stored = await state(page.request);
  const tenant = stored.state.tenants.find(
    (t) => t.name === 'Alpha Atualizada',
  )!;
  expect(tenant.color).toBe('#6366f1');
  expect(tenant.secondaryColor).toBe('#ffffff');
  expect(stored.state.checkouts).toEqual([]);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Plataforma', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Nome da plataforma', { exact: true }),
  ).toHaveValue('Alpha Atualizada');
  await page.getByRole('button', { name: 'Todos os tenants' }).click();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Alpha Atualizada', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: 'outputs/gotrade-admin-tenants.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/platform');
  await expect(page).toHaveURL(/\/login/);
  expect(errors).toEqual([]);
});

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
    tenantPage.getByRole('heading', { name: 'Conexões', exact: true }),
  ).toBeVisible();
  const nav = tenantPage.getByRole('navigation', { name: 'Menu principal' });
  await expect(nav.getByRole('link')).toHaveCount(3);
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
  await tenantPage
    .getByRole('button', { name: 'Sair da conta', exact: true })
    .click();
  await expect(tenantPage).toHaveURL(/\/login/);
  await tenantPage.getByLabel('E-mail', { exact: true }).fill(tenant.email);
  await tenantPage
    .getByLabel('Senha', { exact: true })
    .fill('Tenant-New-Password-2026');
  await tenantPage.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    tenantPage.getByRole('heading', { name: 'Conexões', exact: true }),
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
  await tenantPage
    .getByRole('button', { name: 'Sair da conta', exact: true })
    .click();
  await expect(tenantPage).toHaveURL(/\/login/);
  await tenantPage.getByLabel('E-mail', { exact: true }).fill(nextEmail);
  await tenantPage
    .getByLabel('Senha', { exact: true })
    .fill('Tenant-New-Password-2026');
  await tenantPage.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    tenantPage.getByRole('heading', { name: 'Conexões', exact: true }),
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

test('admin filters tenants and confirms suspension without losing platform data', async ({
  page,
}) => {
  await login(page);
  const tenant = await seedTenant(page.request, 'Admin Gestão Simples');
  const current = await state(page.request);
  expect(
    (
      await save(page.request, current, 'applicationBranding', {
        id: tenant.id,
        name: tenant.name,
        color: tenant.color,
        secondaryColor: '#ffffff',
        logo: '',
        domain: `gestao-${crypto.randomUUID()}.example.test`,
      })
    ).status(),
  ).toBe(200);
  await page.reload();
  await page.getByLabel('Buscar tenants').fill('Admin Gestão Simples');
  const row = page
    .locator('.gt-tenant-row')
    .filter({ hasText: 'Admin Gestão Simples' });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Domínio cadastrado:');
  await page.getByRole('button', { name: /Sem domínio/ }).click();
  await expect(row).toHaveCount(0);
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await page.getByLabel('Buscar tenants').fill('Admin Gestão Simples');
  await row.getByRole('button', { name: 'Gerenciar acesso' }).click();
  await expect(
    page.getByRole('heading', { name: 'Acesso', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Suspender tenant' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cancelar', exact: true })
    .click();
  expect(
    (await state(page.request)).state.tenants.find((t) => t.id === tenant.id)
      ?.status,
  ).toBe('active');
  await page.getByRole('button', { name: 'Suspender tenant' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirmar suspensão' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Reativar tenant' }),
  ).toBeVisible();
  expect(
    (await page.request.get(`/api/branding?tenant=${tenant.id}`)).status(),
  ).toBe(403);
  await page.getByRole('button', { name: 'Reativar tenant' }).click();
  await expect(
    page.getByRole('button', { name: 'Suspender tenant' }),
  ).toBeVisible();
  expect(
    (await page.request.get(`/api/branding?tenant=${tenant.id}`)).status(),
  ).toBe(200);
  await page.getByRole('button', { name: 'Todos os tenants' }).click();
  await page.screenshot({
    path: 'outputs/gotrade-admin-overview.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: 'outputs/gotrade-admin-mobile.png',
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('admin user directory and demo payments persist across navigation', async ({
  page,
}) => {
  await login(page);
  const tenant = await seedTenant(page.request, 'Tenant Financeiro');
  await page.reload();
  await page.getByRole('button', { name: 'Usuários', exact: true }).click();
  await page.getByLabel('Buscar usuários').fill('Tenant Financeiro');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText(tenant.email);
  await page.getByRole('button', { name: 'Pagamentos', exact: true }).click();
  await page.getByRole('button', { name: 'Novo registro' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tenant', { exact: true }).selectOption(tenant.id);
  await dialog.getByLabel('Plano', { exact: true }).fill('Pro mensal');
  await dialog.getByLabel('Valor (R$)', { exact: true }).fill('149.90');
  await dialog.getByLabel('Vencimento', { exact: true }).fill('2025-01-01');
  await dialog.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('tbody')).toContainText('Atrasado');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Pagamentos', exact: true }),
  ).toBeVisible();
  await expect(page.locator('tbody')).toContainText('Pro mensal');
  await page.locator('tbody').getByRole('button', { name: 'Editar' }).click();
  await dialog.getByLabel('Situação', { exact: true }).selectOption('paid');
  await dialog.getByRole('button', { name: 'Salvar registro' }).click();
  await expect(page.locator('tbody')).toContainText('Pago');
  expect(
    (await state(page.request)).state.billing?.find(
      (r) => r.tenantId === tenant.id,
    )?.amountCents,
  ).toBe(14990);
  await page.screenshot({
    path: 'outputs/gotrade-payments.png',
    fullPage: true,
  });
});

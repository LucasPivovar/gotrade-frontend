import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { validateTenant, initialState, type Tenant } from '../lib/model';
import { create as createPalette } from '../lib/brand-palette';
import { brandThemeVariables } from '../lib/brand-theme';
import { noticeTone, noticeColors } from '../lib/notices';

void test('generated palette keeps text readable across every primary hue', () => {
  const context: Record<string, any> = {};
  context.window = context;
  runInNewContext(readFileSync('prototipo/palette.js', 'utf8'), context);
  const { create, contrast } = context.TradingProPalette;
  const colors = ['#000000', '#ffffff', '#777777', '#96d600', '#e53935', '#0000ff', '#ffff00', '#f0f'];
  for (const r of [0, 64, 128, 192, 255]) for (const g of [0, 64, 128, 192, 255]) for (const b of [0, 64, 128, 192, 255]) {
    colors.push('#' + [r, g, b].map((value) => value.toString(16).padStart(2, '0')).join(''));
  }
  for (const color of colors) {
    const p = create(color, color);
    assert.ok(contrast(p.primary, p.onPrimary) >= 4.5, color + ' primary');
    assert.ok(contrast(p.hover, p.onHover) >= 4.5, color + ' hover');
    assert.equal(JSON.stringify(p), JSON.stringify(createPalette(color, color)), 'console and prototype palettes must match');
    for (const surface of [p.background, p.surface, p.surfaceRaised, p.subtle]) {
      for (const text of [p.text, p.muted, p.accent, p.secondary, p.complement]) {
        assert.ok(contrast(text, surface) >= 4.5, color + ' text on ' + surface);
      }
    }
  }
  const red = create('#e53935');
  assert.equal(red.surface, '#202020');
  assert.equal(red.background, '#191919');
  assert.notEqual(red.subtle, create('#005bcc').subtle);
  assert.notEqual(red.secondary, red.accent);
});

void test('brand theme covers sidebar, cards, popovers, buttons and charts', () => {
  const p = createPalette('#940505');
  const vars = brandThemeVariables({ color: '#940505', secondaryColor: '#ffffff', font: 'Outfit' });
  assert.equal(vars['--card'], p.surface);
  assert.equal(vars['--primary'], p.primary);
  assert.equal(vars['--primary-foreground'], p.onPrimary);
  assert.equal(vars['--sidebar-accent-foreground'], p.accent);
  assert.equal(vars['--popover'], p.surfaceRaised);
  assert.equal(vars['--chart-2'], p.complement);
  assert.ok(vars['--brand-font'].includes('Outfit'));
  assert.notEqual(vars['--sidebar'], vars['--background']);
  const blue = brandThemeVariables({ color: '#005bcc' });
  for (const key of ['--sidebar', '--card', '--background', '--popover', '--border'] as const) assert.equal(vars[key], blue[key]);
});

void test('notifications keep standard semantic colors independently of the brand', () => {
  assert.equal(noticeTone('Alterações salvas.'), 'success');
  assert.equal(noticeTone('Falha ao salvar.'), 'error');
  assert.equal(noticeTone('Selecione uma operação.'), 'warning');
  assert.equal(noticeTone('Link de ativação disponível.'), 'info');
  assert.deepEqual(noticeColors, { success: '#4ade80', warning: '#facc15', info: '#f4f4f5', error: '#fb7185' });
});

void test('login thumbnails and real auth share the same template without photo backgrounds', () => {
  const auth = readFileSync('prototipo/auth.js', 'utf8');
  const css = readFileSync('prototipo/auth.css', 'utf8');
  assert.ok(auth.includes('tp-auth-skeleton-form'));
  assert.ok(!auth.includes('auth-market-bg.png'));
  assert.ok(!css.includes('url('));
  const thumbnail = readFileSync('components/login-template-thumbnail.tsx', 'utf8');
  assert.ok(thumbnail.includes('skeleton=1'));
  const entry = readFileSync('prototipo/auth-preview-entry.tsx', 'utf8');
  assert.ok(entry.includes('__TP_RENDER_AUTH__'));
});

void test('chart canvas receives concrete theme colors instead of CSS variable strings', () => {
  const bundle = readFileSync('prototipo/assets/index-D08ZekFh.js', 'utf8');
  assert.ok(bundle.includes('upColor:getComputedStyle(document.documentElement).getPropertyValue("--positive").trim()'));
  assert.ok(bundle.includes('downColor:getComputedStyle(document.documentElement).getPropertyValue("--sell").trim()'));
  assert.ok(!bundle.includes('layout:{background:{color:"var(--panel)"}'));
});

void test('prototype auth is namespaced and never redirects to administrative login', () => {
  const bundle = readFileSync('prototipo/assets/index-D08ZekFh.js', 'utf8');
  assert.ok(bundle.includes('basename:"/prototipo"'));
  for (const mode of ['login', 'forgot', 'reset']) assert.ok(bundle.includes('a.jsx(WlAuth,{mode:"' + mode + '"})'));
  assert.ok(bundle.includes('to:{pathname:"/login",search:window.location.search}'));
  const branding = readFileSync('prototipo/branding.js', 'utf8');
  assert.ok(!branding.includes('location.replace'));
  assert.ok(!branding.includes('MutationObserver'));
  assert.ok(!branding.includes('fetch('));
  const admin = readFileSync('components/login-form.tsx', 'utf8');
  assert.ok(!admin.includes('tradingpro_token'));
  assert.ok(!admin.includes('whitelabel_tenant_branding'));
});

void test('tenant validation supports custom branding properties', () => {
  const base = initialState('test@example.test').tenants[0];
  const tenant: Tenant = {
    ...base,
    name: 'Nexus Trading',
    color: '#00b4d8',
    secondaryColor: '#caf0f8',
    font: 'Montserrat',
    darkMode: true,
  };

  // Should validate without throwing
  validateTenant(tenant);

  // Invalid hex color should throw
  assert.throws(() => validateTenant({ ...tenant, color: 'not-a-color' }));
  // Missing name should throw
  assert.throws(() => validateTenant({ ...tenant, name: '' }));
});

void test('prototype index.html loads branding.js before other scripts', () => {
  const indexPath = join(process.cwd(), 'prototipo', 'index.html');
  assert.ok(existsSync(indexPath), 'prototipo/index.html should exist');

  const content = readFileSync(indexPath, 'utf-8');
  assert.ok(content.includes('<script src="/prototipo/branding.js"></script>'), 'must include namespaced branding.js');
  
  const brandingIdx = content.indexOf('/branding.js');
  const mockApiIdx = content.indexOf('/mock-api.js');
  assert.ok(brandingIdx < mockApiIdx, 'branding.js must load before mock-api.js');
});

void test('branding.js contains essential synchronization and styling mechanisms', () => {
  const brandingPath = join(process.cwd(), 'prototipo', 'branding.js');
  assert.ok(existsSync(brandingPath), 'prototipo/branding.js should exist');

  const content = readFileSync(brandingPath, 'utf-8');

  // Verify CSS variable overrides
  assert.ok(content.includes('--lime'), 'must update --lime CSS variable');
  assert.ok(content.includes('--buy'), 'must update --buy CSS variable');
  assert.ok(content.includes('--brand-primary'), 'must set --brand-primary');
  assert.ok(content.includes('whitelabel-brand-styles'), 'must inject dynamic style sheet');

  // Verify real-time listeners
  assert.ok(content.includes('BroadcastChannel'), 'must support BroadcastChannel');
  assert.ok(content.includes('gotrade_branding_'), 'must scope the channel to the tenant');
  assert.ok(content.includes('WHITELABEL_BRANDING_UPDATE'), 'must handle WHITELABEL_BRANDING_UPDATE message');
  assert.ok(!content.includes('localStorage'), 'must resolve persisted branding from the server');

  // Verify DOM updates
  assert.ok(content.includes('applyBrandTextAndLogo'), 'must update brand text and logo in DOM');
  assert.ok(content.includes('isSameBranding'), 'must deduplicate branding updates to prevent infinite loops');
  assert.ok(content.includes('document.title'), 'must update document title');
});

void test('public branding API resolves an explicit identity', () => {
  const routePath = join(process.cwd(), 'app', 'api', 'branding', 'route.ts');
  assert.ok(existsSync(routePath), 'app/api/branding/route.ts should exist');

  const content = readFileSync(routePath, 'utf-8');
  assert.ok(content.includes(".bind(id)"), 'must query the requested tenant');
  assert.ok(content.includes('status: 404'), 'unknown identities must return 404');
  assert.ok(content.includes('GET'), 'must provide GET handler');
});

void test('prototype bundle files contain reactive WlHeroBrand, ht and WlSplashWord components', () => {
  const prototipoBundle = join(process.cwd(), 'prototipo', 'assets', 'index-D08ZekFh.js');
  const publicBundle = join(process.cwd(), 'public', 'assets', 'index-D08ZekFh.js');

  assert.ok(existsSync(prototipoBundle), 'prototipo bundle must exist');
  assert.ok(existsSync(publicBundle), 'public bundle must exist');

  const protContent = readFileSync(prototipoBundle, 'utf-8');
  const pubContent = readFileSync(publicBundle, 'utf-8');

  for (const [name, c] of [['prototipo', protContent], ['public', pubContent]]) {
    assert.ok(c.includes('function WlHeroBrand()'), `${name} bundle must define WlHeroBrand`);
    assert.ok(c.includes('function WlSplashWord()'), `${name} bundle must define WlSplashWord`);
    assert.ok(c.includes('function ht({size:t=26})'), `${name} bundle must define ht`);
    assert.ok(c.includes('WlHeroBrand'), `${name} bundle must use WlHeroBrand`);
    assert.ok(c.includes('WlSplashWord'), `${name} bundle must use WlSplashWord`);
    assert.ok(c.includes('gotrade-platform-brand'), `${name} bundle must render the tenant logo or plain brand name`);
  }
});

void test('branding.js handles favicon and tab icon dynamic updates', () => {
  const brandingPath = join(process.cwd(), 'prototipo', 'branding.js');
  const content = readFileSync(brandingPath, 'utf-8');

  assert.ok(content.includes('updateFavicons'), 'must define updateFavicons helper');
  assert.ok(content.includes('apple-touch-icon'), 'must update apple-touch-icon');
  assert.ok(content.includes('branding.favicon'), 'must read branding.favicon');
});

void test('login templates are supported in model and branding API', () => {
  const base = initialState('test@example.test').tenants[0];
  const tenant: Tenant = {
    ...base,
    loginTemplate: 'centered',
  };
  validateTenant(tenant);
  assert.equal(tenant.loginTemplate, 'centered');

  const routePath = join(process.cwd(), 'app', 'api', 'branding', 'route.ts');
  const content = readFileSync(routePath, 'utf-8');
  assert.ok(content.includes('loginTemplate'), 'branding API must return loginTemplate');

  const protRoute = join(process.cwd(), 'app', 'prototipo', '[[...slug]]', 'route.ts');
  const protContent = readFileSync(protRoute, 'utf-8');
  assert.ok(protContent.includes("join(process.cwd(), 'prototipo')"), 'prototipo route must serve prototipo files');
});

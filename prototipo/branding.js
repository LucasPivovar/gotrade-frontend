(function () {
  'use strict';
  const tenantId = new URLSearchParams(window.location.search).get('tenant') || '';
  const preview = new URLSearchParams(window.location.search).get('preview') === '1' && window.parent !== window;
  window.__GOTRADE_PREVIEW__ = preview;
  let previewBrand = null;
  const fetchBrand = window.fetch.bind(window);
  let currentBranding = { id: tenantId || 'default', name: 'Gotrade', color: '#4fbb83', secondaryColor: '#ffffff', logo: '', favicon: '', font: 'Inter', loginTemplate: 'split' };
  let initialized = false;
  function isSameBranding(a, b) {
    return ['name', 'color', 'secondaryColor', 'logo', 'favicon', 'font', 'darkMode', 'loginTemplate'].every((key) => a[key] === b[key]);
  }
  function applyColors(branding) {
    const palette = window.TradingProPalette.create(branding.color, branding.secondaryColor);
    const variables = {
      '--lime': palette.primary, '--lime-dim': palette.hover, '--buy': '#4ade80', '--positive': '#4ade80', '--positive-rgb': '74,222,128', '--positive-hover': '#22c55e', '--on-positive': '#052e16', '--sell': '#ff4d4d',
      '--brand-primary': palette.primary, '--brand-rgb': palette.rgb, '--brand-secondary': palette.secondary,
      '--brand-accent': palette.accent, '--brand-complement': palette.complement,
      '--brand-hover': palette.hover, '--brand-on-primary': palette.onPrimary, '--brand-on-hover': palette.onHover,
      '--brand-subtle': palette.subtle, '--dark': palette.background, '--bg': palette.background,
      '--panel': palette.surface, '--panel-2': palette.surfaceRaised, '--border': palette.border,
      '--text': palette.text, '--muted': palette.muted,
    };
    Object.entries(variables).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
    const font = ['Inter', 'Sora', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans', 'Lato', 'Nunito', 'DM Sans', 'Outfit', 'Plus Jakarta Sans', 'Manrope'].includes(branding.font) ? branding.font : 'Inter';
    document.documentElement.style.setProperty('--font-body', `"${font}", system-ui, sans-serif`);
    document.documentElement.style.setProperty('--font-display', `"${font}", system-ui, sans-serif`);
    let fontLink = document.getElementById('brand-font-stylesheet');
    if (!fontLink) { fontLink = document.createElement('link'); fontLink.id = 'brand-font-stylesheet'; fontLink.rel = 'stylesheet'; document.head.appendChild(fontLink); }
    const fontHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700;800&display=swap`;
    if (fontLink.getAttribute('href') !== fontHref) fontLink.href = fontHref;
    let style = document.getElementById('whitelabel-brand-styles');
    if (!style) { style = document.createElement('style'); style.id = 'whitelabel-brand-styles'; document.head.appendChild(style); }
    style.textContent = `
      .topbar-market-right{display:flex;align-items:center;gap:12px}.gotrade-account-toggle button{min-width:36px;height:34px;border:1px solid #ffffff26;border-radius:9px;background:#ffffff08;color:#c5d0c1;font-weight:700;cursor:pointer}.gotrade-account-toggle button:disabled{opacity:.5;cursor:not-allowed}.gotrade-account-toggle [role=alert]{font-size:11px;max-width:160px}
      .gotrade-trading-area{--lime:var(--brand-accent);--lime-dim:var(--brand-hover)}
      .gotrade-protection-steps{margin-top:12px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--brand-subtle);color:var(--text);font-size:12px;line-height:1.7;overflow-wrap:anywhere}
      .gotrade-cycle-summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 12px;margin-top:12px;font-size:12px;line-height:1.5;align-items:center}
      .gotrade-cycle-summary>.neg{font-size:14px;font-variant-numeric:tabular-nums}
      .gotrade-cycle-profit{grid-column:1/-1;padding-top:8px;border-top:1px solid var(--border);color:var(--positive);font-variant-numeric:tabular-nums}
      .gotrade-cycle-note{margin-top:12px;padding:10px 12px;border-left:2px solid var(--brand-accent);border-radius:0 6px 6px 0;background:var(--brand-subtle);color:var(--muted);font-size:12px;line-height:1.65}
      .topbar-stat-item .mono{color:var(--positive)!important}
      .gotrade-trading-area button[style*="var(--lime)"],.gotrade-trading-area button[style*="var(--brand-accent)"]{background:var(--brand-subtle)!important;border:1px solid color-mix(in srgb,var(--brand-accent) 40%,transparent)!important;color:var(--brand-accent)!important}
      .btn-lime,.hero-primary,.tour-button{background:var(--brand-primary)!important;color:var(--brand-on-primary)!important}
      .btn-lime:hover{background:var(--brand-hover)!important;color:var(--brand-on-hover)!important}
      .lime,.brand-accent,.history-eyebrow,.badge-demo,.tabbar a.active{color:var(--brand-accent)!important}
      .badge-demo,.tabbar a.active,.mode-chip-entry{background:var(--brand-subtle)!important}
      .history-chart-wrap polyline{stroke:var(--brand-accent)!important}.history-chart-wrap circle{fill:var(--brand-accent)!important}
      input:focus,select:focus,textarea:focus{border-color:var(--brand-accent)!important}
      .tour-cta{background:var(--panel)!important;border-color:var(--border)!important}
      .channel-icon-ticket{background:var(--brand-subtle)!important;color:var(--brand-accent)!important;border-color:var(--border)!important}
      .channel-ticket:after{background:linear-gradient(90deg,var(--brand-primary),var(--brand-secondary))!important}
      .pos{color:var(--positive)!important}
      .btn-buy,[data-tour="bot-start"]{background:var(--positive)!important;color:var(--on-positive)!important}
      .btn-buy:hover,[data-tour="bot-start"]:hover{background:var(--positive-hover)!important;color:var(--on-positive)!important}
      .tp-auth-brand strong{color:var(--text)}
    `;
  }
  let lastAppliedFavicon = '';
  function updateFavicons(branding) {
    const palette = window.TradingProPalette.create(branding.color);
    const iconUrl = branding.favicon || branding.logo || '/brand/gotrade-icon.png';
    if (iconUrl === lastAppliedFavicon) return;
    lastAppliedFavicon = iconUrl;
    document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]').forEach((element) => element.remove());
    const link = document.createElement('link'); link.rel = 'icon'; link.href = iconUrl; document.head.appendChild(link);
  }
  function applyBrandTextAndLogo(branding) {
    document.title = `${branding.name || 'Gotrade'} | Plataforma de Trading`;
    updateFavicons(branding);
  }
  function applyAll(branding) {
    if (!branding || typeof branding !== 'object') return;
    if (tenantId && branding.id !== tenantId) return;
    const next = { ...currentBranding, ...branding, loginTemplate: 'split' };
    if (initialized && isSameBranding(next, currentBranding)) return;
    initialized = true;
    currentBranding = next;
    window.__WHITELABEL_BRANDING__ = next;
    applyColors(next);
    applyBrandTextAndLogo(next);
    window.dispatchEvent(new CustomEvent('whitelabel:update', { detail: next }));
  }
  // Keep the selected platform in the URL throughout the archived SPA's navigation.
  if (tenantId) {
    ['pushState', 'replaceState'].forEach((method) => {
      const original = history[method].bind(history);
      history[method] = function (state, title, target) {
        if (target != null) {
          const url = new URL(target, window.location.href);
          if (url.origin === location.origin && (url.pathname.startsWith('/app') || url.pathname.startsWith('/prototipo'))) {
            url.searchParams.set('tenant', tenantId);
            if (preview) url.searchParams.set('preview', '1');
            target = url.pathname + url.search + url.hash;
          }
        }
        return original(state, title, target);
      };
    });
  }
  const gateStyle = document.createElement('style');
  gateStyle.textContent = 'html[data-brand-loading] #root,html[data-brand-error] #root{display:none!important}#gotrade-brand-status{position:fixed;inset:0;z-index:99999;background:#191919;color:#e8ece5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center;font:14px Inter,system-ui,sans-serif}#gotrade-brand-status button{padding:12px 18px;background:#4fbb83;color:#151a0b;border:0;border-radius:8px;cursor:pointer}';
  document.head.appendChild(gateStyle);
  function status(message, failed = false) {
    const render = () => {
      if (!document.documentElement.hasAttribute('data-brand-loading') && !document.documentElement.hasAttribute('data-brand-error')) return;
      if (!failed && document.documentElement.hasAttribute('data-brand-error')) return;
      let element = document.getElementById('gotrade-brand-status');
      if (!element) { element = document.createElement('div'); element.id = 'gotrade-brand-status'; document.body.appendChild(element); }
      element.replaceChildren();
      element.setAttribute('role', failed ? 'alert' : 'status');
      const text = document.createElement('p'); text.textContent = message; element.appendChild(text);
      if (failed) { const retry = document.createElement('button'); retry.textContent = 'Tentar novamente'; retry.onclick = () => void loadBrand(); element.appendChild(retry); }
    };
    if (document.body) render(); else document.addEventListener('DOMContentLoaded', render, { once: true });
  }
  let loading = false;
  async function loadBrand() {
    if (loading) return;
    loading = true;
    document.documentElement.setAttribute('data-brand-loading', '');
    document.documentElement.removeAttribute('data-brand-error');
    status('Carregando sua plataforma…');
    try {
      const response = await fetchBrand('/api/branding' + (tenantId ? '?tenant=' + encodeURIComponent(tenantId) : ''), { cache: 'no-store' });
      const brand = await response.json();
      if (!response.ok) throw Error(brand.error || 'Não foi possível carregar a plataforma.');
      applyAll({ ...brand, ...previewBrand });
      if (preview) window.parent.postMessage({ type: 'GOTRADE_PREVIEW_READY', tenantId }, location.origin);
      document.documentElement.removeAttribute('data-brand-loading');
      document.getElementById('gotrade-brand-status')?.remove();
    } catch (error) {
      document.documentElement.removeAttribute('data-brand-loading');
      document.documentElement.setAttribute('data-brand-error', '');
      status(error.message || 'Não foi possível carregar a plataforma.', true);
    } finally { loading = false; }
  }
  if (!preview && tenantId && typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel('gotrade_branding_' + tenantId);
    channel.onmessage = (event) => { if (event.data?.tenantId === tenantId && event.data?.type === 'WHITELABEL_BRANDING_UPDATE') void loadBrand(); };
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void loadBrand(); });
  if (preview) window.addEventListener('message', (event) => {
    if (event.source !== window.parent || event.origin !== location.origin || event.data?.type !== 'GOTRADE_PREVIEW_BRANDING' || event.data.tenantId !== tenantId) return;
    const brand = event.data.branding;
    if (!brand || typeof brand.name !== 'string' || !brand.name.trim() || brand.name.length > 100 || !/^#[0-9a-f]{6}$/i.test(brand.color) || !/^#[0-9a-f]{6}$/i.test(brand.secondaryColor)) return;
    previewBrand = { name: brand.name.trim(), color: brand.color, secondaryColor: brand.secondaryColor, logo: typeof brand.logo === "string" ? brand.logo : "" };
    applyAll({ ...currentBranding, ...previewBrand });
  });
  void loadBrand();
  window.__WHITELABEL_BRANDING_CONTROLLER__ = { setBranding: applyAll, getBranding: () => currentBranding };
  // Routing belongs to the SPA router; never redirect into the administrative login.
})();

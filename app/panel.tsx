'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Palette,
  Plus,
  Plug,
  Search,
  Settings,
  ShieldCheck,
  Users,
  CirclePause,
  Globe,
  LifeBuoy,
  CreditCard,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import { providers, type Session, type Tenant } from '@/lib/model';
import { validateApplicationBrand } from '@/lib/application';
import { applyBrandTheme } from '@/lib/brand-theme';
import PlatformPreview from '@/components/platform-preview';
import LogoEditor from '@/components/logo-editor';
import AdminSettings from '@/components/admin-settings';
import { AdminPayments } from '@/components/admin-management';
import TenantDirectory from '@/components/tenant-directory';
import SupportCenter from '@/components/support-center';
import NewTenantModal from '@/components/new-tenant-modal';
const sections = [
  { id: 'platform', label: 'Plataforma', icon: Palette },
  { id: 'connections', label: 'Conexões', icon: Plug },
  { id: 'support', label: 'Suporte', icon: LifeBuoy },
  { id: 'settings', label: 'Configurações', icon: Settings },
];
const adminSections = [
  { id: 'tenants', label: 'Tenants', icon: Users },
  { id: 'payments', label: 'Pagamentos', icon: CreditCard },
  { id: 'support', label: 'Suporte', icon: LifeBuoy },
  { id: 'settings', label: 'Configurações', icon: Settings },
];
export default function Panel({
  initialView = 'platform',
  initialSession,
}: {
  initialView?: string;
  initialSession?: Session;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(
    initialSession || null,
  );
  const latest = useRef(session);
  const admin = session?.role === 'admin';
  const tenant = session?.state.tenants.find((t) => t.id === session.tenantId);
  const [view, setView] = useState(
      initialView === 'connections' && initialSession?.role === 'admin'
        ? 'tenants'
        : initialView,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [search, setSearch] = useState(''),
    [statusFilter, setStatusFilter] = useState('all'),
    [creating, setCreating] = useState(false);
  const update = (s: Session) => {
    latest.current = s;
    setSession(s);
  };
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/workspace', { cache: 'no-store' });
      const data = await r.json();
      if (r.status === 401) {
        router.replace('/login');
        return;
      }
      if (!r.ok) throw Error(data.error);
      latest.current = data;
      setSession(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [router]);
  useEffect(() => {
    if (!initialSession) void load();
  }, [initialSession, load]);
  useEffect(() => {
    applyBrandTheme(admin ? undefined : tenant);
  }, [admin, tenant]);
  useEffect(() => {
    const restore = () => {
      const p = new URLSearchParams(location.search);
      const next = p.get('section') || location.pathname.slice(1);
      setView(
        [
          'tenants',
          'payments',
          'support',
          'settings',
          'platform',
          'connections',
        ].includes(next)
          ? next
          : latest.current?.role === 'admin'
            ? 'tenants'
            : 'platform',
      );
    };
    restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  const navigate = (next: string) => {
    setView(next);
    setError('');
    setNotice('');
    window.history.pushState(
      null,
      '',
      admin && next === 'payments' ? '/tenants?section=payments' : `/${next}`,
    );
  };
  async function save(action: string, value: unknown) {
    if (!latest.current || busy) return false;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          value,
          revision: latest.current.revision,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (r.status === 409) await load();
        throw Error(data.error || 'Não foi possível salvar.');
      }
      update(data);
      setNotice('Alterações salvas.');
      if (
        action === 'applicationBranding' &&
        typeof BroadcastChannel !== 'undefined'
      ) {
        const id = (value as { id: string }).id;
        const c = new BroadcastChannel(`gotrade_branding_${id}`);
        c.postMessage({ type: 'WHITELABEL_BRANDING_UPDATE', tenantId: id });
        c.close();
      }
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function deliver(id: string) {
    const t = latest.current?.state.tickets?.find((t) => t.id === id);
    const reply = t?.replies.at(-1);
    if (!reply) return 'Resposta salva.';
    try {
      const r = await fetch('/api/support/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id, replyId: reply.id }),
      });
      const d = await r.json();
      if (d.session) update(d.session);
      return d.message || d.error || 'Resposta salva.';
    } catch {
      return 'Resposta salva. Não foi possível encaminhar o e-mail.';
    }
  }
  async function logout() {
    setBusy(true);
    try {
      const r = await fetch('/api/auth/logout', { method: 'POST' });
      if (!r.ok) throw Error('Não foi possível sair.');
      window.location.assign('/login');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  if (!session)
    return (
      <main className="gt-loading">
        <p>{error || 'Abrindo seu espaço…'}</p>
        {error && (
          <button className="gt-button" onClick={() => void load()}>
            Tentar novamente
          </button>
        )}
      </main>
    );
  const tabs = admin ? adminSections : sections;
  const current = tabs.find((s) => s.id === view) || tabs[0];
  const tenants = session.state.tenants;
  const catalog = session.state.settings?.enabledProviders || providers;
  const filtered = tenants.filter(
    (t) =>
      `${t.name} ${t.admin} ${t.email} ${t.domain}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()) &&
      (statusFilter === 'all' ||
        (statusFilter === 'pending' ? !t.domain : t.status === statusFilter)),
  );
  const isList = admin && !['payments', 'support', 'settings'].includes(view);
  return (
    <div className="gt-shell">
      <aside className="gt-sidebar">
        <Link
          href={admin ? '/tenants' : '/platform'}
          className="gt-brand"
          onClick={(e) => {
            e.preventDefault();
            navigate(admin ? 'tenants' : 'platform');
          }}
        >
          <img src="/brand/gotrade-logo.svg" alt="GoTrade" />
        </Link>
        <nav aria-label="Menu principal">
          {tabs.map(({ id, label, icon: Icon }) =>
            admin ? (
              <button
                key={id}
                className={
                  current.id === id || (isList && id === 'tenants')
                    ? 'active'
                    : ''
                }
                onClick={() => navigate(id)}
              >
                <Icon size={19} />
                {label}
              </button>
            ) : (
              <Link
                key={id}
                href={`/${id}`}
                className={current.id === id ? 'active' : ''}
                aria-current={current.id === id ? 'page' : undefined}
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && e.button === 0) {
                    e.preventDefault();
                    navigate(id);
                  }
                }}
              >
                <Icon size={19} />
                {label}
              </Link>
            ),
          )}
        </nav>
        <div className="gt-sidebar-bottom">
          <button
            className="gt-signout"
            disabled={busy}
            onClick={() => void logout()}
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>
      <div className="gt-body">
        <main className="gt-main">
          <div className="gt-page-heading">
            <div>
              <h1>{isList ? 'Tenants' : current.label}</h1>
              <p>
                {isList
                  ? 'Plataformas, responsáveis e situação de cada tenant.'
                  : view === 'payments'
                    ? 'Controle os registros de pagamentos dos tenants.'
                    : view === 'support'
                      ? 'Converse com a equipe e acompanhe os tickets.'
                      : view === 'settings'
                        ? 'Sua conta e as preferências do espaço.'
                        : view === 'platform'
                          ? 'Personalize a plataforma com sua marca.'
                          : 'Meios de conexão disponíveis para sua operação.'}
              </p>
            </div>
            {isList && (
              <button
                className="gt-button gt-primary"
                onClick={() => {
                  setCreating(true);
                }}
              >
                <Plus size={17} />
                Novo tenant
              </button>
            )}
          </div>
          {error && (
            <div className="gt-alert gt-error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <output className="gt-alert gt-success">
              <Check size={17} />
              {notice}
            </output>
          )}
          {isList && (
            <>
              <div className="gt-admin-overview">
                {[
                  [Users, 'Todos', tenants.length],
                  [
                    ShieldCheck,
                    'Ativos',
                    tenants.filter((t) => t.status === 'active').length,
                  ],
                  [
                    CirclePause,
                    'Inativos',
                    tenants.filter((t) => t.status === 'suspended').length,
                  ],
                  [
                    Globe,
                    'Sem domínio',
                    tenants.filter((t) => !t.domain).length,
                  ],
                ].map(([Icon, label, count]) => {
                  const I = Icon as typeof Users;
                  return (
                    <div className="gt-admin-metric" key={String(label)}>
                      <I size={20} />
                      <span>{String(label)}</span>
                      <strong>{Number(count)}</strong>
                    </div>
                  );
                })}
              </div>
              <div className="gt-list-toolbar">
                <select
                  aria-label="Filtrar tenants"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="suspended">Inativos</option>
                  <option value="pending">Sem domínio</option>
                </select>
                <label className="gt-search">
                  <Search size={17} />
                  <input
                    aria-label="Buscar tenants"
                    placeholder="Nome, e-mail ou domínio"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              <TenantDirectory
                tenants={filtered}
                records={session.state.billing || []}
                catalog={catalog}
                busy={busy}
                onSave={(t) => save('tenant', t)}
              />
            </>
          )}
          {admin && view === 'payments' && (
            <AdminPayments
              tenants={tenants}
              records={session.state.billing || []}
              busy={busy}
              onSave={(v) => save('billing', v)}
            />
          )}
          {view === 'support' && (
            <SupportCenter
              admin={!!admin}
              tickets={session.state.tickets || []}
              tenants={tenants}
              telegram={session.state.settings?.telegramUrl}
              busy={busy}
              onSave={save}
              onDeliver={deliver}
            />
          )}
          {view === 'settings' && (
            <div className={admin ? 'gt-account-layout' : undefined}>
              <AccountSettings email={session.email} onSaved={load} />
              {admin && (
                <AdminSettings
                  key={session.revision}
                  settings={session.state.settings}
                  busy={busy}
                  onSave={(v) => save('settings', v)}
                />
              )}
            </div>
          )}
          {!admin && tenant && view === 'platform' && (
            <PlatformEditor
              key={tenant.id}
              tenant={tenant}
              busy={busy}
              onSave={(v) =>
                save('applicationBranding', { id: tenant.id, ...v })
              }
            />
          )}
          {!admin && tenant && view === 'connections' && (
            <div className="gt-connection-grid">
              {catalog.map((p) => {
                const enabled = tenant.connections.includes(p);
                return (
                  <section className="gt-card gt-connection" key={p}>
                    <div className="gt-connection-top">
                      <span className="gt-provider-icon">
                        <Plug size={24} />
                      </span>
                      <span
                        className={`gt-status ${enabled ? 'is-active' : ''}`}
                      >
                        {enabled ? 'Liberada' : 'Não liberada'}
                      </span>
                    </div>
                    <h2>{p}</h2>
                    <p>
                      {enabled
                        ? 'Disponível para sua plataforma.'
                        : 'Solicite a liberação ao administrador pelo suporte.'}
                    </p>
                    {enabled ? (
                      <a
                        className="gt-button"
                        target="_blank"
                        rel="noreferrer"
                        href={`/prototipo/app?tenant=${tenant.id}`}
                      >
                        Abrir plataforma
                        <ArrowUpRight size={16} />
                      </a>
                    ) : (
                      <button
                        className="gt-button"
                        onClick={() => navigate('support')}
                      >
                        Solicitar acesso
                      </button>
                    )}
                  </section>
                );
              })}
              {!catalog.length && (
                <p className="gt-admin-placeholder">
                  O administrador ainda não disponibilizou conexões.
                </p>
              )}
            </div>
          )}
        </main>
      </div>
      <NewTenantModal
        open={creating}
        onClose={() => setCreating(false)}
        busy={busy}
        tenants={tenants}
        onSave={(t) => save('tenant', t)}
      />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <div className="gt-color-field">
        <input
          aria-label={`Selecionar ${label.toLowerCase()}`}
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          aria-label={label}
          value={value}
          pattern="#[0-9a-fA-F]{6}"
          required
          maxLength={7}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </label>
  );
}

function PlatformEditor({
  tenant,
  busy,
  onSave,
}: {
  tenant: Tenant;
  busy: boolean;
  onSave: (value: {
    name: string;
    color: string;
    secondaryColor: string;
    domain?: string;
    logo?: string;
    checkoutPriceCents?: number;
    webhook?: string;
  }) => Promise<boolean>;
}) {
  const [name, setName] = useState(tenant.name);
  const [color, setColor] = useState(tenant.color);
  const secondaryColor = tenant.secondaryColor || '#ffffff';
  const [error, setError] = useState('');
  const [domain, setDomain] = useState(tenant.domain || '');
  const [logo, setLogo] = useState(tenant.logo || '');
  const [checkoutPrice, setCheckoutPrice] = useState(
    (tenant.checkoutPriceCents || 300000) / 100,
  );
  const [webhook, setWebhook] = useState(tenant.webhook || '');
  const [uploading, setUploading] = useState(false);
  const [logoSource, setLogoSource] = useState('');
  useEffect(
    () => () => {
      if (logoSource) URL.revokeObjectURL(logoSource);
    },
    [logoSource],
  );
  const dirty =
    name !== tenant.name ||
    color !== tenant.color ||
    domain !== (tenant.domain || '') ||
    Math.round(checkoutPrice * 100) !== (tenant.checkoutPriceCents || 300000) ||
    webhook !== (tenant.webhook || '') ||
    logo !== (tenant.logo || '');
  const brand = {
    name,
    color,
    secondaryColor,
    domain,
    logo,
    checkoutPriceCents: Math.round(checkoutPrice * 100),
    webhook,
  };
  return (
    <div className="gt-platform-grid gt-platform-stacked">
      <section className="gt-card gt-editor">
        <form
          className="gt-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              const value = validateApplicationBrand(brand);
              if (await onSave(value)) {
                setName(value.name);
                setColor(value.color);
                setDomain(value.domain || '');
              }
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <h2>Sua plataforma</h2>
          <p className="gt-muted">
            Sua plataforma já está pronta. Personalize abaixo.
          </p>
          <div className="gt-platform-fields">
            <div className="gt-platform-details">
              <label>
                Domínio
                <input
                  placeholder="plataforma.com.br"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  maxLength={253}
                />
              </label>

              <label>
                Nome da plataforma
                <input
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome da sua plataforma"
                />
              </label>
              <ColorField
                label="Cor principal"
                value={color}
                onChange={setColor}
              />
            </div>
            <div className="gt-platform-logo">
              <label>
                Logo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploading || busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    setError('');
                    if (
                      !['image/png', 'image/jpeg', 'image/webp'].includes(
                        file.type,
                      ) ||
                      file.size > 5 * 1024 * 1024
                    ) {
                      setError('Use PNG, JPG ou WebP com até 5 MB.');
                      return;
                    }
                    setLogoSource(URL.createObjectURL(file));
                  }}
                />
              </label>
              <small className="gt-muted">
                PNG, JPG ou WebP, até 5 MB. Recorte a logo antes de enviar.
              </small>
              {uploading && <output>Enviando logo…</output>}
              {logo && (
                <div>
                  <img
                    src={logo}
                    alt="Logo da plataforma"
                    style={{
                      maxWidth: 200,
                      maxHeight: 60,
                      objectFit: 'contain',
                    }}
                  />
                  <button
                    type="button"
                    className="gt-back"
                    onClick={() => setLogo('')}
                  >
                    Remover logo
                  </button>
                </div>
              )}
              <label>
                Valor do checkout (R$)
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1000000"
                  value={checkoutPrice}
                  onChange={(e) => setCheckoutPrice(Number(e.target.value))}
                />
              </label>
              <label>
                Webhook
                <input
                  type="url"
                  placeholder="https://seu-servico.com/webhook"
                  value={webhook}
                  onChange={(e) => setWebhook(e.target.value)}
                  maxLength={2048}
                />
              </label>
              <small className="gt-muted">
                O endereço fica salvo para a futura integração. Nenhum evento é
                enviado nesta amostra.
              </small>
            </div>
          </div>
          {error && (
            <p role="alert" className="gt-form-error">
              {error}
            </p>
          )}
          <div className="gt-platform-actions">
            <button
              className="gt-button gt-primary"
              disabled={busy || uploading || !dirty}
            >
              {busy ? 'Salvando…' : 'Salvar alterações'}
            </button>
            {tenant.status === 'active' && (
              <a
                className="gt-button"
                href={`/prototipo?tenant=${tenant.id}`}
                target="_blank"
                rel="noreferrer"
              >
                Abrir plataforma
                <ArrowUpRight size={16} />
              </a>
            )}
          </div>
        </form>
      </section>
      <PlatformPreview tenantId={tenant.id} brand={brand} />
      {logoSource && (
        <LogoEditor
          key={logoSource}
          source={logoSource}
          busy={uploading}
          onClose={() => setLogoSource('')}
          onApply={async (file) => {
            setUploading(true);
            try {
              const form = new FormData();
              form.set('file', file);
              form.set('tenantId', tenant.id);
              const response = await fetch('/api/media', {
                method: 'POST',
                body: form,
              });
              const data = await response.json();
              if (!response.ok)
                throw Error(data.error || 'Não foi possível enviar a logo.');
              setLogo(data.url);
              setLogoSource('');
            } finally {
              setUploading(false);
            }
          }}
        />
      )}
    </div>
  );
}
function AccountSettings({
  email,
  onSaved,
}: {
  email: string;
  onSaved: () => Promise<void>;
}) {
  const [nextEmail, setEmail] = useState(email),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  return (
    <section className="gt-card gt-editor gt-account-settings">
      <h2>Minha conta</h2>
      <form
        className="gt-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          setMessage('');
          if (password !== confirm) {
            setError('As senhas não coincidem.');
            return;
          }
          setBusy(true);
          try {
            const response = await fetch('/api/auth/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: nextEmail,
                newPassword: password || undefined,
              }),
            });
            const data = await response.json();
            if (!response.ok)
              throw Error(data.error || 'Não foi possível salvar.');
            setPassword('');
            setConfirm('');
            await onSaved();
            setMessage('Dados atualizados.');
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          E-mail
          <input
            type="email"
            required
            autoComplete="email"
            value={nextEmail}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <h3>Alterar senha</h3>
        <p className="gt-muted">Preencha apenas para trocar sua senha.</p>
        <label>
          Nova senha
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          Confirmar nova senha
          <input
            type="password"
            autoComplete="new-password"
            maxLength={128}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="gt-form-error">
            {error}
          </p>
        )}
        {message && <output>{message}</output>}
        <button className="gt-button gt-primary" disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </form>
    </section>
  );
}

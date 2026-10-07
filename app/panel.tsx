'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  LogOut,
  Palette,
  Plus,
  Plug,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AccountInvite from '@/components/account-invite';
import PlatformPreview from '@/components/platform-preview';
import { providers, type Session, type Tenant } from '@/lib/model';
import { createApplication, validateApplicationBrand } from '@/lib/application';
import { applyBrandTheme } from '@/lib/brand-theme';
import { create as palette } from '@/lib/brand-palette';

const sections = [
  { id: 'connections', label: 'Conexões', icon: Plug, href: '/connections' },
  { id: 'platform', label: 'Plataforma', icon: Palette, href: '/platform' },
  { id: 'settings', label: 'Configurações', icon: Settings, href: '/settings' },
];

export default function Panel({
  initialView = 'connections',
}: { initialView?: string } = {}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [view, setView] = useState(
    ['connections', 'platform', 'settings'].includes(initialView)
      ? initialView
      : 'connections',
  );
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [creationError, setCreationError] = useState('');
  const [newName, setNewName] = useState('');
  const [newAdmin, setNewAdmin] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const admin = session?.role === 'admin';
  const tenant = session?.state.tenants.find(
    (t) => t.id === (admin ? selectedId : session.tenantId),
  );

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/workspace', { cache: 'no-store' });
      const data = await response.json();
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      if (!response.ok)
        throw Error(data.error || 'Não foi possível carregar os dados.');
      setSession(data);
      const params = new URLSearchParams(window.location.search);
      const requestedId = params.get('tenant');
      if (
        data.role === 'admin' &&
        requestedId &&
        (data as Session).state.tenants.some((t) => t.id === requestedId)
      ) {
        setSelectedId(requestedId);
        const section = params.get('section') || 'platform';
        setView(sections.some((s) => s.id === section) ? section : 'platform');
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [router]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    applyBrandTheme(admin ? undefined : tenant);
    document.title = tenant ? `${tenant.name} | Gotrade` : 'Gotrade';
  }, [tenant, admin]);

  async function save(action: string, value: unknown): Promise<boolean> {
    if (!session || busy) return false;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value, revision: session.revision }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) await load();
        throw Error(data.error || 'Não foi possível salvar.');
      }
      setSession(data);
      setNotice('Alterações salvas.');
      if (
        action === 'applicationBranding' &&
        typeof BroadcastChannel !== 'undefined'
      ) {
        const id = (value as { id: string }).id;
        const brand = (data as Session).state.tenants.find((t) => t.id === id);
        const channel = new BroadcastChannel(`gotrade_branding_${id}`);
        channel.postMessage({
          type: 'WHITELABEL_BRANDING_UPDATE',
          tenantId: id,
          branding: brand,
        });
        channel.close();
      }
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw Error('Não foi possível sair.');
      window.location.assign('/login');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  function navigate(next: string, id = selectedId) {
    setView(next);
    setError('');
    setNotice('');
    if (admin) {
      const target = id
        ? `/tenants?tenant=${encodeURIComponent(id)}&section=${next}`
        : next === 'settings'
          ? '/settings'
          : '/tenants';
      window.history.replaceState(null, '', target);
    }
  }
  function openTenant(t: Tenant) {
    setSelectedId(t.id);
    navigate('platform', t.id);
  }

  if (!session)
    return (
      <main className="gt-loading">
        <Zap size={32} />
        <h1>Gotrade</h1>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button className="gt-button" onClick={() => void load()}>
              Tentar novamente
            </button>
          </>
        ) : (
          <p>Carregando seu espaço…</p>
        )}
      </main>
    );
  const managing = admin && !!tenant;
  const title =
    admin && !tenant
      ? view === 'settings'
        ? 'Configurações'
        : 'Tenants'
      : sections.find((s) => s.id === view)?.label || 'Conexões';
  const filtered = session.state.tenants.filter((t) =>
    `${t.name} ${t.email}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="gt-shell">
      <aside className="gt-sidebar">
        <Link href="/" className="gt-brand">
          <span className="gt-brand-icon">
            <Zap size={21} fill="currentColor" />
          </span>
          <strong>Gotrade</strong>
        </Link>
        <span className="gt-workspace-label">
          {admin ? 'ADMINISTRAÇÃO' : 'SEU ESPAÇO'}
        </span>
        {tenant && (
          <div className="gt-workspace">
            <span
              className="gt-avatar"
              style={{
                background: tenant.color,
                color: palette(tenant.color).onPrimary,
              }}
            >
              {tenant.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{tenant.name}</strong>
              <small>
                {managing ? 'Tenant selecionado' : 'Sua plataforma'}
              </small>
            </div>
          </div>
        )}
        {managing && (
          <button
            className="gt-back"
            onClick={() => {
              setSelectedId('');
              navigate('connections', '');
            }}
          >
            <ArrowLeft size={16} />
            Todos os tenants
          </button>
        )}
        <nav aria-label="Menu principal">
          {admin && !tenant ? (
            <>
              <button
                className={view !== 'settings' ? 'active' : ''}
                onClick={() => navigate('connections')}
              >
                <Users size={19} />
                Tenants
              </button>
              <button
                className={view === 'settings' ? 'active' : ''}
                onClick={() => navigate('settings')}
              >
                <Settings size={19} />
                Configurações
              </button>
            </>
          ) : (
            sections.map(({ id, label, icon: Icon, href }) =>
              managing ? (
                <button
                  key={id}
                  className={view === id ? 'active' : ''}
                  onClick={() => navigate(id)}
                >
                  <Icon size={19} />
                  {label}
                </button>
              ) : (
                <Link
                  key={id}
                  href={href}
                  className={view === id ? 'active' : ''}
                  aria-current={view === id ? 'page' : undefined}
                >
                  <Icon size={19} />
                  {label}
                </Link>
              ),
            )
          )}
        </nav>
        <div className="gt-sidebar-bottom">
          <div className="gt-account">
            <ShieldCheck size={18} />
            <div>
              <strong>
                {admin ? 'Administrador' : tenant?.admin || 'Minha conta'}
              </strong>
              <small>{session.email}</small>
            </div>
          </div>
          <button
            className="gt-back"
            disabled={busy}
            onClick={() => void logout()}
          >
            <LogOut size={17} />
            Sair da conta
          </button>
        </div>
      </aside>
      <div className="gt-body">
        <header className="gt-topbar">
          <span>
            {managing
              ? `Tenants / ${tenant.name}`
              : admin
                ? 'Administração'
                : tenant?.name || 'Meu espaço'}
          </span>
          <span className="gt-role">{admin ? 'Admin' : 'Tenant'}</span>
        </header>
        <main className="gt-main">
          <div className="gt-page-heading">
            <div>
              <h1>{title}</h1>
              {view !== 'platform' && (
                <p>
                  {admin && !tenant && view !== 'settings'
                    ? 'Gerencie acessos e acompanhe a plataforma de cada tenant.'
                    : view === 'platform'
                      ? 'Defina o nome e a paleta que aparecem na sua plataforma.'
                      : view === 'connections'
                        ? 'Veja as integrações disponíveis para sua operação.'
                        : 'Gerencie os dados e o acesso da sua conta.'}
                </p>
              )}
            </div>
            {admin && !tenant && view !== 'settings' && (
              <button
                className="gt-button gt-primary"
                onClick={() => {
                  setCreationError('');
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
          {admin && !tenant && view !== 'settings' && (
            <>
              <div className="gt-list-toolbar">
                <span>
                  {session.state.tenants.length} tenants{' '}
                  <span className="gt-muted">
                    ·{' '}
                    {
                      session.state.tenants.filter((t) => t.status === 'active')
                        .length
                    }{' '}
                    ativos
                  </span>
                </span>
                <label className="gt-search">
                  <Search size={17} />
                  <input
                    aria-label="Buscar tenants"
                    placeholder="Buscar por nome ou e-mail"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              <div className="gt-tenant-list">
                {filtered.map((t) => (
                  <article className="gt-tenant-row" key={t.id}>
                    <span
                      className="gt-avatar"
                      style={{
                        background: t.color,
                        color: palette(t.color).onPrimary,
                      }}
                    >
                      {t.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="gt-tenant-info">
                      <h2>{t.name}</h2>
                      <p>{t.email || 'Responsável não configurado'}</p>
                    </div>
                    <span
                      className={`gt-status ${t.status === 'active' ? 'is-active' : ''}`}
                    >
                      {t.status === 'active' ? 'Ativo' : 'Suspenso'}
                    </span>
                    <button className="gt-button" onClick={() => openTenant(t)}>
                      Ver plataforma
                      <ChevronRight size={16} />
                    </button>
                  </article>
                ))}
                {!filtered.length && (
                  <div className="gt-empty">
                    <Users size={32} />
                    <h2>
                      {search
                        ? 'Nenhum tenant encontrado'
                        : 'Seu primeiro tenant começa aqui'}
                    </h2>
                    <p>
                      {search
                        ? 'Tente outro nome ou e-mail.'
                        : 'Cadastre um tenant para liberar o acesso à sua plataforma.'}
                    </p>
                    {!search && (
                      <button
                        className="gt-button gt-primary"
                        onClick={() => setCreating(true)}
                      >
                        <Plus size={16} />
                        Novo tenant
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
          {tenant && view === 'connections' && (
            <>
              <div className="gt-info">
                <Plug size={20} />
                <p>
                  As integrações abaixo indicam os acessos liberados pelo
                  administrador. A conexão de contas e a execução de ordens
                  dependem da integração com cada corretora.
                </p>
              </div>
              <div className="gt-connection-grid">
                {providers.map((provider) => {
                  const enabled = tenant.connections.includes(provider);
                  return (
                    <article className="gt-card gt-connection" key={provider}>
                      <div className="gt-connection-top">
                        <span className="gt-provider-icon">
                          <Plug size={25} />
                        </span>
                        <span
                          className={`gt-status ${enabled ? 'is-active' : ''}`}
                        >
                          {enabled ? 'Liberada' : 'Não liberada'}
                        </span>
                      </div>
                      <h2>{provider}</h2>
                      <p>
                        {enabled
                          ? 'Integração disponível para esta operação.'
                          : 'A liberação é gerenciada pelo administrador.'}
                      </p>
                      {admin ? (
                        <label className="gt-toggle">
                          <input
                            type="checkbox"
                            checked={enabled}
                            disabled={busy}
                            onChange={(e) =>
                              void save('tenant', {
                                ...tenant,
                                connections: e.target.checked
                                  ? [...tenant.connections, provider]
                                  : tenant.connections.filter(
                                      (p) => p !== provider,
                                    ),
                              })
                            }
                          />
                          <span>Liberar acesso</span>
                        </label>
                      ) : (
                        <div className="gt-connection-footer">
                          {enabled ? (
                            <Check size={16} />
                          ) : (
                            <ShieldCheck size={16} />
                          )}
                          {enabled
                            ? 'Acesso liberado'
                            : 'Solicite acesso ao administrador'}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
          {tenant && view === 'platform' && (
            <PlatformEditor
              key={tenant.id}
              tenant={tenant}
              busy={busy}
              onSave={(value) =>
                save('applicationBranding', { id: tenant.id, ...value })
              }
            />
          )}
          {view === 'settings' && (
            <>
              {managing ? (
                <TenantAccess
                  key={tenant.id}
                  tenant={tenant}
                  busy={busy}
                  onSave={(value) => save('tenant', value)}
                />
              ) : (
                <AccountSettings email={session.email} admin={!!admin} />
              )}
            </>
          )}
        </main>
      </div>
      <Dialog
        open={creating}
        onOpenChange={(open) => {
          if (!busy) setCreating(open);
        }}
      >
        <DialogContent className="gt-dialog">
          <DialogHeader>
            <DialogTitle>Novo tenant</DialogTitle>
            <DialogDescription>
              Cadastre a operação e o responsável pelo acesso.
            </DialogDescription>
          </DialogHeader>
          <form
            className="gt-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setCreationError('');
              try {
                const value = {
                  ...createApplication(
                    { name: newName, color: '#96d600' },
                    session.state.tenants,
                  ),
                  admin: newAdmin.trim(),
                  email: newEmail.trim().toLowerCase(),
                };
                if (await save('tenant', value)) {
                  setCreating(false);
                  setNewName('');
                  setNewAdmin('');
                  setNewEmail('');
                  openTenant(value);
                  setNotice(
                    'Tenant criado. Gere um convite em Configurações para liberar o acesso.',
                  );
                }
              } catch (err) {
                setCreationError((err as Error).message);
              }
            }}
          >
            <label>
              Nome da operação
              <input
                required
                maxLength={100}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex.: Alpha Trade"
              />
            </label>
            <label>
              Nome do responsável
              <input
                required
                maxLength={100}
                value={newAdmin}
                onChange={(e) => setNewAdmin(e.target.value)}
                placeholder="Nome e sobrenome"
              />
            </label>
            <label>
              E-mail do responsável
              <input
                required
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="responsavel@empresa.com"
              />
            </label>
            {(creationError || error) && (
              <p className="gt-form-error" role="alert">
                {creationError || error}
              </p>
            )}
            <div className="gt-form-actions">
              <button
                type="button"
                className="gt-button"
                disabled={busy}
                onClick={() => setCreating(false)}
              >
                Cancelar
              </button>
              <button className="gt-button gt-primary" disabled={busy}>
                {busy ? 'Criando…' : 'Criar tenant'}
                <Plus size={16} />
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
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
  }) => Promise<boolean>;
}) {
  const [name, setName] = useState(tenant.name);
  const [color, setColor] = useState(tenant.color);
  const [secondaryColor, setSecondaryColor] = useState(
    tenant.secondaryColor || '#ffffff',
  );
  const [error, setError] = useState('');
  const dirty =
    name !== tenant.name ||
    color !== tenant.color ||
    secondaryColor !== (tenant.secondaryColor || '#ffffff');
  const brand = { name, color, secondaryColor };
  return (
    <div className="gt-platform-grid">
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
                setSecondaryColor(value.secondaryColor);
              }
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
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
          <ColorField label="Cor principal" value={color} onChange={setColor} />
          <ColorField
            label="Cor secundária"
            value={secondaryColor}
            onChange={setSecondaryColor}
          />
          {error && (
            <p role="alert" className="gt-form-error">
              {error}
            </p>
          )}
          <button className="gt-button gt-primary" disabled={busy || !dirty}>
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
        </form>
      </section>
      <PlatformPreview tenantId={tenant.id} brand={brand} />
    </div>
  );
}
function TenantAccess({
  tenant,
  busy,
  onSave,
}: {
  tenant: Tenant;
  busy: boolean;
  onSave: (tenant: Tenant) => Promise<boolean>;
}) {
  const [admin, setAdmin] = useState(tenant.admin);
  const [email, setEmail] = useState(tenant.email);
  return (
    <div className="gt-settings-grid">
      <section className="gt-card gt-editor">
        <h2>Acesso do tenant</h2>
        <p className="gt-muted">Dados do responsável pela operação.</p>
        <form
          className="gt-form"
          onSubmit={(e) => {
            e.preventDefault();
            void onSave({
              ...tenant,
              admin: admin.trim(),
              email: email.trim().toLowerCase(),
            });
          }}
        >
          <label>
            Nome do responsável
            <input
              required
              value={admin}
              onChange={(e) => setAdmin(e.target.value)}
            />
          </label>
          <label>
            E-mail do responsável
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button className="gt-button gt-primary" disabled={busy}>
            Salvar responsável
          </button>
        </form>
        <AccountInvite key={tenant.email} tenantId={tenant.id} />
      </section>
      <section className="gt-card gt-editor">
        <h2>Status da operação</h2>
        <p className="gt-muted">
          Suspender bloqueia o acesso do tenant e a abertura da plataforma.
        </p>
        <span
          className={`gt-status ${tenant.status === 'active' ? 'is-active' : ''}`}
        >
          {tenant.status === 'active' ? 'Ativa' : 'Suspensa'}
        </span>
        <button
          className="gt-button gt-status-action"
          disabled={busy}
          onClick={() =>
            void onSave({
              ...tenant,
              status: tenant.status === 'active' ? 'suspended' : 'active',
            })
          }
        >
          {tenant.status === 'active' ? 'Suspender tenant' : 'Reativar tenant'}
        </button>
      </section>
    </div>
  );
}

function AccountSettings({ email, admin }: { email: string; admin: boolean }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return (
    <section className="gt-card gt-editor gt-account-settings">
      <h2>Minha conta</h2>
      <p className="gt-muted">{email}</p>
      <span className="gt-status">{admin ? 'Administrador' : 'Tenant'}</span>
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
              body: JSON.stringify({ newPassword: password }),
            });
            const data = await response.json();
            if (!response.ok)
              throw Error(data.error || 'Não foi possível alterar a senha.');
            setPassword('');
            setConfirm('');
            setMessage('Senha atualizada.');
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h3>Alterar senha</h3>
        <label>
          Nova senha
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
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
            required
            minLength={12}
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
          {busy ? 'Salvando…' : 'Atualizar senha'}
        </button>
      </form>
    </section>
  );
}

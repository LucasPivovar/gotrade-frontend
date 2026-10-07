'use client';
import { useState } from 'react';
import Link from 'next/link';
import '@/app/login.css';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowUpRight,
  Eye,
  EyeOff,
  Zap,
  Activity,
  Check,
} from '@/components/icons';
import type { LoginTemplate } from '@/lib/model';

interface Branding {
  name: string;
  color: string;
  logo: string;
  loginTemplate: LoginTemplate;
}

// ── Shared form logic ──────────────────────────────────────────────────────
function useLoginForm(invite?: string) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function getTarget() {
    if (typeof window === 'undefined') return '/connections';
    const params = new URLSearchParams(window.location.search);
    const target = params.get('redirect');
    return target && ['/connections', '/platform', '/settings', '/tenants'].includes(target) ? target : '/connections';
  }

  async function submit(demo: boolean) {
    setBusy(true);
    setError('');
    const target = getTarget();
    try {
      if (demo) {
        const response = await fetch('/api/demo/role', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'tenant' }),
        });
        if (!response.ok) throw Error('Não foi possível abrir a demonstração.');
        window.location.assign(target);
        return;
      }
      const r = await fetch(
        invite ? '/api/auth/invite' : '/api/auth/login',
        {
          method: invite ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            invite ? { token: invite, password } : { email, password },
          ),
        },
      );
      const data = await r.json() as { error?: string };
      if (!r.ok) throw Error(data.error);
      router.replace(target);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function quickLogin() {
    setBusy(true);
    setError('');
    const target = getTarget();
    try {
      const r = await fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await r.json() as { error?: string };
      if (!r.ok) throw Error(data.error || 'Não foi possível entrar.');
      window.location.assign(target);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return { email, setEmail, password, setPassword, visible, setVisible, busy, error, submit, quickLogin };
}

// ── Shared form fields ─────────────────────────────────────────────────────
function LoginFields({
  invite, demo, form,
}: {
  invite?: string;
  demo: boolean;
  branding: Branding;
  form: ReturnType<typeof useLoginForm>;
}) {
  const { email, setEmail, password, setPassword, visible, setVisible, busy, error, submit } = form;
  return (
    <form
      className="login-content"
      noValidate={demo}
      onSubmit={(e) => { e.preventDefault(); void submit(demo); }}
    >
      <div className="login-form-heading">
        <span className="login-symbol"><ShieldCheck size={20} /></span>
        <span className="login-eyebrow">PAINEL DA PLATAFORMA</span>
      </div>
      <h1>{invite ? 'Ative sua conta' : 'Entre na sua conta'}</h1>
      <p>
        {invite
          ? 'Defina sua senha para acessar a operação.'
          : 'Use suas credenciais de administrador.'}
      </p>
      {!invite && (
        <label className="field">
          <span>E-mail</span>
          <input
            autoComplete="username"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
          />
        </label>
      )}
      <label className="field">
        <span>{invite ? 'Crie uma senha' : 'Senha'}</span>
        <div className="password-field">
          <input
            type={visible ? 'text' : 'password'}
            required
            minLength={invite ? 12 : undefined}
            maxLength={128}
            autoComplete={invite ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={invite ? 'Mínimo de 12 caracteres' : 'Sua senha'}
          />
          <button
            type="button"
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      {error && <p className="login-error" role="alert">{error}</p>}
      <button className="primary" disabled={busy}>
        {busy ? 'Autenticando…' : invite ? 'Ativar conta' : demo ? 'Entrar na demonstração' : 'Entrar'}
        <ArrowUpRight size={17} />
      </button>

    </form>
  );
}

// ── Template A: Split (padrão) ─────────────────────────────────────────────
function TemplateSplit({ invite, demo, branding }: { invite?: string; demo: boolean; branding: Branding }) {
  const form = useLoginForm(invite);
  return (
    <main className="login-page login-split">
      <section className="login-intro" aria-label={branding.name}>
        <Link href="/login" className="brand">
          {branding.logo
            ? <img src={branding.logo} alt={branding.name} style={{ height: 38, width: 38, objectFit: 'contain', borderRadius: 10 }} />
            : <Zap fill="currentColor" />}
          <span className="login-brand-name">{branding.name}</span>
        </Link>
        <div className="login-intro-copy">
          <span className="login-eyebrow"><ShieldCheck size={14} /> SUA PLATAFORMA, DO SEU JEITO</span>
          <h2>Conecte.<br />Personalize.<br />Simplifique.</h2>
          <p>Acesse suas conexões e defina o nome e as cores da sua plataforma em poucos passos.</p>
          <div className="login-feature-pills">
            <span className="feature-pill"><Check size={13} /> Conexões</span>
            <span className="feature-pill"><Check size={13} /> Plataforma</span>
            <span className="feature-pill"><Check size={13} /> Configurações</span>
          </div>
        </div>
        <div className="login-platform">
          <Activity size={20} />
          <div>
            <span>{demo ? 'Ambiente de demonstração' : 'Seu espaço de trabalho'}</span>
            <small>{demo ? 'Dados de trading simulados' : 'Entre para gerenciar sua plataforma'}</small>
          </div>
        </div>
      </section>
      <div className="login-main">
        <LoginFields invite={invite} demo={demo} branding={branding} form={form} />
      </div>
    </main>
  );
}


// Administrative authentication is independent of the prototype's branding.
export default function LoginForm({ invite, demo = false }: { invite?: string; demo?: boolean }) {
  const branding: Branding = { name: 'Gotrade', color: '#96d600', logo: '', loginTemplate: 'split' };
  return <TemplateSplit invite={invite} demo={demo} branding={branding} />;
}

'use client';
import { useState } from 'react';
import { Plug, Settings } from 'lucide-react';
import { providers, type PlatformSettings } from '@/lib/model';
export default function AdminSettings({
  settings,
  busy,
  onSave,
}: {
  settings?: PlatformSettings;
  busy: boolean;
  onSave: (value: unknown) => Promise<boolean>;
}) {
  const [enabled, setEnabled] = useState(
      settings?.enabledProviders || providers,
    ),
    [support, setSupport] = useState(settings?.supportEmail || ''),
    [plan, setPlan] = useState(settings?.defaultPlan || 'Essencial mensal');
  return (
    <form
      className="gt-settings-grid gt-admin-settings"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({
          enabledProviders: enabled,
          supportEmail: support,
          defaultPlan: plan,
        });
      }}
    >
      <section className="gt-card gt-editor">
        <h2>
          <Plug size={20} />
          Conexões disponíveis
        </h2>
        <p className="gt-muted">
          Defina os meios de conexão que podem ser habilitados para os tenants.
        </p>
        {providers.map((p) => (
          <label className="gt-setting-toggle" key={p} aria-label={p}>
            <span>
              <strong>{p}</strong>
              <small>
                {enabled.includes(p)
                  ? 'Disponível no catálogo'
                  : 'Indisponível para novas habilitações'}
              </small>
            </span>
            <input
              type="checkbox"
              checked={enabled.includes(p)}
              onChange={(e) =>
                setEnabled(
                  e.target.checked
                    ? [...enabled, p]
                    : enabled.filter((x) => x !== p),
                )
              }
            />
          </label>
        ))}
        <p className="gt-muted">
          As configurações existentes são preservadas. Desativar remove o meio
          do catálogo do tenant.
        </p>
      </section>
      <section className="gt-card gt-editor gt-form">
        <h2>
          <Settings size={20} />
          Preferências administrativas
        </h2>
        <label>
          E-mail de suporte
          <input
            type="email"
            value={support}
            onChange={(e) => setSupport(e.target.value)}
            placeholder="suporte@empresa.com"
          />
        </label>
        <label>
          Plano sugerido
          <input
            required
            maxLength={80}
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          />
        </label>
        <p className="gt-muted">
          O plano será sugerido ao criar registros demonstrativos de pagamento.
        </p>
        <button className="gt-button gt-primary" disabled={busy}>
          Salvar configurações
        </button>
      </section>
    </form>
  );
}

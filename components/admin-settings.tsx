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
    [telegram, setTelegram] = useState(settings?.telegramUrl || ''),
    [price, setPrice] = useState((settings?.tenantPriceCents || 300000) / 100);
  return (
    <form
      className="gt-admin-settings gt-form"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({
          enabledProviders: enabled,
          supportEmail: support,
          telegramUrl: telegram,
          tenantPriceCents: Math.round(price * 100),
        });
      }}
    >
      <section className="gt-card gt-editor">
        <h2>
          <Plug size={20} />
          Configuração de conexões
        </h2>
        <p className="gt-muted">
          Escolha os meios que podem ser liberados para os tenants.
        </p>
        <div className="gt-catalog-grid">
          {providers.map((p) => (
            <label className="gt-setting-toggle" key={p} aria-label={p}>
              <span>
                <strong>{p}</strong>
                <small>
                  {enabled.includes(p)
                    ? 'Disponível no catálogo'
                    : 'Desativada no catálogo'}
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
        </div>
      </section>
      <section className="gt-card gt-editor gt-form">
        <h2>
          <Settings size={20} />
          Preferências administrativas
        </h2>
        <div className="gt-platform-fields">
          <label>
            Valor para ser tenant (R$)
            <input
              required
              type="number"
              min="0.01"
              max="1000000"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </label>
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
            Suporte Telegram
            <input
              type="url"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="https://t.me/seu_suporte"
            />
          </label>
        </div>
        <p className="gt-muted">
          Novos links de contratação usam este valor. Links já gerados preservam
          o preço.
        </p>
        <button className="gt-button gt-primary" disabled={busy}>
          Salvar configurações
        </button>
      </section>
    </form>
  );
}

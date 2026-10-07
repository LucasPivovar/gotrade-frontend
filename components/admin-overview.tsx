'use client';
import { ArrowUpRight, Globe, Palette, Plug, Plus } from 'lucide-react';
import type { Tenant } from '@/lib/model';

export default function AdminOverview({
  tenants,
  onOpen,
  onConnections,
  onCreate,
}: {
  tenants: Tenant[];
  onOpen: (tenant: Tenant) => void;
  onConnections: (tenant: Tenant) => void;
  onCreate: () => void;
}) {
  const pending = tenants.filter(
    (t) => !t.domain || !t.logo || !t.connections.length,
  );
  const recent = [...tenants]
    .sort((a, b) => b.created.localeCompare(a.created))
    .slice(0, 3);
  const connections = Array.from(new Set(tenants.flatMap((t) => t.connections)))
    .map((name) => ({
      name,
      count: tenants.filter((t) => t.connections.includes(name)).length,
    }))
    .sort((a, b) => b.count - a.count);
  return (
    <div className="gt-admin-panels">
      <section className="gt-card gt-admin-section">
        <div className="gt-admin-section-heading">
          <h2>Configuração das plataformas</h2>
          <Palette size={19} />
        </div>
        <p className="gt-muted">
          Acompanhe o que cada responsável já configurou.
        </p>
        <div className="gt-admin-progress">
          {[
            [
              Globe,
              'Domínio cadastrado',
              tenants.filter((t) => t.domain).length,
            ],
            [Palette, 'Logo adicionada', tenants.filter((t) => t.logo).length],
            [
              Plug,
              'Conexões habilitadas',
              tenants.filter((t) => t.connections.length).length,
            ],
          ].map(([Icon, label, count]) => {
            const MetricIcon = Icon as typeof Globe;
            return (
              <div key={String(label)}>
                <div>
                  <span>
                    <MetricIcon size={15} />
                    {String(label)}
                  </span>
                  <strong>
                    {Number(count)} / {tenants.length}
                  </strong>
                </div>
                <progress
                  value={Number(count)}
                  max={Math.max(1, tenants.length)}
                  aria-label={String(label)}
                />
              </div>
            );
          })}
        </div>
        <p className="gt-admin-caption">
          O domínio indica cadastro; o apontamento ainda não é validado.
        </p>
      </section>
      <section className="gt-card gt-admin-section">
        <div className="gt-admin-section-heading">
          <h2>Próximos ajustes</h2>
          <span className="gt-admin-count">{pending.length}</span>
        </div>
        <p className="gt-muted">Atalhos para completar a configuração.</p>
        {pending.slice(0, 3).map((t) => (
          <button
            className="gt-admin-shortcut"
            key={t.id}
            onClick={() =>
              !t.connections.length ? onConnections(t) : onOpen(t)
            }
          >
            <span>
              <strong>{t.name}</strong>
              <small>
                {[
                  !t.domain && 'Domínio',
                  !t.logo && 'Logo',
                  !t.connections.length && 'Conexões',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </small>
            </span>
            <ArrowUpRight size={17} />
          </button>
        ))}
        {!pending.length && (
          <div className="gt-admin-placeholder">
            {tenants.length
              ? 'As plataformas têm domínio, logo e conexões cadastrados.'
              : 'Cadastre o primeiro tenant para acompanhar os ajustes por aqui.'}
          </div>
        )}
      </section>
      <section className="gt-card gt-admin-section">
        <div className="gt-admin-section-heading">
          <h2>Conexões por plataforma</h2>
          <Plug size={19} />
        </div>
        <p className="gt-muted">Veja quais integrações estão habilitadas.</p>
        {connections.slice(0, 5).map((c) => (
          <div className="gt-admin-provider" key={c.name}>
            <span>{c.name}</span>
            <strong>
              {c.count} {c.count === 1 ? 'plataforma' : 'plataformas'}
            </strong>
          </div>
        ))}
        {!connections.length && (
          <div className="gt-admin-placeholder">
            Nenhuma conexão habilitada. Selecione um tenant para liberar as
            integrações.
          </div>
        )}
      </section>
      <section className="gt-card gt-admin-section gt-admin-recent">
        <div className="gt-admin-section-heading">
          <h2>Plataformas recentes</h2>
          <button className="gt-button" onClick={onCreate}>
            <Plus size={16} />
            Cadastrar tenant
          </button>
        </div>
        {recent.length ? (
          <div className="gt-admin-recent-grid">
            {recent.map((t) => (
              <button
                className="gt-admin-shortcut"
                key={t.id}
                onClick={() => onOpen(t)}
              >
                <span>
                  <strong>{t.name}</strong>
                  <small>
                    {t.admin || t.email} ·{' '}
                    {new Date(t.created).toLocaleDateString('pt-BR')}
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </button>
            ))}
          </div>
        ) : (
          <p className="gt-muted">
            Cada tenant recebe uma plataforma ao ser cadastrado. Comece pelo
            nome e pelo responsável.
          </p>
        )}
      </section>
    </div>
  );
}

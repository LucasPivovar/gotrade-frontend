'use client';
import { useState } from 'react';
import {
  MoreHorizontal,
  ArrowUpRight,
  Users,
  Globe,
  Plug,
  CreditCard,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Tenant, BillingRecord } from '@/lib/model';
import { billingStatus } from '@/lib/billing';
const money = (n: number) =>
  (n / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export default function TenantDirectory({
  tenants,
  records,
  catalog,
  busy,
  onSave,
}: {
  tenants: Tenant[];
  records: BillingRecord[];
  catalog: string[];
  busy: boolean;
  onSave: (t: Tenant) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<Tenant | null>(null),
    [tab, setTab] = useState('overview'),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false);
  const actual = tenants.find((t) => t.id === selected?.id) || selected;
  const payments = records
    .filter((r) => r.tenantId === selected?.id)
    .sort((a, b) => b.due.localeCompare(a.due));
  const save = async () => {
    setSaved(false);
    if (selected && (await onSave(selected))) {
      setError('');
      setSaved(true);
    } else
      setError('Não foi possível salvar. Confira os dados e tente novamente.');
  };
  return (
    <>
      <div className="gt-tenant-list">
        {tenants.map((t) => (
          <article className="gt-tenant-row" key={t.id}>
            <span
              className="gt-avatar"
              style={{ background: t.color, color: '#fff' }}
            >
              {t.logo ? (
                <img src={t.logo} alt="" />
              ) : (
                t.name.slice(0, 2).toUpperCase()
              )}
            </span>
            <div className="gt-tenant-info">
              <h2>{t.name}</h2>
              <p>
                {t.admin} · {t.email}
              </p>
              <div className="gt-tenant-meta">
                <span>{t.domain || 'Domínio não cadastrado'}</span>
                <span>{t.connections.length} conexões</span>
              </div>
            </div>
            <span
              className={`gt-status ${t.status === 'active' ? 'is-active' : ''}`}
            >
              {t.status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
            <button
              className="gt-icon-button"
              aria-label={`Opções de ${t.name}`}
              onClick={() => {
                setSelected({ ...t, connections: [...t.connections] });
                setTab('overview');
                setError('');
                setSaved(false);
              }}
            >
              <MoreHorizontal size={22} />
            </button>
          </article>
        ))}
      </div>
      {!tenants.length && (
        <div className="gt-admin-placeholder">Nenhum tenant nesta seleção.</div>
      )}
      <Dialog
        open={!!selected}
        onOpenChange={(v) => {
          if (!v && !busy) setSelected(null);
        }}
      >
        <DialogContent className="gt-dialog gt-tenant-modal">
          <DialogHeader>
            <DialogTitle>{actual?.name}</DialogTitle>
            <DialogDescription>
              Informações da plataforma e gestão do tenant.
            </DialogDescription>
          </DialogHeader>
          <div className="gt-modal-tabs">
            {[
              ['overview', 'Visão geral'],
              ['payments', 'Pagamentos'],
              ['access', 'Acesso e conexões'],
            ].map(([id, label]) => (
              <button
                key={id}
                className={`gt-button ${tab === id ? 'gt-primary' : ''}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {selected && actual && (
            <>
              {tab === 'overview' && (
                <>
                  <div className="gt-admin-overview gt-360-metrics">
                    <div className="gt-admin-metric">
                      <Users size={20} />
                      <span>Clientes</span>
                      <strong>{actual.clientCount ?? '—'}</strong>
                    </div>
                    <div className="gt-admin-metric">
                      <CreditCard size={20} />
                      <span>Pagamentos registrados</span>
                      <strong>{payments.length}</strong>
                    </div>
                  </div>
                  <dl className="gt-detail-list">
                    <dt>Plataforma</dt>
                    <dd>{actual.name}</dd>
                    <dt>Responsável</dt>
                    <dd>{actual.admin}</dd>
                    <dt>E-mail</dt>
                    <dd>{actual.email}</dd>
                    <dt>
                      <Globe size={15} /> Domínio
                    </dt>
                    <dd>{actual.domain || 'Não cadastrado'}</dd>
                    <dt>
                      <Plug size={15} /> Conexões
                    </dt>
                    <dd>
                      {actual.connections.join(', ') || 'Nenhuma habilitada'}
                    </dd>
                    <dt>Cadastro</dt>
                    <dd>
                      {new Date(actual.created).toLocaleDateString('pt-BR')}
                    </dd>
                    <dt>Status</dt>
                    <dd>{actual.status === 'active' ? 'Ativo' : 'Inativo'}</dd>
                  </dl>
                  <a
                    className="gt-button"
                    target="_blank"
                    rel="noreferrer"
                    href={`/prototipo/app?tenant=${actual.id}`}
                  >
                    Abrir plataforma
                    <ArrowUpRight size={16} />
                  </a>
                  {actual.clientCount !== undefined && (
                    <small className="gt-muted">
                      Quantidade de clientes fictícia nesta amostra.
                    </small>
                  )}
                </>
              )}
              {tab === 'payments' && (
                <>
                  <div className="gt-order-total">
                    <span>Total registrado como pago</span>
                    <strong>
                      {money(
                        payments
                          .filter((r) => r.status === 'paid')
                          .reduce((n, r) => n + r.amountCents, 0),
                      )}
                    </strong>
                  </div>
                  <div className="gt-table-scroll">
                    <table className="gt-management-table">
                      <thead>
                        <tr>
                          <th>Plano</th>
                          <th>Valor</th>
                          <th>Vencimento</th>
                          <th>Situação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((r) => (
                          <tr key={r.id}>
                            <td>{r.plan}</td>
                            <td>{money(r.amountCents)}</td>
                            <td>
                              {new Date(r.due + 'T12:00:00').toLocaleDateString(
                                'pt-BR',
                              )}
                            </td>
                            <td>
                              {
                                {
                                  paid: 'Pago',
                                  pending: 'Pendente',
                                  overdue: 'Atrasado',
                                  canceled: 'Cancelado',
                                }[
                                  billingStatus(
                                    r,
                                    new Date().toLocaleDateString('en-CA'),
                                  )
                                ]
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!payments.length && (
                    <p className="gt-admin-placeholder">
                      Nenhum pagamento registrado para este tenant.
                    </p>
                  )}
                </>
              )}
              {tab === 'access' && (
                <form
                  className="gt-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void save();
                  }}
                >
                  <label>
                    Nome do responsável
                    <input
                      required
                      maxLength={100}
                      value={selected.admin}
                      onChange={(e) =>
                        setSelected({ ...selected, admin: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    E-mail do responsável
                    <input
                      required
                      type="email"
                      readOnly
                      value={selected.email}
                    />
                  </label>
                  <label>
                    Status do tenant
                    <select
                      value={selected.status}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          status: e.target.value as Tenant['status'],
                        })
                      }
                    >
                      <option value="active">Ativo</option>
                      <option value="suspended">Inativo</option>
                    </select>
                  </label>
                  <label>
                    Adicionar conexão
                    <select
                      aria-label="Adicionar conexão"
                      value=""
                      onChange={(e) => {
                        if (e.target.value)
                          setSelected({
                            ...selected,
                            connections: [
                              ...selected.connections,
                              e.target.value,
                            ],
                          });
                      }}
                    >
                      <option value="">Selecione um meio disponível</option>
                      {catalog
                        .filter((p) => !selected.connections.includes(p))
                        .map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="gt-connection-box">
                    {selected.connections.length ? (
                      selected.connections.map((p) => (
                        <label className="gt-connection-chip" key={p}>
                          <input
                            type="checkbox"
                            checked
                            onChange={() =>
                              setSelected({
                                ...selected,
                                connections: selected.connections.filter(
                                  (x) => x !== p,
                                ),
                              })
                            }
                          />
                          {p}
                        </label>
                      ))
                    ) : (
                      <p className="gt-muted">Nenhuma conexão habilitada.</p>
                    )}
                  </div>
                  <p className="gt-muted">
                    Inativar bloqueia o acesso e a abertura da plataforma. As
                    configurações são preservadas.
                  </p>
                  {error && (
                    <p className="gt-form-error" role="alert">
                      {error}
                    </p>
                  )}
                  {saved && (
                    <output className="gt-muted">Alterações salvas.</output>
                  )}
                  <button className="gt-button gt-primary" disabled={busy}>
                    Salvar tenant
                  </button>
                </form>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

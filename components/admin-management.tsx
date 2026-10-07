'use client';
import { useState } from 'react';
import { Plus, Search, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Tenant, BillingRecord } from '@/lib/model';
import { billingStatus } from '@/lib/billing';
const money = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const labels = {
  pending: 'Pendente',
  paid: 'Pago',
  canceled: 'Cancelado',
  overdue: 'Atrasado',
};
export function AdminPayments({
  tenants,
  records,
  busy,
  onSave,
  defaultPlan,
}: {
  tenants: Tenant[];
  records: BillingRecord[];
  defaultPlan?: string;
  busy: boolean;
  onSave: (value: BillingRecord) => Promise<boolean>;
}) {
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [editing, setEditing] = useState<BillingRecord | null>(null);
  const today = new Date().toLocaleDateString('en-CA');
  const filtered = records.filter(
    (r) =>
      `${tenants.find((t) => t.id === r.tenantId)?.name || ''} ${r.plan}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === 'all' || billingStatus(r, today) === filter),
  );
  const create = () =>
    setEditing({
      id: crypto.randomUUID(),
      tenantId: tenants[0]?.id || '',
      plan: defaultPlan || 'Essencial mensal',
      amountCents: 9900,
      due: new Date().toISOString().slice(0, 10),
      status: 'pending',
    });
  return (
    <>
      <div className="gt-billing-notice">
        <CreditCard size={19} />
        <span>
          <strong>Pagamentos demonstrativos</strong> Registros manuais para
          visualizar a gestão. Nenhuma cobrança é enviada ou processada.
        </span>
      </div>
      <div className="gt-admin-overview">
        {(['paid', 'pending', 'overdue', 'canceled'] as const).map((status) => (
          <div key={status} className="gt-admin-metric">
            <CreditCard size={20} />
            <span>{labels[status]}</span>
            <strong>
              {money(
                records
                  .filter((r) => billingStatus(r, today) === status)
                  .reduce((sum, r) => sum + r.amountCents, 0),
              )}
            </strong>
          </div>
        ))}
      </div>
      <section className="gt-card gt-management">
        <div className="gt-management-heading">
          <div>
            <h2>Pagamentos dos tenants</h2>
            <p>Plano, valor e vencimento vinculados à plataforma.</p>
          </div>
          <button
            className="gt-button gt-primary"
            disabled={!tenants.length}
            onClick={create}
          >
            <Plus size={16} />
            Novo registro
          </button>
        </div>
        <div className="gt-management-toolbar">
          <label className="gt-search">
            <Search size={17} />
            <input
              aria-label="Buscar pagamentos"
              placeholder="Plataforma ou plano"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Filtrar pagamentos"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos os status</option>
            {Object.entries(labels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="gt-table-scroll">
          <table className="gt-management-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Plano</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Situação</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const status = billingStatus(r, today);
                return (
                  <tr key={r.id}>
                    <td>
                      {tenants.find((t) => t.id === r.tenantId)?.name ||
                        'Tenant indisponível'}
                    </td>
                    <td>{r.plan}</td>
                    <td>{money(r.amountCents)}</td>
                    <td>
                      {new Date(r.due + 'T12:00:00').toLocaleDateString(
                        'pt-BR',
                      )}
                    </td>
                    <td>
                      <span
                        className={`gt-status ${status === 'paid' ? 'is-active' : status === 'overdue' ? 'gt-payment-overdue' : ''}`}
                      >
                        {labels[status]}
                      </span>
                    </td>
                    <td>
                      <button
                        className="gt-button"
                        onClick={() => setEditing({ ...r })}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <div className="gt-admin-placeholder">
            {!tenants.length
              ? 'Cadastre um tenant antes de adicionar pagamentos.'
              : 'Nenhum registro nesta seleção. Adicione um pagamento demonstrativo para começar.'}
          </div>
        )}
      </section>
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open && !busy) setEditing(null);
        }}
      >
        <DialogContent className="gt-dialog">
          <DialogHeader>
            <DialogTitle>Registro de pagamento</DialogTitle>
            <DialogDescription>
              Informações demonstrativas, sem cobrança real.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="gt-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await onSave(editing)) setEditing(null);
              }}
            >
              <label>
                Tenant
                <select
                  required
                  aria-label="Tenant"
                  value={editing.tenantId}
                  disabled={records.some((r) => r.id === editing.id)}
                  onChange={(e) =>
                    setEditing({ ...editing, tenantId: e.target.value })
                  }
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Plano
                <input
                  required
                  maxLength={80}
                  value={editing.plan}
                  onChange={(e) =>
                    setEditing({ ...editing, plan: e.target.value })
                  }
                />
              </label>
              <label>
                Valor (R$)
                <input
                  required
                  type="number"
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  value={editing.amountCents / 100}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      amountCents: Math.round(Number(e.target.value) * 100),
                    })
                  }
                />
              </label>
              <label>
                Vencimento
                <input
                  required
                  type="date"
                  value={editing.due}
                  onChange={(e) =>
                    setEditing({ ...editing, due: e.target.value })
                  }
                />
              </label>
              <label>
                Situação
                <select
                  aria-label="Situação"
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      status: e.target.value as BillingRecord['status'],
                    })
                  }
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="canceled">Cancelado</option>
                </select>
              </label>
              <div className="gt-form-actions">
                <button
                  type="button"
                  className="gt-button"
                  disabled={busy}
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </button>
                <button className="gt-button gt-primary" disabled={busy}>
                  Salvar registro
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

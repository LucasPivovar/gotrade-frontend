'use client';
import { useState } from 'react';
import { CircleCheck, Clock, CircleAlert, ReceiptText } from 'lucide-react';
import type { BillingRecord } from '@/lib/model';
import { billingStatus } from '@/lib/billing';

const money = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const labels = {
  paid: 'Pago',
  pending: 'Pendente',
  overdue: 'Atrasado',
  canceled: 'Cancelado',
};

export default function TenantFinance({
  records,
}: {
  records: BillingRecord[];
}) {
  const [filter, setFilter] = useState('all');
  const today = new Date().toLocaleDateString('en-CA');
  const sorted = [...records].sort((a, b) => b.due.localeCompare(a.due));
  const filtered = sorted.filter(
    (r) => filter === 'all' || billingStatus(r, today) === filter,
  );
  return (
    <>
      <div className="gt-admin-overview">
        {(
          [
            ['paid', CircleCheck],
            ['pending', Clock],
            ['overdue', CircleAlert],
            ['canceled', ReceiptText],
          ] as const
        ).map(([status, Icon]) => (
          <div className="gt-admin-metric" key={status}>
            <Icon size={20} />
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
            <h2>Meus pagamentos</h2>
            <p className="gt-muted">
              Histórico de pagamentos da sua plataforma à GoTrade.
            </p>
          </div>
          <select
            aria-label="Filtrar pagamentos"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            {Object.entries(labels).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="gt-table-scroll">
          <table className="gt-management-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const status = billingStatus(r, today);
                return (
                  <tr key={r.id}>
                    <td>{r.plan}</td>
                    <td>{money(r.amountCents)}</td>
                    <td>
                      {new Date(r.due + 'T12:00:00').toLocaleDateString(
                        'pt-BR',
                      )}
                    </td>
                    <td>
                      <span
                        className={`gt-status ${status === 'paid' ? 'is-active' : ''}`}
                      >
                        {labels[status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <p className="gt-admin-placeholder">
            {records.length
              ? 'Nenhum pagamento nesta seleção.'
              : 'Você ainda não tem pagamentos registrados.'}
          </p>
        )}
      </section>
    </>
  );
}

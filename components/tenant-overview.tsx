import { ArrowUpRight, Globe, Palette, Plug, CreditCard } from 'lucide-react';
import type { Tenant, BillingRecord } from '@/lib/model';
import { billingStatus } from '@/lib/billing';
export default function TenantOverview({
  tenant,
  records,
  onPayments,
}: {
  tenant: Tenant;
  records: BillingRecord[];
  onPayments: () => void;
}) {
  return (
    <div className="gt-settings-grid">
      <section className="gt-card gt-editor">
        <h2>Acompanhamento de {tenant.name}</h2>
        <p className="gt-muted">Configuração e situação da operação.</p>
        {[
          [Globe, 'Domínio', tenant.domain || 'Não cadastrado'],
          [Palette, 'Logo', tenant.logo ? 'Adicionada' : 'Não adicionada'],
          [
            Plug,
            'Conexões',
            tenant.connections.join(', ') || 'Nenhuma habilitada',
          ],
        ].map(([Icon, label, value]) => {
          const I = Icon as typeof Globe;
          return (
            <div className="gt-admin-provider" key={String(label)}>
              <span>
                <I size={16} /> {String(label)}
              </span>
              <strong>{String(value)}</strong>
            </div>
          );
        })}
        <a
          className="gt-button"
          target="_blank"
          rel="noreferrer"
          href={`/prototipo/app?tenant=${tenant.id}`}
        >
          Abrir plataforma
          <ArrowUpRight size={16} />
        </a>
      </section>
      <section className="gt-card gt-editor">
        <h2>
          <CreditCard size={20} />
          Histórico de pagamentos
        </h2>
        <p className="gt-muted">
          Registros demonstrativos associados a este tenant.
        </p>
        {records
          .slice()
          .sort((a, b) => b.due.localeCompare(a.due))
          .slice(0, 4)
          .map((r) => (
            <div className="gt-admin-provider" key={r.id}>
              <span>
                {r.plan}
                <small>
                  {new Date(r.due + 'T12:00:00').toLocaleDateString('pt-BR')}
                </small>
              </span>
              <strong>
                {(r.amountCents / 100).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
                <small>
                  {
                    {
                      paid: 'Pago',
                      pending: 'Pendente',
                      overdue: 'Atrasado',
                      canceled: 'Cancelado',
                    }[billingStatus(r, new Date().toLocaleDateString('en-CA'))]
                  }
                </small>
              </strong>
            </div>
          ))}
        {!records.length && (
          <p className="gt-admin-placeholder">Nenhum pagamento registrado.</p>
        )}
        <button className="gt-button" onClick={onPayments}>
          Ver histórico completo
        </button>
      </section>
    </div>
  );
}

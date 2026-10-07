import type { State } from './model';
import { createApplication } from './application';
export function addDemoData(state: State) {
  if (state.demoVersion === 1) return state;
  const names = [
    'Aurora Trade',
    'Nexus Invest',
    'Atlas Capital',
    'Pulse Trading',
  ];
  names.forEach((name, i) => {
    const t = createApplication(
      {
        name,
        color: ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899'][i],
        secondaryColor: '#ffffff',
      },
      state.tenants,
    );
    t.id = `10000000-0000-4000-8000-00000000000${i + 2}`;
    t.admin = ['Marina Costa', 'Rafael Lima', 'Ana Martins', 'Lucas Silva'][i];
    t.email = `${['aurora', 'nexus', 'atlas', 'pulse'][i]}@example.com`;
    t.domain =
      i === 3 ? '' : `${['aurora', 'nexus', 'atlas', 'pulse'][i]}.example.com`;
    t.connections = i === 3 ? [] : i === 0 ? ['Bybit', 'XGlobal'] : ['Admiral'];
    t.status = i === 2 ? 'suspended' : 'active';
    t.created = new Date(Date.now() - (i + 1) * 86400000 * 7).toISOString();
    state.tenants.push(t);
    const due = new Date(Date.now() + (i === 1 ? -7 : 7) * 86400000)
      .toISOString()
      .slice(0, 10);
    state.billing = [
      ...(state.billing || []),
      {
        id: `30000000-0000-4000-8000-00000000000${i + 1}`,
        tenantId: t.id,
        plan: i === 0 ? 'Pro mensal' : 'Essencial mensal',
        amountCents: i === 0 ? 19900 : 9900,
        due,
        status: i === 0 ? 'paid' : i === 2 ? 'canceled' : 'pending',
      },
    ];
  });
  state.demoVersion = 1;
  return state;
}

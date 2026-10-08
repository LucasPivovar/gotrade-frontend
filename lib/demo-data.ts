import type { State } from './model';
import { createApplication } from './application';
export function addDemoData(state: State) {
  if (state.demoVersion === 4) return state;
  const names = [
    'Aurora Trade',
    'Nexus Invest',
    'Atlas Capital',
    'Pulse Trading',
  ];
  if (!state.demoVersion)
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
      t.admin = ['Marina Costa', 'Rafael Lima', 'Ana Martins', 'Lucas Silva'][
        i
      ];
      t.email = `${['aurora', 'nexus', 'atlas', 'pulse'][i]}@example.com`;
      t.domain =
        i === 3
          ? ''
          : `${['aurora', 'nexus', 'atlas', 'pulse'][i]}.example.com`;
      t.connections =
        i === 3 ? [] : i === 0 ? ['Bybit', 'XGlobal'] : ['Admiral'];
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
  state.tenants.forEach((t, i) => {
    if (t.id.startsWith('10000000-'))
      t.clientCount = [128, 84, 52, 31, 16][i] ?? 0;
  });
  const primary = state.tenants.find(
    (t) => t.id === '10000000-0000-4000-8000-000000000001',
  );
  if (
    primary &&
    ['TradingPro', 'Gotrade', 'GoTrade'].includes(primary.name) &&
    ['#237a4b', '#96d600'].includes(primary.color.toLowerCase())
  ) {
    primary.name = 'GoTrade';
    primary.color = '#4fbb83';
  }
  if (primary) {
    state.billing ||= [];
    for (const [i, status] of (
      ['paid', 'paid', 'pending'] as const
    ).entries()) {
      const id = '30000000-0000-4000-8000-00000000000' + (i + 5);
      if (!state.billing.some((r) => r.id === id))
        state.billing.push({
          id,
          tenantId: primary.id,
          plan: 'Licença GoTrade',
          amountCents: 19900,
          due: new Date(Date.now() + (i === 2 ? 7 : -(i + 1) * 30) * 86400000)
            .toISOString()
            .slice(0, 10),
          status,
        });
    }
  }
  const sample = state.tenants.find(
    (t) => t.id === '10000000-0000-4000-8000-000000000002',
  );
  state.tickets = state.tickets || [];
  for (const [i, t] of [primary, sample].entries())
    if (
      t &&
      !state.tickets.some(
        (x) => x.id === '40000000-0000-4000-8000-00000000000' + (i + 1),
      )
    )
      state.tickets.push({
        id: '40000000-0000-4000-8000-00000000000' + (i + 1),
        tenantId: t.id,
        subject: i ? 'Dúvida sobre conexões' : 'Configuração do domínio',
        message: i
          ? 'Como posso liberar mais um meio de conexão?'
          : 'Gostaria de confirmar os próximos passos para usar meu domínio.',
        created: new Date().toISOString(),
        status: i ? 'answered' : 'open',
        replies: i
          ? [
              {
                id: '50000000-0000-4000-8000-000000000001',
                message:
                  'Você pode escolher os meios liberados em Conexões. Se precisar de outro, solicite à equipe.',
                created: new Date().toISOString(),
                emailStatus: 'pending',
              },
            ]
          : [],
      });
  state.demoVersion = 4;
  return state;
}

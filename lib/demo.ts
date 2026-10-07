export const demoEnabled = () =>
  process.env.DEMO_MODE === 'true' && process.env.VERCEL_ENV !== 'production';

// Public prototype credentials. Never use this mode with real customer data.
export const demoAccounts = [
  {
    id: 'demo-admin',
    email: 'admin@tradingpro.io',
    password: 'DemoAdmin2026!',
  },
  {
    id: 'demo-tenant',
    email: 'tenant@tradingpro.io',
    password: 'DemoTenant2026!',
  },
];

export const demoEnabled = () => process.env.DEMO_MODE === 'true';

// Public prototype credentials. Never use this mode with real customer data.
export const demoAccounts = [
  {
    id: 'demo-admin',
    email: 'admin@gmail.com',
    password: 'admin123',
  },
  {
    id: 'demo-tenant',
    email: 'tenant@gmail.com',
    password: 'tenant123',
  },
];

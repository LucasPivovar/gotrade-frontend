'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Building2, ShieldCheck } from './icons';

export default function DemoSwitcher() {
  const path = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (path === '/login' || path.startsWith('/prototipo') || path.startsWith('/app/')) return null;
  async function switchRole(role: 'tenant' | 'admin') {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/demo/role', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw Error('Não foi possível trocar o perfil.');
      window.location.assign('/');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return <aside className="demo-switcher" aria-label="Perfil de demonstração">
    <small>DEMONSTRAÇÃO</small>
    <div>
      <button disabled={busy} onClick={() => void switchRole('tenant')}><Building2 size={15} />Tenant</button>
      <button disabled={busy} onClick={() => void switchRole('admin')}><ShieldCheck size={15} />Super admin</button>
    </div>
    {error && <p role="alert">{error}</p>}
  </aside>;
}

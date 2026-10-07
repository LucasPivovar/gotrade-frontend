'use client';
import { useState } from 'react';
import { Mail, Copy, Check } from './icons';
export default function AccountInvite({ tenantId }: { tenantId: string }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div className="account-invite">
      <h3>Convite para o responsável</h3>
      <p>Convite válido por 24 horas para criar uma senha.</p>
      <button
        type="button"
        className="gt-button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          setCopied(false);
          try {
            const r = await fetch('/api/auth/invite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tenantId }),
            });
            const data = await r.json();
            if (!r.ok) throw Error(data.error);
            setUrl(new URL(data.url, location.origin).href);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Mail size={16} />
        {busy ? 'Gerando…' : 'Gerar convite'}
      </button>
      {url && (
        <div className="invite-link">
          <input aria-label="Link de ativação" readOnly value={url} />
          <button
            type="button"
            title="Copiar convite"
            aria-label="Copiar convite"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
              } catch {
                setError('Selecione o link para copiar.');
              }
            }}
          >
            {copied ? <Check size={17} /> : <Copy size={17} />}
          </button>
        </div>
      )}
      {error && <output>{error}</output>}
    </div>
  );
}

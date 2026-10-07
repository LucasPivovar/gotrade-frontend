'use client';
import { useState } from 'react';
import { Copy, Check, ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { PurchaseLink } from '@/lib/model';
export default function PurchaseLinkModal({
  open,
  onClose,
  busy,
  link,
  amountCents,
  onGenerate,
  demoSample = false,
}: {
  open: boolean;
  onClose: () => void;
  busy: boolean;
  link?: PurchaseLink;
  amountCents: number;
  onGenerate: () => Promise<boolean>;
  demoSample?: boolean;
}) {
  const [copied, setCopied] = useState(false),
    [error, setError] = useState('');
  const url =
    link && typeof window !== 'undefined'
      ? `${location.origin}/contratar/${link.id}${demoSample ? '?valor=' + link.amountCents : ''}`
      : '';
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent className="gt-dialog">
        <DialogHeader>
          <DialogTitle>Link para novo tenant</DialogTitle>
          <DialogDescription>
            Envie a página de contratação. O comprador informa seus dados e o
            nome da plataforma.
          </DialogDescription>
        </DialogHeader>
        <div className="gt-order-total">
          <span>Valor da contratação</span>
          <strong>
            {((link?.amountCents || amountCents) / 100).toLocaleString(
              'pt-BR',
              { style: 'currency', currency: 'BRL' },
            )}
          </strong>
        </div>
        <p className="gt-muted">
          O pagamento e a criação automática do acesso serão conectados ao
          backend.
        </p>
        {url ? (
          <>
            <label className="gt-form">
              Link da contratação
              <input aria-label="Link da contratação" readOnly value={url} />
            </label>
            <div className="gt-form-actions">
              <button
                className="gt-button gt-primary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                  } catch {
                    setError('Selecione o link para copiar.');
                  }
                }}
              >
                {copied ? <Check size={17} /> : <Copy size={17} />}{' '}
                {copied ? 'Copiado' : 'Copiar link'}
              </button>
              <a
                href={url}
                className="gt-button"
                target="_blank"
                rel="noreferrer"
              >
                Abrir página
                <ArrowUpRight size={16} />
              </a>
            </div>
          </>
        ) : (
          <button
            className="gt-button gt-primary"
            disabled={busy}
            onClick={async () => {
              setCopied(false);
              if (!(await onGenerate()))
                setError('Não foi possível gerar o link.');
            }}
          >
            Gerar link de contratação
          </button>
        )}
        {error && (
          <p className="gt-form-error" role="alert">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

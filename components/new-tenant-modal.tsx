'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ConnectionPicker from '@/components/connection-picker';
import { createApplication } from '@/lib/application';
import { validateTenant, type Tenant } from '@/lib/model';
export default function NewTenantModal({
  open,
  onClose,
  busy,
  tenants,
  catalog,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  busy: boolean;
  tenants: Tenant[];
  catalog: string[];
  onSave: (tenant: Tenant) => Promise<boolean>;
}) {
  const [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [connections, setConnections] = useState<string[]>([]),
    [platform, setPlatform] = useState(''),
    [error, setError] = useState('');
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent className="gt-dialog">
        <DialogHeader>
          <DialogTitle>Novo tenant</DialogTitle>
          <DialogDescription>
            Cadastre o responsável e a plataforma.
          </DialogDescription>
        </DialogHeader>
        <form
          className="gt-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              const tenant = {
                ...createApplication(
                  { name: platform.trim(), color: '#4fbb83' },
                  tenants,
                ),
                connections: connections.filter((p) => catalog.includes(p)),
                admin: name.trim(),
                email: email.trim().toLowerCase(),
              };
              validateTenant(tenant);
              if (await onSave(tenant)) {
                setName('');
                setEmail('');
                setPlatform('');
                setConnections([]);
                onClose();
              } else
                setError(
                  'Não foi possível cadastrar. Confira os dados e se o e-mail já está em uso.',
                );
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : 'Confira os dados do cadastro.',
              );
            }
          }}
        >
          <label>
            Nome
            <input
              required
              maxLength={100}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            E-mail
            <input
              required
              type="email"
              maxLength={200}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Nome da plataforma
            <input
              required
              maxLength={100}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
          </label>
          <ConnectionPicker
            catalog={catalog}
            value={connections}
            onChange={setConnections}
            disabled={busy}
          />
          {error && (
            <p role="alert" className="gt-form-error">
              {error}
            </p>
          )}
          <div className="gt-form-actions">
            <button
              type="button"
              className="gt-button"
              disabled={busy}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button className="gt-button gt-primary" disabled={busy}>
              {busy ? 'Cadastrando…' : 'Criar tenant'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

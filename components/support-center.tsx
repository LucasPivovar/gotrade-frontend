'use client';
import { useState } from 'react';
import { Send, Plus, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SupportTicket, Tenant } from '@/lib/model';
export default function SupportCenter({
  admin,
  tickets,
  tenants,
  telegram,
  busy,
  onSave,
  onDeliver,
}: {
  admin: boolean;
  tickets: SupportTicket[];
  tenants: Tenant[];
  telegram?: string;
  busy: boolean;
  onSave: (action: string, value: unknown) => Promise<boolean>;
  onDeliver: (id: string) => Promise<string>;
}) {
  const [selected, setSelected] = useState<string | null>(null),
    [creating, setCreating] = useState(false),
    [subject, setSubject] = useState(''),
    [message, setMessage] = useState(''),
    [reply, setReply] = useState(''),
    [notice, setNotice] = useState(''),
    [filter, setFilter] = useState('all'),
    [localError, setLocalError] = useState('');
  const ticket = tickets.find((t) => t.id === selected);
  const filtered = tickets.filter(
    (t) => filter === 'all' || t.status === filter,
  );
  return (
    <>
      {!admin && (
        <div className="gt-support-options">
          <section className="gt-card gt-editor">
            <MessageCircle size={26} />
            <h2>Telegram</h2>
            <p className="gt-muted">Converse com a equipe de suporte.</p>
            {telegram ? (
              <a
                href={telegram}
                target="_blank"
                rel="noreferrer"
                className="gt-button gt-primary"
              >
                Abrir Telegram
                <Send size={16} />
              </a>
            ) : (
              <p className="gt-muted">
                O administrador ainda não configurou o canal.
              </p>
            )}
          </section>
          <section className="gt-card gt-editor">
            <h2>Suporte por ticket</h2>
            <p className="gt-muted">
              Registre sua dúvida e acompanhe as respostas.
            </p>
            <button
              className="gt-button gt-primary"
              onClick={() => {
                setCreating(true);
                setLocalError('');
              }}
            >
              <Plus size={16} />
              Novo ticket
            </button>
          </section>
        </div>
      )}
      <section className="gt-card gt-management">
        <div className="gt-management-heading">
          <h2>{admin ? 'Tickets dos tenants' : 'Meus tickets'}</h2>
          <select
            aria-label="Filtrar tickets"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="open">Abertos</option>
            <option value="answered">Respondidos</option>
            <option value="closed">Encerrados</option>
          </select>
        </div>
        {filtered.map((t) => (
          <button
            className="gt-ticket-row"
            key={t.id}
            onClick={() => {
              setSelected(t.id);
              setReply('');
              setNotice('');
              setLocalError('');
            }}
          >
            <span>
              <strong>{t.subject}</strong>
              <small>
                {admin
                  ? `${tenants.find((x) => x.id === t.tenantId)?.name || 'Tenant'} · `
                  : ''}
                {new Date(t.created).toLocaleDateString('pt-BR')}
              </small>
            </span>
            <span className="gt-status">
              {t.status === 'open'
                ? 'Aberto'
                : t.status === 'answered'
                  ? 'Respondido'
                  : 'Encerrado'}
            </span>
          </button>
        ))}
        {!filtered.length && (
          <p className="gt-admin-placeholder">Nenhum ticket nesta seleção.</p>
        )}
      </section>
      <Dialog
        open={creating || !!selected}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setCreating(false);
            setSelected(null);
          }
        }}
      >
        <DialogContent className="gt-dialog gt-tenant-modal">
          <DialogHeader>
            <DialogTitle>
              {creating ? 'Novo ticket' : ticket?.subject}
            </DialogTitle>
          </DialogHeader>
          {creating ? (
            <form
              className="gt-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await onSave('ticket', { subject, message })) {
                  setCreating(false);
                  setSubject('');
                  setMessage('');
                } else
                  setLocalError(
                    'Não foi possível abrir o ticket. Tente novamente.',
                  );
              }}
            >
              <label>
                Assunto
                <input
                  required
                  maxLength={120}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </label>
              <label>
                Mensagem
                <textarea
                  required
                  maxLength={4000}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>
              {localError && (
                <p role="alert" className="gt-form-error">
                  {localError}
                </p>
              )}
              <button className="gt-button gt-primary" disabled={busy}>
                Enviar ticket
              </button>
            </form>
          ) : (
            ticket && (
              <>
                <div className="gt-ticket-message">
                  <strong>Mensagem do tenant</strong>
                  <p>{ticket.message}</p>
                </div>
                {ticket.replies.map((r) => (
                  <div
                    className="gt-ticket-message gt-ticket-answer"
                    key={r.id}
                  >
                    <strong>Equipe GoTrade</strong>
                    <p>{r.message}</p>
                    {admin && (
                      <small>
                        {r.emailStatus === 'sent'
                          ? 'Envio por e-mail aceito'
                          : r.emailStatus === 'failed'
                            ? 'Falha no envio por e-mail'
                            : 'Envio por e-mail pendente'}
                      </small>
                    )}
                  </div>
                ))}
                {admin && ticket.status !== 'closed' && (
                  <form
                    className="gt-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (
                        await onSave('ticketReply', {
                          id: ticket.id,
                          message: reply,
                        })
                      ) {
                        setReply('');
                        setNotice(await onDeliver(ticket.id));
                      } else
                        setLocalError('Não foi possível salvar a resposta.');
                    }}
                  >
                    <label>
                      Responder ticket
                      <textarea
                        required
                        maxLength={4000}
                        rows={4}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                      />
                    </label>
                    <div className="gt-form-actions">
                      <button className="gt-button gt-primary" disabled={busy}>
                        Salvar e encaminhar resposta
                      </button>
                      <button
                        type="button"
                        className="gt-button"
                        disabled={busy}
                        onClick={() =>
                          void onSave('ticketStatus', {
                            id: ticket.id,
                            status: 'closed',
                          })
                        }
                      >
                        Encerrar ticket
                      </button>
                    </div>
                  </form>
                )}
                {admin && ticket.status === 'closed' && (
                  <button
                    className="gt-button"
                    disabled={busy}
                    onClick={() =>
                      void onSave('ticketStatus', {
                        id: ticket.id,
                        status: 'open',
                      })
                    }
                  >
                    Reabrir ticket
                  </button>
                )}
                {notice && <output className="gt-muted">{notice}</output>}
                {localError && (
                  <p role="alert" className="gt-form-error">
                    {localError}
                  </p>
                )}
              </>
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

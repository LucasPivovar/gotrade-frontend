'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check, ShieldCheck, ArrowRight } from 'lucide-react';
export default function EnrollmentCheckout({
  amountCents,
}: {
  amountCents: number;
}) {
  const [review, setReview] = useState(false),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [platform, setPlatform] = useState('');
  return (
    <main className="gt-enrollment">
      <Link href="/login" className="gt-brand">
        <img src="/brand/gotrade-logo.svg" alt="GoTrade" />
      </Link>
      <div className="gt-enrollment-grid">
        <section className="gt-card gt-editor">
          <h1>Sua plataforma começa aqui</h1>
          <p className="gt-muted">
            Um espaço com sua marca, suas conexões e seus clientes.
          </p>
          <ul className="gt-feature-list">
            {[
              'Plataforma com seu nome e suas cores',
              'Domínio próprio e logo personalizada',
              'Conexões e suporte em um só lugar',
            ].map((t) => (
              <li key={t}>
                <Check size={18} />
                {t}
              </li>
            ))}
          </ul>
          <div className="gt-order-total">
            <span>Valor da plataforma</span>
            <strong>
              {(amountCents / 100).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </div>
          <small className="gt-muted">
            Tela de apresentação. O pagamento e o envio do acesso ainda serão
            integrados.
          </small>
        </section>
        <section className="gt-card gt-editor">
          <h2>{review ? 'Revise sua contratação' : 'Seus dados'}</h2>
          {review ? (
            <>
              <dl className="gt-detail-list">
                <dt>Responsável</dt>
                <dd>{name}</dd>
                <dt>E-mail</dt>
                <dd>{email}</dd>
                <dt>Plataforma</dt>
                <dd>{platform}</dd>
              </dl>
              <div className="gt-alert">
                <ShieldCheck size={18} />
                Dados conferidos. Na versão integrada, o pagamento cria sua
                plataforma e o acesso chega por e-mail.
              </div>
              <button className="gt-button" onClick={() => setReview(false)}>
                Editar dados
              </button>
            </>
          ) : (
            <form
              className="gt-form"
              onSubmit={(e) => {
                e.preventDefault();
                setReview(true);
              }}
            >
              <label>
                Nome completo
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
              <button className="gt-button gt-primary">
                Continuar
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

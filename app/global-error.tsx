'use client';
import Link from 'next/link';
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          background: '#101210',
          color: '#fff',
          fontFamily: 'sans-serif',
          padding: 40,
        }}
      >
        <h1>Não foi possível carregar</h1>
        <p>Tente novamente em alguns instantes.</p>
        <button onClick={retry}>Tentar novamente</button>
        <p>
          <Link href="/login" style={{ color: '#fff' }}>
            Voltar ao acesso
          </Link>
        </p>
      </body>
    </html>
  );
}

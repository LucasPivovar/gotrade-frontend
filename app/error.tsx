'use client';
import Link from 'next/link';
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main style={{ padding: 40, maxWidth: 520, margin: '10vh auto' }}>
      <h1>Não foi possível carregar</h1>
      <p>Tente novamente em alguns instantes.</p>
      <button onClick={retry}>Tentar novamente</button>
      <p>
        <Link href="/connections">Voltar ao painel</Link>
      </p>
    </main>
  );
}

'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
export default function ServiceUnavailable() {
  const router = useRouter();
  return (
    <main style={{ padding: 40, maxWidth: 520, margin: '10vh auto' }}>
      <h1>Não foi possível carregar</h1>
      <p>
        O serviço está temporariamente indisponível. Tente novamente em alguns
        instantes.
      </p>
      <button onClick={() => router.refresh()}>Tentar novamente</button>
      <p>
        <Link href="/login">Voltar ao acesso</Link>
      </p>
    </main>
  );
}

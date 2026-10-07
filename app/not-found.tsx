import Link from 'next/link';
export default function NotFound() {
  return (
    <main style={{ padding: 40, maxWidth: 520, margin: '10vh auto' }}>
      <h1>Página não encontrada</h1>
      <p>Confira o endereço ou volte ao painel.</p>
      <Link href="/connections">Voltar ao painel</Link>
    </main>
  );
}

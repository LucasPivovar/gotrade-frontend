import { revokeSession, sameOrigin } from '@/lib/auth';
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: 'Origem inválida.' }, { status: 403 });
  try {
    await revokeSession();
  } catch {
    return Response.json(
      { error: 'Serviço temporariamente indisponível.' },
      { status: 503 },
    );
  }
  return Response.json({ ok: true });
}

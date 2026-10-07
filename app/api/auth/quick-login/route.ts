import { seedAdmin, createSession, sameOrigin } from '@/lib/auth';
import { query } from '@/lib/database';
import { demoEnabled } from '@/lib/demo';

export async function POST(request: Request) {
  if (!demoEnabled()) return new Response(null, { status: 404 });
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Origem inválida.' }, { status: 403 });
  }
  try {
    await seedAdmin();
    const email =
      process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin@tradingpro.io';
    const account = (
      await query('SELECT id FROM accounts WHERE email=?', [email])
    ).rows[0];
    if (!account?.id || typeof account.id !== 'string') {
      return Response.json(
        { error: 'Conta de administrador não encontrada.' },
        { status: 404 },
      );
    }
    await createSession(account.id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(
      'Quick login failed:',
      error instanceof Error ? error.message : 'unknown',
    );
    return Response.json(
      { error: 'Não foi possível efetuar o login rápido.' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  if (!demoEnabled()) return new Response(null, { status: 404 });
  try {
    await seedAdmin();
    const email =
      process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'admin@tradingpro.io';
    const account = (
      await query('SELECT id FROM accounts WHERE email=?', [email])
    ).rows[0];
    if (account?.id && typeof account.id === 'string') {
      await createSession(account.id);
    }
    return Response.redirect(new URL('/', request.url), 302);
  } catch (error) {
    console.error(
      'Quick login redirect failed:',
      error instanceof Error ? error.message : 'unknown',
    );
    return Response.redirect(new URL('/login', request.url), 302);
  }
}

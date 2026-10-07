import { cookies } from 'next/headers';
import { demoEnabled } from '@/lib/demo';
import {
  seedAdmin,
  verifyPassword,
  createSession,
  sameOrigin,
  digest,
} from '@/lib/auth';
import { query } from '@/lib/database';
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: 'Origem inválida.' }, { status: 403 });
  try {
    const body = await request.json();
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = body.password;
    if (
      !email ||
      email.length > 200 ||
      typeof password !== 'string' ||
      password.length > 128
    )
      return Response.json(
        { error: 'E-mail ou senha inválidos.' },
        { status: 400 },
      );
    await seedAdmin();
    const key = digest(email);
    const now = Date.now();
    await query(
      'INSERT INTO login_attempts(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<? THEN 1 ELSE count+1 END,reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END',
      [key, now + 900000, now, now],
    );
    const attempts = await query(
      'SELECT count FROM login_attempts WHERE key=?',
      [key],
    );
    if (Number(attempts.rows[0].count) > 10)
      return Response.json(
        { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
        { status: 429 },
      );
    const account = (
      await query('SELECT id,password FROM accounts WHERE email=?', [email])
    ).rows[0];
    if (
      typeof account?.id !== 'string' ||
      typeof account?.password !== 'string' ||
      !(await verifyPassword(password, account.password))
    )
      return Response.json(
        { error: 'E-mail ou senha inválidos.' },
        { status: 401 },
      );
    await query('DELETE FROM login_attempts WHERE key=?', [key]);
    if (demoEnabled()) {
      const role = account.id === 'demo-admin' ? 'admin' : 'tenant';
      (await cookies()).set('tradingpro_demo_role', role, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      return Response.json({ ok: true, role });
    }
    await createSession(account.id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(
      'Login failed:',
      error instanceof Error ? error.message : 'unknown',
    );
    return Response.json(
      {
        error: 'Não foi possível entrar agora. Tente novamente em instantes.',
      },
      { status: 503 },
    );
  }
}

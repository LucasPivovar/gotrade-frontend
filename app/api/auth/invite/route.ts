import { randomBytes } from 'node:crypto';
import { workspace } from '@/lib/server';
import { query, transaction } from '@/lib/database';
import {
  sameOrigin,
  digest,
  hashPassword,
  validPassword,
  createSession,
} from '@/lib/auth';
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: 'Origem inválida.' }, { status: 403 });
  try {
    const w = await workspace();
    if (w.role !== 'admin')
      return Response.json({ error: 'Sem permissão.' }, { status: 403 });
    const { tenantId } = await request.json();
    const tenant = w.state.tenants.find(
      (t) => t.id === tenantId && t.status === 'active',
    );
    if (!tenant)
      return Response.json(
        { error: 'Operação indisponível.' },
        { status: 404 },
      );
    if (!tenant.admin.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenant.email))
      return Response.json({ error: 'Configure um responsável e e-mail válido antes de gerar um convite.' }, { status: 400 });
    const existing = (
      await query('SELECT id FROM accounts WHERE email=?', [
        tenant.email.toLowerCase(),
      ])
    ).rows[0];
    if (existing)
      return Response.json(
        { error: 'Este administrador já possui uma conta.' },
        { status: 409 },
      );
    const token = randomBytes(32).toString('hex');
    await query('DELETE FROM invitations WHERE owner=? AND tenant_id=?', [
      w.row.owner,
      tenant.id,
    ]);
    await query(
      'INSERT INTO invitations(token,owner,tenant_id,email,expires) VALUES(?,?,?,?,?)',
      [
        digest(token),
        w.row.owner,
        tenant.id,
        tenant.email.toLowerCase(),
        Date.now() + 86400000,
      ],
    );
    return Response.json({
      url: `/login?invite=${token}`,
      email: tenant.email,
    });
  } catch {
    return Response.json(
      { error: 'Não foi possível gerar o convite.' },
      { status: 400 },
    );
  }
}
export async function PUT(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: 'Origem inválida.' }, { status: 403 });
  try {
    const { token, password } = await request.json();
    if (typeof token !== 'string' || !validPassword(password))
      return Response.json(
        { error: 'A senha deve ter entre 12 e 128 caracteres.' },
        { status: 400 },
      );
    const hash = await hashPassword(password);
    const tx = await transaction();
    try {
      const invite = (
        await tx.execute({
          sql: 'SELECT * FROM invitations WHERE token=? AND expires>?',
          args: [digest(token), Date.now()],
        })
      ).rows[0];
      if (!invite) throw Error('Convite inválido ou expirado.');
      const w = (
        await tx.execute({
          sql: 'SELECT data FROM workspaces WHERE owner=?',
          args: [invite.owner],
        })
      ).rows[0];
      const tenant = typeof w?.data === 'string'
        ? JSON.parse(w.data).tenants.find(
            (t: { id: string; email: string; status: string }) =>
              t.id === invite.tenant_id &&
              t.email.toLowerCase() === invite.email &&
              t.status === 'active',
          )
        : null;
      if (!tenant) throw Error('Operação indisponível.');
      const id = crypto.randomUUID();
      await tx.execute({
        sql: 'INSERT INTO accounts(id,email,password,created) VALUES(?,?,?,?)',
        args: [id, invite.email, hash, Date.now()],
      });
      await tx.execute({
        sql: 'DELETE FROM invitations WHERE token=?',
        args: [digest(token)],
      });
      await tx.commit();
      await createSession(id);
      return Response.json({ ok: true });
    } catch (error) {
      await tx.rollback();
      throw error;
    } finally {
      tx.close();
    }
  } catch {
    return Response.json(
      { error: 'Convite inválido, expirado ou conta já ativada.' },
      { status: 400 },
    );
  }
}

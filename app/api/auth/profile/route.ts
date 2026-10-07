import { hashPassword, sameOrigin } from '@/lib/auth';
import { transaction } from '@/lib/database';
import { workspace } from '@/lib/server';
import { demoEnabled } from '@/lib/demo';
import type { State } from '@/lib/model';
import { ServiceUnavailableError } from '@/lib/service';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: 'Origem inválida.' }, { status: 403 });
  try {
    const w = await workspace();
    const body = await request.json();
    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : w.user.email;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200)
      return Response.json({ error: 'E-mail inválido.' }, { status: 400 });
    const password = body.newPassword,
      min = demoEnabled() ? 8 : 12;
    if (
      password !== undefined &&
      (typeof password !== 'string' ||
        password.length < min ||
        password.length > 128)
    )
      return Response.json(
        { error: 'A nova senha deve ter entre ' + min + ' e 128 caracteres.' },
        { status: 400 },
      );
    const hash = password ? await hashPassword(password) : undefined;
    const tx = await transaction();
    try {
      const duplicate = await tx.execute({
        sql: 'SELECT id FROM accounts WHERE lower(email)=? AND id!=?',
        args: [email, w.user.id],
      });
      if (duplicate.rows.length) {
        await tx.rollback();
        return Response.json(
          { error: 'Este e-mail já está em uso.' },
          { status: 409 },
        );
      }
      const rows = await tx.execute({
        sql: 'SELECT data FROM workspaces WHERE owner=?',
        args: [w.row.owner],
      });
      const row = rows.rows[0];
      if (typeof row?.data !== 'string') throw Error('FORBIDDEN');
      const state = JSON.parse(row.data) as State;
      if (w.role === 'tenant') {
        const tenant = state.tenants.find(
          (t) =>
            t.id === w.tenantId &&
            t.email.toLowerCase() === w.user.email &&
            t.status === 'active',
        );
        if (!tenant) throw Error('FORBIDDEN');
        const reserved = await tx.execute({
          sql: "SELECT owner FROM workspaces WHERE EXISTS (SELECT 1 FROM json_each(json_extract(data,'$.tenants')) WHERE lower(json_extract(value,'$.email'))=? AND json_extract(value,'$.id')!=?)",
          args: [email, tenant.id],
        });
        if (reserved.rows.length) {
          await tx.rollback();
          return Response.json(
            { error: 'Este e-mail já está em uso.' },
            { status: 409 },
          );
        }
        tenant.email = email;
        if (tenant.users)
          tenant.users = tenant.users.map((u) =>
            u.email.toLowerCase() === w.user.email ? { ...u, email } : u,
          );
        await tx.execute({
          sql: 'UPDATE workspaces SET data=?,revision=revision+1 WHERE owner=?',
          args: [JSON.stringify(state), w.row.owner],
        });
      }
      await tx.execute({
        sql: 'UPDATE accounts SET email=? WHERE id=?',
        args: [email, w.user.id],
      });
      if (hash)
        await tx.execute({
          sql: 'UPDATE accounts SET password=? WHERE id=?',
          args: [hash, w.user.id],
        });
      await tx.commit();
      return Response.json({ ok: true, email, message: 'Dados atualizados.' });
    } catch (e) {
      if (!tx.closed) await tx.rollback();
      throw e;
    } finally {
      tx.close();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    return Response.json(
      {
        error:
          msg === 'UNAUTHORIZED'
            ? 'Entre novamente.'
            : msg === 'FORBIDDEN'
              ? 'Acesso indisponível.'
              : e instanceof ServiceUnavailableError
                ? e.message
                : 'Não foi possível salvar os dados.',
      },
      {
        status:
          msg === 'UNAUTHORIZED'
            ? 401
            : msg === 'FORBIDDEN'
              ? 403
              : e instanceof ServiceUnavailableError
                ? 503
                : 400,
      },
    );
  }
}

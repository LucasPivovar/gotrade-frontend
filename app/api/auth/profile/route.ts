import { hashPassword, sameOrigin } from '@/lib/auth';
import { query } from '@/lib/database';
import { workspace } from '@/lib/server';
import { ServiceUnavailableError } from '@/lib/service';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: 'Origem inválida.' }, { status: 403 });
  try {
    const w = await workspace();
    const { newPassword } = await request.json();
    if (
      typeof newPassword !== 'string' ||
      newPassword.length < 12 ||
      newPassword.length > 128
    )
      return Response.json(
        { error: 'A nova senha deve ter entre 12 e 128 caracteres.' },
        { status: 400 },
      );
    await query('UPDATE accounts SET password=? WHERE id=?', [
      await hashPassword(newPassword),
      w.user.id,
    ]);
    return Response.json({
      ok: true,
      message: 'Senha atualizada com sucesso.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    return Response.json(
      {
        error:
          message === 'UNAUTHORIZED'
            ? 'Entre novamente.'
            : message === 'FORBIDDEN'
              ? 'Acesso indisponível.'
              : e instanceof ServiceUnavailableError
                ? e.message
                : 'Não foi possível atualizar a senha.',
      },
      {
        status:
          message === 'UNAUTHORIZED'
            ? 401
            : message === 'FORBIDDEN'
              ? 403
              : e instanceof ServiceUnavailableError
                ? 503
                : 400,
      },
    );
  }
}

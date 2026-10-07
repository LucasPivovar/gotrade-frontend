import { workspace, database, scoped } from '@/lib/server';
import { sameOrigin } from '@/lib/auth';
import { demoEnabled } from '@/lib/demo';
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: 'Origem inválida.' }, { status: 403 });
  try {
    const w = await workspace();
    if (w.role !== 'admin')
      return Response.json({ error: 'Acesso negado.' }, { status: 403 });
    const body = await request.json();
    const ticket = w.state.tickets?.find((t) => t.id === body.ticketId);
    const reply = ticket?.replies.find((r) => r.id === body.replyId);
    const tenant = w.state.tenants.find((t) => t.id === ticket?.tenantId);
    if (!ticket || !reply || !tenant)
      return Response.json(
        { error: 'Resposta não encontrada.' },
        { status: 404 },
      );
    if (reply.emailStatus === 'sent') return Response.json({ status: 'sent' });
    if (
      demoEnabled() ||
      !process.env.RESEND_API_KEY ||
      !process.env.SUPPORT_EMAIL_FROM
    )
      return Response.json({
        status: 'pending',
        message:
          'Resposta salva no ticket. O envio por e-mail aguarda configuração.',
      });
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(12000),
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': reply.id,
      },
      body: JSON.stringify({
        from: process.env.SUPPORT_EMAIL_FROM,
        to: [tenant.email],
        subject: `GoTrade: ${ticket.subject}`,
        text: `Olá, ${tenant.admin}.\n\n${reply.message}\n\nAcompanhe seu ticket na área de suporte do GoTrade.`,
      }),
    });
    reply.emailStatus = response.ok ? 'sent' : 'failed';
    const result = await database()
      .prepare(
        'UPDATE workspaces SET data=?,revision=revision+1 WHERE owner=? AND revision=?',
      )
      .bind(JSON.stringify(w.state), w.row.owner, w.row.revision)
      .run();
    return Response.json({
      status: reply.emailStatus,
      message: response.ok
        ? 'Envio aceito pelo serviço de e-mail.'
        : 'Resposta salva. O serviço de e-mail recusou o envio.',
      ...(result.meta.changes === 1
        ? {
            session: {
              state: scoped(w),
              role: w.role,
              email: w.user.email,
              revision: w.row.revision + 1,
            },
          }
        : {}),
    });
  } catch {
    return Response.json(
      {
        error:
          'Não foi possível encaminhar o e-mail. A resposta permanece no ticket.',
      },
      { status: 503 },
    );
  }
}

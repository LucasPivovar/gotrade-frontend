import { ServiceUnavailableError } from '@/lib/service';
import { database, workspace, scoped } from '@/lib/server';
import { sameOrigin } from '@/lib/auth';
import { updateApplication } from '@/lib/application';
import {
  validateTenant,
  validateCheckout,
  type Tenant,
  type Checkout,
} from '@/lib/model';
export const dynamic = 'force-dynamic';
function failure(e: unknown) {
  if (e instanceof ServiceUnavailableError)
    return Response.json(
      { error: e.message },
      { status: 503, headers: { 'Retry-After': '30' } },
    );
  const msg = e instanceof Error ? e.message : 'Falha ao salvar.';
  return Response.json(
    { error: msg },
    { status: msg === 'UNAUTHORIZED' ? 401 : msg === 'FORBIDDEN' ? 403 : 400 },
  );
}
export async function GET() {
  try {
    const w = await workspace();
    return Response.json({
      state: scoped(w),
      role: w.role,
      tenantId: w.tenantId,
      email: w.user.email,
      revision: w.row.revision,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request))
      return Response.json({ error: 'Origem inválida.' }, { status: 403 });
    const raw = await request.text();
    if (raw.length > 1800000)
      throw Error('As imagens excedem o limite do formulário.');
    const body = JSON.parse(raw);
    if (['checkout', 'deleteCheckout'].includes(body.action))
      return Response.json(
        { error: 'Checkouts estão desativados nesta versão.' },
        { status: 410 },
      );
    const w = await workspace();
    const s = w.state;
    let event = '';
    if (body.revision !== w.row.revision)
      return Response.json(
        {
          error:
            'Os dados mudaram em outra sessão. Recarregue antes de salvar.',
        },
        { status: 409 },
      );
    if (body.action === 'applicationBranding') {
      const old = s.tenants.find((t) => t.id === body.value?.id);
      if (!old || (w.role === 'tenant' && old.id !== w.tenantId))
        throw Error('FORBIDDEN');
      const updated = updateApplication(old, body.value);
      if (updated.logo && updated.logo !== old.logo) {
        const media = await database()
          .prepare('SELECT owner FROM media WHERE id=?')
          .bind(updated.logo.split('/').pop()!)
          .first<{ owner: string }>();
        if (media?.owner !== old.id) throw Error('FORBIDDEN');
      }
      if (updated.domain && updated.domain !== old.domain) {
        const duplicate = await database()
          .prepare(
            "SELECT owner FROM workspaces WHERE EXISTS (SELECT 1 FROM json_each(json_extract(data,'$.tenants')) WHERE lower(json_extract(value,'$.domain'))=? AND json_extract(value,'$.id')!=?)",
          )
          .bind(updated.domain, old.id)
          .first();
        if (duplicate)
          throw Error('Este domínio já está associado a outra plataforma.');
      }
      s.tenants = s.tenants.map((t) => (t.id === old.id ? updated : t));
      event = `Atualizou a plataforma ${updated.name}`;
    } else if (body.action === 'tenant') {
      if (w.role !== 'admin') throw Error('FORBIDDEN');
      const t = body.value as Tenant;
      validateTenant(t);
      const old = s.tenants.find((x) => x.id === t.id);
      if (
        s.tenants.some(
          (x) =>
            x.id !== t.id &&
            (x.slug === t.slug ||
              (t.email && x.email.toLowerCase() === t.email.toLowerCase()) ||
              (t.domain && x.domain === t.domain)),
        )
      )
        throw Error('Slug, e-mail ou domínio já pertence a outra operação.');
      t.email = t.email.toLowerCase();
      t.created = old?.created || new Date().toISOString();
      if (old) s.tenants = s.tenants.map((x) => (x.id === t.id ? t : x));
      else s.tenants.push(t);
      event = `${old ? 'Atualizou' : 'Criou'} a operação ${t.name}`;
    } else if (body.action === 'checkout') {
      const c = body.value as Checkout;
      validateCheckout(c);
      const tenant = s.tenants.find((t) => t.id === c.tenantId);
      if (
        !tenant ||
        tenant.status === 'suspended' ||
        (w.role === 'tenant' && c.tenantId !== w.tenantId)
      )
        throw Error('FORBIDDEN');
      const old = s.checkouts.find((x) => x.id === c.id);
      if (old && old.tenantId !== c.tenantId) throw Error('FORBIDDEN');
      c.updated = new Date().toISOString();
      c.published =
        body.publish === true
          ? true
          : body.publish === false
            ? false
            : old?.published || false;
      c.publishedData = old?.publishedData;
      if (body.publish === true) {
        const snapshot = { ...c };
        delete snapshot.publishedData;
        c.publishedData = JSON.stringify(snapshot);
      }
      s.checkouts = old
        ? s.checkouts.map((x) => (x.id === c.id ? c : x))
        : [...s.checkouts, c];
      event = `${body.publish === true ? 'Publicou' : 'Salvou'} o checkout ${c.name}`;
    } else if (body.action === 'deleteCheckout') {
      const c = s.checkouts.find((x) => x.id === body.id);
      if (!c || (w.role === 'tenant' && c.tenantId !== w.tenantId))
        throw Error('FORBIDDEN');
      s.checkouts = s.checkouts.filter((x) => x.id !== c.id);
      event = `Excluiu o checkout ${c.name}`;
    } else if (body.action === 'settings') {
      if (w.role !== 'admin') throw Error('FORBIDDEN');
      s.settings = {
        ...s.settings,
        ...body.value,
      };
      event = 'Atualizou as configurações globais da plataforma';
    } else throw Error('Ação desconhecida.');
    s.activity = [
      { id: crypto.randomUUID(), text: event, time: new Date().toISOString() },
      ...s.activity,
    ].slice(0, 100);
    if (JSON.stringify(s).length > 1700000)
      throw Error(
        'O workspace atingiu o limite desta versão. Reduza textos e ofertas antes de salvar.',
      );
    const result = await database()
      .prepare(
        'UPDATE workspaces SET data=?,revision=revision+1 WHERE owner=? AND revision=?',
      )
      .bind(JSON.stringify(s), w.row.owner, w.row.revision)
      .run();
    if (result.meta.changes !== 1)
      return Response.json(
        { error: 'Conflito de edição. Recarregue os dados.' },
        { status: 409 },
      );
    return Response.json({
      state: scoped({ ...w, state: s }),
      role: w.role,
      tenantId: w.tenantId,
      email: w.user.email,
      revision: w.row.revision + 1,
    });
  } catch (e) {
    return failure(e);
  }
}

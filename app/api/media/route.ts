import { query } from '@/lib/database';
import { sameOrigin } from '@/lib/auth';
import { workspace } from '@/lib/server';
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request))
      return Response.json({ error: 'Origem inválida.' }, { status: 403 });
    const w = await workspace();
    const form = await request.formData();
    const tenantId = form.get('tenantId');
    const tenant = w.state.tenants.find((t) => t.id === tenantId);
    if (!tenant || (w.role === 'tenant' && tenant.id !== w.tenantId))
      return Response.json({ error: 'Acesso negado.' }, { status: 403 });
    const file = form.get('file');
    if (
      !(file instanceof File) ||
      file.size > 400000 ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
    )
      return Response.json(
        { error: 'Use PNG, JPG ou WebP com até 400 KB.' },
        { status: 400 },
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    const png =
      bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp =
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    if (
      !(
        (file.type === 'image/png' && png) ||
        (file.type === 'image/jpeg' && jpg) ||
        (file.type === 'image/webp' && webp)
      )
    )
      return Response.json(
        { error: 'Arquivo de imagem inválido.' },
        { status: 400 },
      );
    const id = crypto.randomUUID();
    await query('INSERT INTO media(id,owner,mime,bytes) VALUES(?,?,?,?)', [
      id,
      tenant.id,
      file.type,
      bytes,
    ]);
    return Response.json({ url: `/api/media/${id}` });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Falha no upload.' },
      { status: 400 },
    );
  }
}

import { query } from '@/lib/database';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id))
    return new Response('Not found', { status: 404 });
  try {
    const row = (await query('SELECT mime,bytes FROM media WHERE id=?', [id]))
      .rows[0];
    if (typeof row?.mime !== 'string' || !(row.bytes instanceof ArrayBuffer))
      return new Response('Not found', { status: 404 });
    return new Response(row.bytes, {
      headers: {
        'Content-Type': row.mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Serviço temporariamente indisponível.', {
      status: 503,
    });
  }
}

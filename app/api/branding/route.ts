import { database } from '@/lib/server';
import { publicBranding } from '@/lib/application';
import type { State } from '@/lib/model';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('tenant');
  if (!id)
    return Response.json(
      {
        id: 'default',
        name: 'GoTrade',
        color: '#237a4b',
        secondaryColor: '#ffffff',
        font: 'Inter',
        logo: '/brand/gotrade-logo.svg',
        favicon: '/brand/gotrade-icon.png',
        darkMode: true,
        loginTemplate: 'split',
      },
      { headers },
    );
  if (!/^[a-f0-9-]{36}$/i.test(id))
    return Response.json(
      { error: 'Plataforma não encontrada.' },
      { status: 404, headers },
    );
  try {
    const row = await database()
      .prepare(
        "SELECT data FROM workspaces WHERE EXISTS (SELECT 1 FROM json_each(json_extract(data,'$.tenants')) WHERE json_extract(value,'$.id')=?) LIMIT 1",
      )
      .bind(id)
      .first<{ data: string }>();
    const tenant =
      row && (JSON.parse(row.data) as State).tenants.find((t) => t.id === id);
    if (!tenant)
      return Response.json(
        { error: 'Plataforma não encontrada.' },
        { status: 404, headers },
      );
    if (tenant.status !== 'active')
      return Response.json(
        { error: 'Esta plataforma está suspensa.' },
        { status: 403, headers },
      );
    return Response.json(publicBranding(tenant), { headers });
  } catch {
    return Response.json(
      { error: 'Não foi possível carregar a plataforma.' },
      { status: 503, headers },
    );
  }
}

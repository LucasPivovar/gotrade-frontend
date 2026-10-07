import { database, query } from './database';
import { requireUser } from './auth';
import { initialState, type State } from './model';
export { database };
export const identity = requireUser;
export async function workspace() {
  const user = await requireUser();
  const db = database();
  let row = await db
    .prepare('SELECT owner,data,revision FROM workspaces WHERE owner=?')
    .bind(user.id)
    .first<{ owner: string; data: string; revision: number }>();
  if (row) {
    const state = JSON.parse(row.data) as State;
    return {
      user,
      row,
      role: 'admin' as const,
      state,
    };
  }
  row = await db
    .prepare(
      "SELECT owner,data,revision FROM workspaces WHERE EXISTS (SELECT 1 FROM json_each(json_extract(data,'$.tenants')) WHERE lower(json_extract(value,'$.email'))=?) LIMIT 1",
    )
    .bind(user.email)
    .first<{ owner: string; data: string; revision: number }>();
  if (row) {
    const state = JSON.parse(row.data) as State;
    const tenant = state.tenants.find(
      (t) => t.email.toLowerCase() === user.email,
    );
    if (!tenant || tenant.status !== 'active') throw Error('FORBIDDEN');
    return { user, row, role: 'tenant' as const, tenantId: tenant.id, state };
  }
  if (user.email !== process.env.ADMIN_EMAIL?.trim().toLowerCase())
    throw Error('FORBIDDEN');
  const state = {
    ...initialState(user.email),
    tenants: [],
    checkouts: [],
    activity: [],
  };
  await query(
    'INSERT OR IGNORE INTO workspaces(owner,data,revision) VALUES(?,?,0)',
    [user.id, JSON.stringify(state)],
  );
  row = await db
    .prepare('SELECT owner,data,revision FROM workspaces WHERE owner=?')
    .bind(user.id)
    .first<{ owner: string; data: string; revision: number }>();
  return {
    user,
    row: row!,
    role: 'admin' as const,
    state: JSON.parse(row!.data) as State,
  };
}
export function scoped(w: Awaited<ReturnType<typeof workspace>>) {
  return {
    ...w.state,
    tenants: w.state.tenants.filter(
      (t) => w.role === 'admin' || t.id === w.tenantId,
    ),
    checkouts: w.state.checkouts.filter(
      (c) => w.role === 'admin' || c.tenantId === w.tenantId,
    ),
    activity: w.role === 'admin' ? w.state.activity || [] : [],
  };
}

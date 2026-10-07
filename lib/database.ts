import { ServiceUnavailableError } from './service';
import { createClient, type Client, type InValue } from '@libsql/client';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';
import { demoEnabled, demoAccounts } from './demo';
import { initialState, newCheckout } from './model';
import { addDemoData } from './demo-data';
let client: Client | undefined;
let ready: Promise<void> | undefined;
function connection() {
  if (!client) {
    const url = demoEnabled()
      ? `file:${join(tmpdir(), 'gotrade-sample-v3.db').replaceAll('\\', '/')}`
      : process.env.TURSO_DATABASE_URL;
    if (!url)
      throw Error(
        'Configure TURSO_DATABASE_URL e execute npm run setup no ambiente local.',
      );
    if (process.env.VERCEL && !demoEnabled() && url.startsWith('file:'))
      throw Error('A Vercel exige um banco remoto Turso.');
    client = createClient({
      url,
      authToken: demoEnabled() ? undefined : process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}
export async function initialize() {
  if (!ready) {
    ready = connection()
      .batch(
        [
          'CREATE TABLE IF NOT EXISTS workspaces (owner TEXT PRIMARY KEY NOT NULL,data TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0)',
          'CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY NOT NULL,email TEXT NOT NULL UNIQUE,password TEXT NOT NULL,created INTEGER NOT NULL)',
          'CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY NOT NULL,account_id TEXT NOT NULL,expires INTEGER NOT NULL)',
          'CREATE TABLE IF NOT EXISTS invitations (token TEXT PRIMARY KEY NOT NULL,owner TEXT NOT NULL,tenant_id TEXT NOT NULL,email TEXT NOT NULL,expires INTEGER NOT NULL)',
          'CREATE TABLE IF NOT EXISTS login_attempts (key TEXT PRIMARY KEY NOT NULL,count INTEGER NOT NULL,reset_at INTEGER NOT NULL)',
          'CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY NOT NULL,owner TEXT NOT NULL,mime TEXT NOT NULL,bytes BLOB NOT NULL)',
          'CREATE INDEX IF NOT EXISTS sessions_account ON sessions(account_id)',
          'CREATE INDEX IF NOT EXISTS invitations_tenant ON invitations(owner,tenant_id)',
        ],
        'write',
      )
      .then(async () => {
        if (!demoEnabled()) return;
        const db = connection();
        const existing = await db.execute(
          "SELECT owner,data FROM workspaces WHERE owner='demo-admin'",
        );
        if (existing.rows.length) {
          const state = JSON.parse(String(existing.rows[0].data));
          if (state.demoVersion !== 3)
            await db.execute({
              sql: "UPDATE workspaces SET data=?,revision=revision+1 WHERE owner='demo-admin'",
              args: [JSON.stringify(addDemoData(state))],
            });
          return;
        }
        const state = initialState(demoAccounts[1].email);
        state.tenants[0].id = '10000000-0000-4000-8000-000000000001';
        state.tenants[0].admin = 'Minha conta';
        state.checkouts = [newCheckout(state.tenants[0])];
        state.checkouts[0].id = '20000000-0000-4000-8000-000000000001';
        state.checkouts[0].published = true;
        state.checkouts[0].publishedData = JSON.stringify(state.checkouts[0]);
        state.activity = [
          {
            id: crypto.randomUUID(),
            text: 'Ambiente de demonstração iniciado',
            time: new Date().toISOString(),
          },
        ];
        addDemoData(state);
        await db.batch(
          [
            ...demoAccounts.map((account) => {
              const salt = randomBytes(16).toString('hex');
              const password = `${salt}:${scryptSync(account.password, salt, 64).toString('hex')}`;
              return {
                sql: 'INSERT OR IGNORE INTO accounts(id,email,password,created) VALUES(?,?,?,?)',
                args: [account.id, account.email, password, Date.now()],
              };
            }),
            {
              sql: 'INSERT OR IGNORE INTO workspaces(owner,data,revision) VALUES(?,?,0)',
              args: ['demo-admin', JSON.stringify(state)],
            },
          ],
          'write',
        );
      })
      .catch((e) => {
        ready = undefined;
        throw e;
      });
  }
  return ready;
}
export async function query(sql: string, args: InValue[] = []) {
  try {
    await initialize();
    return await connection().execute({ sql, args });
  } catch {
    throw new ServiceUnavailableError();
  }
}
export async function transaction() {
  try {
    await initialize();
    return await connection().transaction('write');
  } catch {
    throw new ServiceUnavailableError();
  }
}
// Small prepared-query adapter preserves existing workspace operations during migration.
export function database() {
  return {
    prepare(sql: string) {
      let args: InValue[] = [];
      return {
        bind(...values: InValue[]) {
          args = values;
          return this;
        },
        async first<T>() {
          const r = await query(sql, args);
          return (r.rows[0] as unknown as T) || null;
        },
        async run() {
          const r = await query(sql, args);
          return { meta: { changes: r.rowsAffected } };
        },
      };
    },
  };
}

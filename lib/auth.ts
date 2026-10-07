import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { query } from './database';
import { demoEnabled, demoAccounts } from './demo';
const scrypt = promisify(scryptCallback);
export const cookieName = 'tradingpro_session';
export function digest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [salt, hex] = stored.split(':');
  if (!salt || !hex) return false;
  const expected = Buffer.from(hex, 'hex');
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function validPassword(value: unknown) {
  return typeof value === 'string' && value.length >= 12 && value.length <= 128;
}
export async function seedAdmin() {
  if (demoEnabled()) return;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(),
    password = process.env.ADMIN_PASSWORD;
  if (!email || !validPassword(password))
    throw Error(
      'Configure ADMIN_EMAIL e ADMIN_PASSWORD (mínimo 12 caracteres).',
    );
  const exists = await query('SELECT id FROM accounts WHERE email=?', [email]);
  if (!exists.rows.length) {
    const hash = await hashPassword(password!);
    await query(
      'INSERT OR IGNORE INTO accounts(id,email,password,created) VALUES(?,?,?,?)',
      [crypto.randomUUID(), email, hash, Date.now()],
    );
  }
}
export async function getUser() {
  if (demoEnabled()) {
    const role = (await cookies()).get('tradingpro_demo_role')?.value;
    const account = demoAccounts[role === 'admin' ? 0 : 1];
    return { id: account.id, email: account.email };
  }
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const r = await query(
    'SELECT a.id,a.email FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token=? AND s.expires>?',
    [digest(token), Date.now()],
  );
  const account = r.rows[0];
  if (typeof account?.id !== 'string' || typeof account?.email !== 'string') return null;
  return account ? { id: account.id, email: account.email } : null;
}
export async function requireUser() {
  const user = await getUser();
  if (!user) throw Error('UNAUTHORIZED');
  return user;
}
export async function createSession(id: string) {
  const token = randomBytes(32).toString('hex');
  await query('INSERT INTO sessions(token,account_id,expires) VALUES(?,?,?)', [
    digest(token),
    id,
    Date.now() + 86400000,
  ]);
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 86400,
  });
}
export async function revokeSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) await query('DELETE FROM sessions WHERE token=?', [digest(token)]);
  jar.delete(cookieName);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const source = new URL(origin);
    const target = new URL(request.url);
    const host = request.headers.get('host') || target.host;
    return (
      source.host === host &&
      source.origin === origin &&
      ['http:', 'https:'].includes(source.protocol) &&
      (source.protocol === 'https:' || !process.env.VERCEL)
    );
  } catch {
    return false;
  }
}

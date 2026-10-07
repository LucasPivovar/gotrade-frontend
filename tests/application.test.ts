import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createApplication,
  updateApplication,
  validateApplicationBrand,
  publicBranding,
} from '../lib/application';
import { validateTenant, getTenantUsers } from '../lib/model';

void test('branding edits retain identity, access permissions and advanced data', () => {
  const tenant = {
    ...createApplication({ name: 'Alpha', color: '#123456' }, []),
    domain: 'alpha.example.com',
    connections: ['Bybit'],
    admin: 'Ana',
    email: 'ana@example.com',
    logo: 'https://example.com/logo.png',
  };
  const updated = updateApplication(tenant, {
    name: '  Alpha Nova  ',
    color: '#ABCDEF',
    secondaryColor: '#654321',
    id: 'other',
    connections: ['XR'],
    email: 'attacker@example.com',
  });
  assert.equal(updated.name, 'Alpha Nova');
  assert.equal(updated.color, '#abcdef');
  for (const key of [
    'id',
    'slug',
    'domain',
    'email',
    'admin',
    'logo',
    'created',
  ] as const)
    assert.equal(updated[key], tenant[key]);
  assert.deepEqual(updated.connections, ['Bybit']);
  assert.equal(tenant.name, 'Alpha');
});
void test('generated slugs remain unique and valid for repeated or symbolic names', () => {
  const first = createApplication({ name: 'Álpha', color: '#123456' }, []);
  const second = createApplication({ name: 'Alpha', color: '#123456' }, [
    first,
  ]);
  const symbolic = createApplication({ name: '!!!', color: '#123456' }, [
    first,
    second,
  ]);
  assert.equal(first.slug, 'alpha');
  assert.equal(second.slug, 'alpha-2');
  assert.equal(symbolic.slug, 'plataforma');
  [first, second, symbolic].forEach(validateTenant);
  assert.deepEqual(getTenantUsers(first), []);
});
void test('invalid branding is rejected and public branding has no private data', () => {
  for (const input of [
    null,
    { name: '', color: '#123456' },
    { name: 'x'.repeat(101), color: '#123456' },
    { name: 'Alpha', color: 'red' },
    { name: 'Alpha', color: '#123456', secondaryColor: 'invalid' },
  ])
    assert.throws(() => validateApplicationBrand(input));
  const tenant = {
    ...createApplication({ name: 'Alpha', color: '#123456' }, []),
    email: 'private@example.com',
    loginTemplate: 'hero' as const,
  };
  const brand = publicBranding(tenant);
  assert.equal(brand.id, tenant.id);
  assert.equal(brand.loginTemplate, 'split');
  for (const key of ['email', 'admin', 'users', 'connections', 'allowedBots'])
    assert.equal(key in brand, false);
});

import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { createHash } from 'node:crypto';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { ManagersService } from '@modules/access/services/managers.service.js';
import { createApp, startDatabase } from '../../support/database.js';

const email = 'gestor@example.com';
const password = 'uma senha longa o bastante';

let container: StartedPostgreSqlContainer;
let app: NestFastifyApplication;
let database: DataSource;
let managerId: string;

beforeAll(async () => {
  container = await startDatabase();
  app = await createApp();
  database = app.get(DataSource);
  ({ id: managerId } = await app.get(ManagersService).create(email, password));
}, 120_000);

afterAll(async () => {
  await app.close();
  await container.stop();
});

async function signIn(remoteAddress: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/session',
    payload: { email, password },
    remoteAddress,
  });
  const [session] = response.cookies;
  if (!session) {
    throw new Error(`sign-in answered ${response.statusCode}`);
  }
  return {
    response,
    cookie: `${session.name}=${session.value}`,
    token: session.value,
  };
}

async function countSessions(): Promise<number> {
  const [{ count }] = await database.query<{ count: number }[]>(
    'SELECT count(*)::int AS count FROM manager_sessions',
  );
  return count;
}

test('signs the manager in with a session cookie', async () => {
  const { response, cookie, token } = await signIn('198.51.100.1');

  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ id: managerId, email });
  expect(response.cookies).toEqual([
    expect.objectContaining({
      name: '__Host-sid',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    }),
  ]);
  const sessions = await database.query<{ id: string }[]>(
    'SELECT id FROM manager_sessions WHERE manager_id = $1',
    [managerId],
  );
  expect(sessions.map(({ id }) => id)).toContain(
    createHash('sha256').update(token).digest('base64url'),
  );

  const current = await app.inject({
    method: 'GET',
    url: '/session',
    headers: { cookie },
  });
  expect(current.statusCode).toBe(200);
  expect(current.json()).toEqual({ id: managerId, email });
});

test('answers a wrong password and an unknown e-mail the same way', async () => {
  const responses = await Promise.all(
    [
      { email, password: 'senha errada' },
      { email: 'ninguem@example.com', password },
    ].map((payload) =>
      app.inject({ method: 'POST', url: '/session', payload }),
    ),
  );

  for (const response of responses) {
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      errorCode: 'invalid_credentials',
      message: 'Invalid e-mail or password',
    });
    expect(response.headers['set-cookie']).toBeUndefined();
  }
  expect(responses[0].body).toBe(responses[1].body);
});

test('signs out and refuses the cookie afterwards', async () => {
  const { cookie, token } = await signIn('198.51.100.2');

  const signOut = await app.inject({
    method: 'DELETE',
    url: '/session',
    headers: { cookie },
  });
  expect(signOut.statusCode).toBe(204);
  expect(signOut.cookies).toEqual([
    expect.objectContaining({ name: '__Host-sid', value: '', maxAge: 0 }),
  ]);
  const [row] = await database.query<unknown[]>(
    'SELECT 1 FROM manager_sessions WHERE id = $1',
    [createHash('sha256').update(token).digest('base64url')],
  );
  expect(row).toBeUndefined();

  const after = await app.inject({
    method: 'GET',
    url: '/session',
    headers: { cookie },
  });
  expect(after.statusCode).toBe(401);
  expect(after.json()).toMatchObject({ errorCode: 'missing_credentials' });
});

test('refuses a session idle for more than 2 hours', async () => {
  const { cookie } = await signIn('198.51.100.3');
  await database.query(
    "UPDATE manager_sessions SET last_active_at = now() - interval '2 hours 1 minute'",
  );

  const response = await app.inject({
    method: 'GET',
    url: '/session',
    headers: { cookie },
  });
  expect(response.statusCode).toBe(401);
  expect(response.json()).toMatchObject({ errorCode: 'missing_credentials' });
});

test('rejects a sign-in body outside the schema', async () => {
  const before = await countSessions();

  const response = await app.inject({
    method: 'POST',
    url: '/session',
    payload: { email: 'não é e-mail', password },
  });

  expect(response.statusCode).toBe(400);
  expect(response.json()).toMatchObject({
    message: ['email: Invalid email address'],
  });
  expect(await countSessions()).toBe(before);
});

test('limits sign-in to 5 requests per IP in 900 s', async () => {
  const remoteAddress = '203.0.113.8';
  for (let attempt = 0; attempt < 5; attempt++) {
    await app.inject({
      method: 'POST',
      url: '/session',
      payload: { email, password: 'senha errada' },
      remoteAddress,
    });
  }
  const before = await countSessions();

  const response = await app.inject({
    method: 'POST',
    url: '/session',
    payload: { email, password },
    remoteAddress,
  });

  expect(response.statusCode).toBe(429);
  expect(response.headers['retry-after']).toBeDefined();
  expect(await countSessions()).toBe(before);
});

test('refuses a sign-in from another origin', async () => {
  const before = await countSessions();

  const response = await app.inject({
    method: 'POST',
    url: '/session',
    payload: { email, password },
    headers: { 'sec-fetch-site': 'cross-site' },
  });

  expect(response.statusCode).toBe(403);
  expect(response.json()).toMatchObject({
    message: 'Cross-origin request detected from Sec-Fetch-Site header',
  });
  expect(await countSessions()).toBe(before);
});

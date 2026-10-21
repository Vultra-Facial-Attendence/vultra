import { expect, test, vi } from 'vitest';
import { ManagersService } from '@modules/access/services/managers.service.js';
import { createApp, startDatabase } from '../../support/database.js';

const lines = vi.hoisted((): string[] => []);

vi.mock('@core/logger/logger.js', async (importOriginal) => {
  const { pinoHttpOptions } =
    await importOriginal<typeof import('@core/logger/logger.js')>();
  return {
    pinoHttpOptions: [
      pinoHttpOptions,
      { write: (line: string) => lines.push(line) },
    ],
  };
});

test('logs sign-in and sign-out without any secret', async () => {
  const container = await startDatabase();
  const app = await createApp();
  const password = 'uma senha longa o bastante';
  const manager = await app
    .get(ManagersService)
    .create('gestor@example.com', password);

  const signIn = await app.inject({
    method: 'POST',
    url: '/session',
    payload: { email: manager.email, password },
  });
  const [session] = signIn.cookies;
  const cookie = `${session.name}=${session.value}`;
  await app.inject({
    method: 'GET',
    url: '/session',
    headers: { cookie, authorization: 'Bearer session-token' },
  });
  await app.inject({ method: 'DELETE', url: '/session', headers: { cookie } });
  await app.close();
  await container.stop();

  const log = lines.join('');
  expect(log).not.toContain(password);
  expect(log).not.toContain(session.value);
  expect(log).not.toContain('Bearer session-token');
  expect(log).not.toContain(container.getConnectionUri());
  const entries = lines.map(
    (line) =>
      JSON.parse(line) as {
        msg: string;
        managerId?: string;
        req?: { headers: Record<string, string> };
        res?: { headers: Record<string, string> };
      },
  );
  expect(entries).toContainEqual(
    expect.objectContaining({
      msg: 'manager signed in',
      managerId: manager.id,
    }),
  );
  expect(entries).toContainEqual(
    expect.objectContaining({
      msg: 'manager signed out',
      managerId: manager.id,
    }),
  );
  expect(entries).toContainEqual(
    expect.objectContaining({
      req: expect.objectContaining({
        headers: expect.objectContaining({
          cookie: '[Redacted]',
          authorization: '[Redacted]',
        }),
      }),
    }),
  );
  expect(entries).toContainEqual(
    expect.objectContaining({
      res: expect.objectContaining({
        headers: expect.objectContaining({ 'set-cookie': '[Redacted]' }),
      }),
    }),
  );
}, 120_000);

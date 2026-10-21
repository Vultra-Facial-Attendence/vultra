import { expect, test } from 'vitest';
import { createApp, startDatabase } from '../support/database.js';

test('reports the database as up, then as down', async () => {
  const container = await startDatabase();
  const app = await createApp();

  const up = await app.inject({ method: 'GET', url: '/health' });
  expect(up.statusCode).toBe(200);
  expect(up.json()).toMatchObject({ status: 'ok' });

  await container.stop();
  const down = await app.inject({ method: 'GET', url: '/health' });
  expect(down.statusCode).toBe(503);
  expect(down.json()).toMatchObject({ status: 'error' });

  await app.close();
}, 120_000);

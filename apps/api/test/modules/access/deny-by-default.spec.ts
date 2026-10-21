import type { HTTPMethods } from 'fastify';
import { expect, test } from 'vitest';
import { createApp, startDatabase } from '../../support/database.js';

const publicRoutes = ['POST /session', 'GET /health'];

test('refuses every data route without a session', async () => {
  const container = await startDatabase();
  const routes: { method: HTTPMethods; url: string }[] = [];
  const app = await createApp((app) =>
    app
      .getHttpAdapter()
      .getInstance()
      .addHook('onRoute', ({ method, url }) => {
        routes.push(...[method].flat().map((verb) => ({ method: verb, url })));
      }),
  );

  const dataRoutes = routes.filter(
    ({ method, url }) =>
      method !== 'HEAD' &&
      !url.startsWith('/docs') &&
      !publicRoutes.includes(`${method} ${url}`),
  );
  expect(dataRoutes.length).toBeGreaterThan(0);
  for (const { method, url } of dataRoutes) {
    const response = await app.inject({ method, url });
    expect({ route: `${method} ${url}`, status: response.statusCode }).toEqual({
      route: `${method} ${url}`,
      status: 401,
    });
    expect(response.json()).toMatchObject({
      errorCode: 'missing_credentials',
    });
  }

  await app.close();
  await container.stop();
}, 120_000);

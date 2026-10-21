import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { expect, test, vi } from 'vitest';

test('reports the database as up, then as down', async () => {
  const container = await new PostgreSqlContainer(
    'pgvector/pgvector:0.8.7-pg18-trixie',
  ).start();
  vi.stubEnv('API_HOST', '127.0.0.1');
  vi.stubEnv('API_PORT', '3000');
  vi.stubEnv('DATABASE_URL', container.getConnectionUri());
  vi.stubEnv('MIGRATIONS_DATABASE_URL', container.getConnectionUri());
  const { AppModule } = await import('../src/app.module.js');
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const up = await app.inject({ method: 'GET', url: '/health' });
  expect(up.statusCode).toBe(200);
  expect(up.json()).toMatchObject({ status: 'ok' });

  await container.stop();
  const down = await app.inject({ method: 'GET', url: '/health' });
  expect(down.statusCode).toBe(503);
  expect(down.json()).toMatchObject({ status: 'error' });

  await app.close();
}, 120_000);

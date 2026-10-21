import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { vi } from 'vitest';
import { setUpApp } from '@core/setup.js';

export async function startDatabase(): Promise<StartedPostgreSqlContainer> {
  const container = await new PostgreSqlContainer(
    'pgvector/pgvector:0.8.7-pg18-trixie',
  ).start();
  vi.stubEnv('API_HOST', '127.0.0.1');
  vi.stubEnv('API_PORT', '3000');
  vi.stubEnv('DATABASE_URL', container.getConnectionUri());
  vi.stubEnv('MIGRATIONS_DATABASE_URL', container.getConnectionUri());
  await promisify(execFile)('bun', ['run', 'migration:run']);
  return container;
}

export async function createApp(
  beforeSetUp?: (app: NestFastifyApplication) => void,
): Promise<NestFastifyApplication> {
  const { AppModule } = await import('../../src/app.module.js');
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  beforeSetUp?.(app);
  setUpApp(app);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

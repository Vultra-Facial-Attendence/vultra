import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { TerminusModule, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import { expect, test } from 'vitest';
import { HealthController } from '../src/core/health.controller.js';
import { pinoHttpOptions } from '../src/core/logger.js';

test('redacts the cookie and authorization headers', async () => {
  const lines: string[] = [];
  const moduleRef = await Test.createTestingModule({
    imports: [
      LoggerModule.forRoot({
        pinoHttp: [pinoHttpOptions, { write: (line) => lines.push(line) }],
      }),
      TerminusModule,
    ],
    controllers: [HealthController],
  })
    .overrideProvider(TypeOrmHealthIndicator)
    .useValue({ pingCheck: () => ({ database: { status: 'up' } }) })
    .compile();
  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  await app.inject({
    method: 'GET',
    url: '/health',
    headers: {
      cookie: '__Host-sid=session-token',
      authorization: 'Bearer token',
    },
  });
  await app.close();

  const log = lines.join('');
  expect(log).not.toContain('session-token');
  expect(log).not.toContain('Bearer token');
  const request = lines
    .map(
      (line) =>
        JSON.parse(line) as { req?: { headers: Record<string, string> } },
    )
    .find((entry) => entry.req);
  expect(request?.req?.headers).toMatchObject({
    cookie: '[Redacted]',
    authorization: '[Redacted]',
  });
});

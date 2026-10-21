import { ConfigModule } from '@nestjs/config';
import { expect, test, vi } from 'vitest';
import { environmentSchema } from '@core/config/environment.js';

test('refuses to start without DATABASE_URL', async () => {
  vi.stubEnv('API_HOST', '127.0.0.1');
  vi.stubEnv('API_PORT', '3000');
  vi.stubEnv('DATABASE_URL', undefined);
  vi.stubEnv('MIGRATIONS_DATABASE_URL', 'postgres://owner@127.0.0.1/vultra');

  await expect(
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      validationSchema: environmentSchema,
    }),
  ).rejects.toThrow(
    /^Config validation error: [\s\S]*\bDATABASE_URL: Invalid input: expected string, received undefined$/m,
  );
});

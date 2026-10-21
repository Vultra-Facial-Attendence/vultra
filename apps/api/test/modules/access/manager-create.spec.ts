import password from '@inquirer/password';
import pg from 'pg';
import { expect, test, vi } from 'vitest';
import { startDatabase } from '../../support/database.js';

vi.mock('@inquirer/password', () => ({ default: vi.fn() }));

test('creates a manager, then refuses a repeated e-mail and a short password', async () => {
  const container = await startDatabase();
  const { createManager } =
    await import('@modules/access/commands/manager-create.command.js');
  const output = vi.spyOn(console, 'log');
  const errors = vi.spyOn(console, 'error');
  const typed = 'quinze-caracter';
  vi.mocked(password).mockResolvedValue(typed);

  expect(await createManager('Gestor@Example.com')).toBe(0);
  const client = new pg.Client({
    connectionString: container.getConnectionUri(),
  });
  await client.connect();
  const { rows } = await client.query<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM managers WHERE email = 'gestor@example.com'",
  );
  await client.end();
  expect(rows).toHaveLength(1);
  expect(rows[0].password_hash).toMatch(/^\$scrypt\$/);
  expect(output).toHaveBeenLastCalledWith(
    `Gestor ${rows[0].id} criado para gestor@example.com.`,
  );

  expect(await createManager('gestor@example.com')).toBe(1);
  expect(errors).toHaveBeenLastCalledWith(
    'Já existe um gestor com o e-mail gestor@example.com.',
  );

  vi.mocked(password).mockResolvedValue(typed.slice(1));
  expect(await createManager('outro@example.com')).toBe(1);
  expect(errors).toHaveBeenLastCalledWith(
    'A senha precisa ter de 15 a 128 caracteres.',
  );

  await container.stop();
}, 120_000);

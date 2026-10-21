import 'dotenv/config';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { environmentSchema } from '../environment.js';

const { MIGRATIONS_DATABASE_URL } = environmentSchema.parse(process.env);

export default new DataSource({
  type: 'postgres',
  url: MIGRATIONS_DATABASE_URL,
  migrations: [join(import.meta.dirname, 'migrations', '*.{ts,js}')],
});

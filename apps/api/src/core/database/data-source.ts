import 'dotenv/config';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { environmentSchema } from '../config/environment.js';

const { MIGRATIONS_DATABASE_URL } = environmentSchema.parse(process.env);

export default new DataSource({
  type: 'postgres',
  url: MIGRATIONS_DATABASE_URL,
  entities: [join(import.meta.dirname, '..', '..', '**', '*.entity.{ts,js}')],
  migrations: [join(import.meta.dirname, 'migrations', '*.{ts,js}')],
});

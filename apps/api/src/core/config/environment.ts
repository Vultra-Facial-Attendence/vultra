import { z } from 'zod';

const postgresUrl = z.url({ protocol: /^postgres(ql)?$/ });

export const environmentSchema = z.object({
  API_HOST: z.string().min(1),
  API_PORT: z.string().pipe(z.coerce.number<string>().int().min(1).max(65535)),
  DATABASE_URL: postgresUrl,
  MIGRATIONS_DATABASE_URL: postgresUrl,
});

export type Environment = z.infer<typeof environmentSchema>;

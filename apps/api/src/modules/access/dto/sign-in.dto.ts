import { z } from 'zod';

export const managerEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email());

export const signInBody = z.object({
  email: managerEmail,
  password: z.string().min(1).max(128),
});

export type SignInBody = z.infer<typeof signInBody>;

import type { Options } from 'pino-http';

export const pinoHttpOptions: Options = {
  redact: [
    'req.headers.cookie',
    'req.headers.authorization',
    'res.headers["set-cookie"]',
  ],
};
